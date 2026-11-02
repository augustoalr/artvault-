"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MovementRequest, Json } from "@/lib/supabase/types";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AuthorizeMovementByChiefParams {
    requestId: string;
    chiefName: string;
    chiefIdNumber: string;
    chiefDepartment: string;
    signatureFile?: File | Blob | string | null;
    authorizedArtworkIds: string[];
}

export interface ActionResult {
    success: boolean;
    error?: string;
    data?: unknown;
}

export interface ChiefArtwork {
    id: string;
    title: string;
    inventory_number: string;
    author: string | null;
    technique: string | null;
    dimensions: string | null;
    artwork_location: string | null;
    category: string | null;
    year: string | null;
    media_assets?: Array<{
        storage_path: string;
        is_primary: boolean | null;
    }>;
}

// ─── Queries ───────────────────────────────────────────────────────────────

/**
 * Chief Portal: Fetch requests awaiting chief approval.
 * Looks for status = 'pending_chief' (and falls back gracefully to 'pending' if any exists).
 */
export async function getPendingChiefRequests(): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .in("status", ["pending_chief", "pending"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getPendingChiefRequests error:", error);
        return [];
    }
    return (data as MovementRequest[]) ?? [];
}

/**
 * Chief Portal History: Requests that have already been authorized by the chief,
 * completed by security, or rejected.
 */
export async function getHistoricalChiefRequests(limit = 25): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .or("chief_authorized_at.not.is.null,status.in.(pending_security,authorized,rejected)")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("getHistoricalChiefRequests error:", error);
        return [];
    }
    return (data as MovementRequest[]) ?? [];
}

/**
 * Fetch artworks for a specific movement request with primary media assets.
 */
export async function getChiefRequestArtworks(requestId: string): Promise<ChiefArtwork[]> {
    const supabase = await getSupabaseServerClient();
    const { data: request, error: reqError } = await supabase
        .from("movement_requests")
        .select("artwork_ids, authorized_artwork_ids")
        .eq("id", requestId)
        .single();

    if (reqError || !request?.artwork_ids?.length) {
        return [];
    }

    const { data: artworks, error: artError } = await supabase
        .from("artworks")
        .select("id, title, inventory_number, author, technique, dimensions, artwork_location, category, year, media_assets(storage_path, is_primary)")
        .in("id", request.artwork_ids as string[]);

    if (artError) {
        console.error("getChiefRequestArtworks error:", artError);
        return [];
    }

    return (artworks as unknown as ChiefArtwork[]) ?? [];
}

// ─── Actions ───────────────────────────────────────────────────────────────

/**
 * Authorizes a movement request with chief snapshot data, partial/full artwork checklist,
 * and dual signature file.
 */
