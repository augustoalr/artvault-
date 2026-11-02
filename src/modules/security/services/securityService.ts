"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MovementRequest } from "@/lib/supabase/types";

// ─── Queries ──────────────────────────────────────────────────────────────

/** Security Portal: requests awaiting security authorization. */
export async function getPendingRequests(): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("status", "pending_security")
        .order("created_at", { ascending: false });
    if (error) { console.error("getPendingRequests:", error); return []; }
    return data as MovementRequest[];
}

/** Bienes Portal: requests awaiting Bienes Nacionales approval. */
export async function getRequestsForBienes(): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("status", "pending_bienes")
        .order("created_at", { ascending: false });
    if (error) { console.error("getRequestsForBienes:", error); return []; }
    return data as MovementRequest[];
}

/** History tab: recently resolved requests (authorized or rejected). */
export async function getHistoricalRequests(limit = 15): Promise<MovementRequest[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("movement_requests")
        .select("*")
        .in("status", ["authorized", "rejected"])
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) { console.error("getHistoricalRequests:", error); return []; }
    return data as MovementRequest[];
}

/** Dashboard TransfersWidget: live summary of all active + today's authorized requests. */
export async function getActiveRequestsSummary(): Promise<{
    pendingBienes: MovementRequest[];
    pendingSecurity: MovementRequest[];
    authorizedToday: MovementRequest[];
}> {
    const supabase = await getSupabaseServerClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [bienesRes, securityRes, todayRes] = await Promise.all([
        supabase.from("movement_requests").select("*").eq("status", "pending_bienes").order("created_at", { ascending: false }),
        supabase.from("movement_requests").select("*").eq("status", "pending_security").order("created_at", { ascending: false }),
        supabase.from("movement_requests").select("*").eq("status", "authorized").gte("authorized_at", todayStart.toISOString()).order("authorized_at", { ascending: false }),
    ]);

    return {
        pendingBienes: (bienesRes.data as MovementRequest[]) ?? [],
        pendingSecurity: (securityRes.data as MovementRequest[]) ?? [],
        authorizedToday: (todayRes.data as MovementRequest[]) ?? [],
    };
}

/** Fetches artworks for a request (used in both portals). */
export async function getRequestArtworks(requestId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: request } = await supabase
        .from("movement_requests")
        .select("artwork_ids, authorized_artwork_ids")
        .eq("id", requestId)
        .single();

    const targetArtworkIds = (request?.authorized_artwork_ids && request.authorized_artwork_ids.length > 0 ? request.authorized_artwork_ids : request?.artwork_ids) as string[] ?? [];
    if (!targetArtworkIds.length) return [];

    const { data: artworks, error } = await supabase
        .from("artworks")
        .select("id, title, inventory_number, author, technique, artwork_location, media_assets(storage_path, is_primary)")
        .in("id", targetArtworkIds);

    if (error) { console.error("getRequestArtworks:", error); return []; }
    return artworks ?? [];
}

// ─── Actions ──────────────────────────────────────────────────────────────

interface ActionResult { success: boolean; error?: string; }

/** Bienes Nacionales approves → moves to pending_security. */
export async function approveBienesAction(
    requestId: string,
    bienesOfficerName: string,
    bienesOfficerId: string,
    purpose: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { error } = await supabase
        .from("movement_requests")
        .update({
            status: "pending_security",
            purpose,
            bienes_officer_name: bienesOfficerName,
            bienes_officer_id: bienesOfficerId,
            bienes_approved_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending_bienes");

    if (error) return { success: false, error: "Error al aprobar: " + error.message };

    await supabase.from("audit_logs").insert({
        table_name: "movement_requests", record_id: requestId,
        action: "BIENES_APPROVED",
        new_data: { bienes_officer_name: bienesOfficerName, purpose } as any,
        changed_by: user.id,
    });

    revalidatePath("/bienes-portal");
    revalidatePath("/security-portal");
    revalidatePath("/dashboard");
    return { success: true };
}

/** Rejects a request at any stage (Bienes or Security). */
export async function rejectRequestAction(
    requestId: string,
    rejectedByName: string,
    reason?: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { error } = await supabase
        .from("movement_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)
        .in("status", ["pending_bienes", "pending_security"]);

    if (error) return { success: false, error: "Error al rechazar: " + error.message };

    await supabase.from("audit_logs").insert({
        table_name: "movement_requests", record_id: requestId,
        action: "REJECTED",
        new_data: { rejected_by: rejectedByName, reason } as any,
        changed_by: user.id,
    });

    revalidatePath("/bienes-portal");
    revalidatePath("/security-portal");
    revalidatePath("/dashboard");
    return { success: true };
}

/** Security officer authorizes → executes movements in DB. */
export async function authorizeRequestAction(
    requestId: string,
    officerName: string,
    officerId: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { data: request, error: reqError } = await supabase
        .from("movement_requests")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pending_security")
        .single();

    if (reqError || !request) return { success: false, error: "Solicitud no encontrada o ya procesada" };

    const artworkIds = (
        request.authorized_artwork_ids && request.authorized_artwork_ids.length > 0
            ? request.authorized_artwork_ids
            : request.artwork_ids
    ) as string[] ?? [];
    if (!artworkIds.length) return { success: false, error: "Solicitud sin obras" };

    // Close open movements
    const { data: openMovements } = await supabase
        .from("artwork_movements").select("id")
        .in("artwork_id", artworkIds).is("date_to", null);

    if (openMovements?.length) {
        await supabase.from("artwork_movements")
            .update({ date_to: new Date().toISOString() })
            .in("id", openMovements.map(m => m.id));
    }

    // Create new movements
    const { error: moveError } = await supabase.from("artwork_movements").insert(
        artworkIds.map(id => ({
            artwork_id: id,
            location: request.destination,
            date_from: new Date().toISOString(),
            created_by: user.id,
            request_id: request.id,
            notes: request.purpose ? `Propósito: ${request.purpose}` : null,
        }))
    );
    if (moveError) return { success: false, error: "Error al registrar movimientos: " + moveError.message };

    // Sync artwork locations
    await supabase.from("artworks").update({ artwork_location: request.destination }).in("id", artworkIds);

    // Mark authorized
    const { error: authError } = await supabase.from("movement_requests").update({
        status: "authorized",
        authorized_at: new Date().toISOString(),
        authorized_by_user_id: user.id,
        security_officer_name: officerName,
        security_officer_id: officerId,
    }).eq("id", requestId);

    if (authError) return { success: false, error: "Error al firmar: " + authError.message };

    await supabase.from("audit_logs").insert({
        table_name: "movement_requests", record_id: requestId,
        action: "AUTHORIZED",
        new_data: { security_officer_name: officerName, destination: request.destination } as any,
        changed_by: user.id,
    });

    revalidatePath("/security-portal");
    revalidatePath("/chief-portal");
    revalidatePath("/dashboard/artworks");
    revalidatePath("/dashboard");
    return { success: true };
}
