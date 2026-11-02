"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MovementRequest } from "@/lib/supabase/types";

export interface AuthorizeMovementByChiefParams {
    requestId: string;
    chiefName: string;
    chiefIdNumber: string;
    chiefDepartment: string;
    signaturePath: string;
    authorizedArtworkIds: string[];
}

/**
 * Uploads a chief signature image (File or Blob) to the "signatures" bucket.
 * Destination path: chief_signatures/${requestId}_${Date.now()}.png
 * Returns the storage path within the bucket.
 */
export async function uploadChiefSignature(
    file: File | Blob,
    requestId: string
): Promise<string> {
    if (!requestId || requestId.trim() === "") {
        throw new Error("El ID de solicitud es obligatorio para guardar la firma.");
    }

    if (!file) {
        throw new Error("No se ha proporcionado ningún archivo de firma.");
    }

    const supabase = await getSupabaseServerClient();
    const timestamp = Date.now();
    const storagePath = `chief_signatures/${requestId}_${timestamp}.png`;

    // Convert File or Blob to Buffer for server storage upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(storagePath, buffer, {
            contentType: "image/png",
            upsert: true,
        });

    if (uploadError) {
        console.error("Error uploading chief signature:", uploadError);
        throw new Error(`Error al subir la firma del jefe: ${uploadError.message}`);
    }

    return storagePath;
}

/**
 * Authorizes an external movement request by Chief/Director.
 * 1. Validates that current status is 'pending_chief'.
 * 2. Saves snapshot of chief metadata and authorized artworks in 'movement_requests'.
 * 3. Transitions status to 'pending_security'.
 */
export async function authorizeMovementByChief(
    params: AuthorizeMovementByChiefParams
): Promise<void> {
    const {
        requestId,
        chiefName,
        chiefIdNumber,
        chiefDepartment,
        signaturePath,
        authorizedArtworkIds,
    } = params;

    // Early validation of parameters
    if (!requestId?.trim()) {
        throw new Error("El ID de solicitud es obligatorio.");
    }
    if (!chiefName?.trim()) {
        throw new Error("El nombre del jefe autorizante es obligatorio.");
    }
    if (!chiefIdNumber?.trim()) {
        throw new Error("La cédula o número de identificación del jefe es obligatoria.");
    }
    if (!chiefDepartment?.trim()) {
        throw new Error("El departamento o dependencia del jefe es obligatorio.");
    }
    if (!signaturePath?.trim()) {
        throw new Error("La ruta de la firma digital es obligatoria.");
    }
    if (!authorizedArtworkIds || authorizedArtworkIds.length === 0) {
        throw new Error("Debe autorizar al menos una obra de la solicitud.");
    }

    const supabase = await getSupabaseServerClient();

    // 1. Authenticate user
    const {
        data: { user },
        error: authUserError,
    } = await supabase.auth.getUser();

    if (authUserError || !user) {
        throw new Error("Usuario no autenticado.");
    }

    // 2. Fetch and validate current status is 'pending_chief'
    const { data: request, error: fetchError } = await supabase
        .from("movement_requests")
        .select("id, status, movement_type, artwork_ids")
        .eq("id", requestId)
        .single();

    if (fetchError || !request) {
        throw new Error("Solicitud de movimiento no encontrada.");
    }

    if (request.status !== "pending_chief") {
        throw new Error(
            `Operación inválida: la solicitud se encuentra en estado '${request.status}' y debe estar en 'pending_chief'.`
        );
    }

    // Validate that authorized artwork IDs belong to the requested artwork IDs
    if (request.artwork_ids && request.artwork_ids.length > 0) {
        const requestedSet = new Set(request.artwork_ids);
        const invalidArtworks = authorizedArtworkIds.filter((id) => !requestedSet.has(id));
        if (invalidArtworks.length > 0) {
            throw new Error("Se intentaron autorizar obras que no forman parte de la solicitud original.");
        }
    }

    const authorizedAt = new Date().toISOString();

    // 3. Update movement_requests: Save snapshot and transition to 'pending_security'
    const { error: updateError } = await supabase
        .from("movement_requests")
        .update({
            status: "pending_security",
            chief_name: chiefName.trim(),
            chief_id_number: chiefIdNumber.trim(),
            chief_department: chiefDepartment.trim(),
            chief_signature_path: signaturePath.trim(),
            chief_authorized_at: authorizedAt,
            authorized_artwork_ids: authorizedArtworkIds,
        })
        .eq("id", requestId)
        .eq("status", "pending_chief");

    if (updateError) {
        console.error("Error updating movement request by chief:", updateError);
        throw new Error(`Error al registrar el aval del jefe: ${updateError.message}`);
    }

    // 4. Audit Log
    const { error: auditError } = await supabase.from("audit_logs").insert({
        table_name: "movement_requests",
        record_id: requestId,
        action: "CHIEF_AUTHORIZED",
        new_data: {
            chief_name: chiefName.trim(),
            chief_id_number: chiefIdNumber.trim(),
            chief_department: chiefDepartment.trim(),
            chief_signature_path: signaturePath.trim(),
            chief_authorized_at: authorizedAt,
            authorized_artwork_ids: authorizedArtworkIds,
            status: "pending_security",
        } as any,
        changed_by: user.id,
    });

    if (auditError) {
        console.warn("Audit log warning on chief authorization:", auditError.message);
    }

    // 5. Revalidate cache
    revalidatePath("/chief-portal");
    revalidatePath("/security-portal");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/artworks");
}