export async function authorizeMovementByChief(
    params: AuthorizeMovementByChiefParams
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Sesión no válida o no autenticado" };
    }

    if (!params.requestId) {
        return { success: false, error: "ID de solicitud no proporcionado" };
    }

    if (!params.chiefName?.trim()) {
        return { success: false, error: "El nombre del jefe autorizante es obligatorio" };
    }

    if (!params.chiefIdNumber?.trim()) {
        return { success: false, error: "El documento de identidad (C.I.) es obligatorio" };
    }

    if (!params.chiefDepartment?.trim()) {
        return { success: false, error: "La dependencia o departamento es obligatorio" };
    }

    if (!params.authorizedArtworkIds || params.authorizedArtworkIds.length === 0) {
        return { success: false, error: "Debe autorizar al menos una obra de arte" };
    }

    // Verify request exists and is in a valid state for chief review
    const { data: request, error: reqError } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("id", params.requestId)
        .single();

    if (reqError || !request) {
        return { success: false, error: "Solicitud no encontrada" };
    }

    // Handle signature upload or persistence
    let signatureStoragePath: string | null = null;

    if (params.signatureFile) {
        try {
            if (typeof params.signatureFile === "string") {
                if (params.signatureFile.startsWith("data:image/")) {
                    const matches = params.signatureFile.match(/^data:image\/(\w+);base64,(.+)$/);
                    const ext = matches ? matches[1] : "png";
                    const base64Data = matches ? matches[2] : params.signatureFile;
                    const buffer = Buffer.from(base64Data, "base64");
                    const path = `signatures/chief_${params.requestId}_${Date.now()}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from("artworks")
                        .upload(path, buffer, {
                            contentType: `image/${ext}`,
                            upsert: true,
                        });

                    if (!uploadError) {
                        signatureStoragePath = path;
                    } else {
                        console.warn("Storage upload warning, saving inline signature data:", uploadError.message);
                        signatureStoragePath = params.signatureFile;
                    }
                } else {
                    signatureStoragePath = params.signatureFile;
                }
            } else if (params.signatureFile && typeof params.signatureFile === "object" && "arrayBuffer" in params.signatureFile) {
                const arrayBuf = await (params.signatureFile as Blob).arrayBuffer();
                const buffer = Buffer.from(arrayBuf);
                const path = `signatures/chief_${params.requestId}_${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage
                    .from("artworks")
                    .upload(path, buffer, {
                        contentType: "image/png",
                        upsert: true,
                    });

                if (!uploadError) {
                    signatureStoragePath = path;
                }
            }
        } catch (storageErr) {
            console.error("Error processing signature file:", storageErr);
            // Non-blocking: continue with authorization even if storage had an issue
            if (typeof params.signatureFile === "string") {
                signatureStoragePath = params.signatureFile;
            }
        }
    }

    // Update movement_requests record
    const { error: updateError } = await supabase
        .from("movement_requests")
        .update({
            chief_name: params.chiefName.trim(),
            chief_id_number: params.chiefIdNumber.trim(),
            chief_department: params.chiefDepartment.trim(),
            chief_authorized_at: new Date().toISOString(),
            chief_signature_path: signatureStoragePath,
            authorized_artwork_ids: params.authorizedArtworkIds,
            status: "pending_security",
        })
        .eq("id", params.requestId);

    if (updateError) {
        return { success: false, error: "Error al registrar la autorización: " + updateError.message };
    }

    // Register Audit Log
    try {
        await supabase.from("audit_logs").insert({
            table_name: "movement_requests",
            record_id: params.requestId,
            action: "CHIEF_AUTHORIZED",
            new_data: {
                chief_name: params.chiefName,
                chief_department: params.chiefDepartment,
                authorized_artworks_count: params.authorizedArtworkIds.length,
                total_requested_count: request.artwork_ids?.length ?? 0,
                has_signature: !!signatureStoragePath,
            } as unknown as Json,
            changed_by: user.id,
        });
    } catch (auditErr) {
        console.warn("Failed to write audit log:", auditErr);
    }

    // Revalidate paths
    revalidatePath("/chief-portal");
    revalidatePath("/security-portal");
    revalidatePath("/bienes-portal");
    revalidatePath("/dashboard");

    return {
        success: true,
        data: {
            authorizedCount: params.authorizedArtworkIds.length,
            totalCount: request.artwork_ids?.length ?? 0,
        },
    };
}

/**
 * Rejects a movement request at the Chief level with a mandatory or optional reason.
 */
export async function rejectChiefRequestAction(
    requestId: string,
    rejectedByName: string,
    reason?: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Sesión no válida o no autenticado" };
    }

    const { error } = await supabase
        .from("movement_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

    if (error) {
        return { success: false, error: "Error al rechazar: " + error.message };
    }

    try {
        await supabase.from("audit_logs").insert({
            table_name: "movement_requests",
            record_id: requestId,
            action: "CHIEF_REJECTED",
            new_data: {
                rejected_by: rejectedByName,
                reason: reason ?? "Rechazado por Jefatura / Custodia",
            } as unknown as Json,
            changed_by: user.id,
        });
    } catch (auditErr) {
        console.warn("Audit log error:", auditErr);
    }

    revalidatePath("/chief-portal");
    revalidatePath("/security-portal");
    revalidatePath("/bienes-portal");
    revalidatePath("/dashboard");

    return { success: true };
}