/**
 * Rejects an external movement request by Chief/Director.
 * Transitions status to 'rejected'.
 */
export async function rejectMovementByChief(
    requestId: string,
    reason: string
): Promise<void> {
    if (!requestId?.trim()) {
        throw new Error("El ID de solicitud es obligatorio.");
    }
    if (!reason?.trim()) {
        throw new Error("Debe especificar un motivo de rechazo.");
    }

    const supabase = await getSupabaseServerClient();

    // 1. Authenticate user
    const {
        data: { user },
        error: authUserError,
    } = await supabase.auth.getUser();

    if (authUserError || !user) {
        throw new Error("Usuario no autenticado.");
    }

    // 2. Fetch and validate current status is 'pending_chief'
    const { data: request, error: fetchError } = await supabase
        .from("movement_requests")
        .select("id, status")
        .eq("id", requestId)
        .single();

    if (fetchError || !request) {
        throw new Error("Solicitud de movimiento no encontrada.");
    }

    if (request.status !== "pending_chief") {
        throw new Error(
            `Operación inválida: la solicitud se encuentra en estado '${request.status}' y debe estar en 'pending_chief'.`
        );
    }

    // 3. Transition status to 'rejected'
    const { error: updateError } = await supabase
        .from("movement_requests")
        .update({
            status: "rejected",
        })
        .eq("id", requestId)
        .eq("status", "pending_chief");

    if (updateError) {
        console.error("Error rejecting movement request by chief:", updateError);
        throw new Error(`Error al rechazar la solicitud: ${updateError.message}`);
    }

    // 4. Audit Log
    const { error: auditError } = await supabase.from("audit_logs").insert({
        table_name: "movement_requests",
        record_id: requestId,
        action: "CHIEF_REJECTED",
        new_data: {
            reason: reason.trim(),
            status: "rejected",
        } as any,
        changed_by: user.id,
    });

    if (auditError) {
        console.warn("Audit log warning on chief rejection:", auditError.message);
    }

    // 5. Revalidate cache
    revalidatePath("/chief-portal");
    revalidatePath("/security-portal");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/artworks");
}

/**
 * Fetches all movement requests currently pending Chief approval ('pending_chief').
 * Ordered by creation date descending.
 */
export async function getPendingChiefRequests(): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("status", "pending_chief")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error in getPendingChiefRequests:", error);
        return [];
    }

    return (data ?? []) as MovementRequest[];
}

/**
 * Fetches historical movement requests that have passed through or been evaluated by Chief.
 * Includes external requests that were authorized (now pending_security or authorized)
 * or rejected, as well as any requests with chief_authorized_at set.
 * Ordered by creation date descending.
 */
export async function getChiefHistory(limit = 20): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("movement_type", "external")
        .neq("status", "pending_chief")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error in getChiefHistory:", error);
        return [];
    }

    return (data ?? []) as MovementRequest[];
}

/**
 * Helper to fetch the artworks and their primary images for a specific movement request.
 */
export async function getRequestArtworks(requestId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: request, error: reqError } = await supabase
        .from("movement_requests")
        .select("artwork_ids, authorized_artwork_ids")
        .eq("id", requestId)
        .single();

    if (reqError || !request?.artwork_ids?.length) return [];

    const { data: artworks, error } = await supabase
        .from("artworks")
        .select("id, title, inventory_number, author, technique, artwork_location, media_assets(storage_path, is_primary)")
        .in("id", request.artwork_ids as string[]);

    if (error) {
        console.error("Error fetching request artworks for chief:", error);
        return [];
    }

    return artworks ?? [];
}
