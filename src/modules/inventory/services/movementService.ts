/**
 * Movement Service — Server-side logic for artwork movements.
 * Handles persistence and auditing of location changes.
 */
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ArtworkMovement } from "@/lib/supabase/types";
import { getOrganizationSettings } from "@/modules/admin/services/organizationSettingsService";
import { resolveNextStatus } from "./workflowResolver";

interface CreateMovementData {
    artwork_id: string;
    location: string;
    date_from: string;
    date_to?: string | null;
    notes?: string | null;
}

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Registers a new movement/location for an artwork.
 */
export async function createMovementAction(
    data: CreateMovementData
): Promise<ActionResult<ArtworkMovement>> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "No autenticado." };
    }

    // 1. Close ALL current active movements (to fix potential data inconsistencies)
    const { data: openMovements } = await supabase
        .from("artwork_movements")
        .select("id")
        .eq("artwork_id", data.artwork_id)
        .is("date_to", null);

    if (openMovements && openMovements.length > 0) {
        const ids = openMovements.map(m => m.id);
        await supabase
            .from("artwork_movements")
            .update({ date_to: data.date_from })
            .in("id", ids);
    }

    // 2. Create the new movement
    const { data: movement, error } = await supabase
        .from("artwork_movements")
        .insert({
            ...data,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating movement:", error);
        return { success: false, error: error.message };
    }

    // Optional: Log audit if needed (audit_logs table already exists)
    await supabase.from("audit_logs").insert({
        table_name: "artwork_movements",
        record_id: movement.id,
        action: "INSERT",
        new_data: data as any,
        changed_by: user.id,
    });

    // Sync: Update the main artwork location
    const { error: updateError } = await supabase
        .from("artworks")
        .update({ artwork_location: data.location })
        .eq("id", data.artwork_id);

    if (updateError) {
        console.error("Error syncing artwork location:", updateError);
        // We don't fail the whole action, but we should log it.
    }

    revalidatePath(`/dashboard/artworks/${data.artwork_id}`);

    return { success: true, data: movement };
}

/**
 * Fetches the movement history for a specific artwork.
 */
export async function getArtworkMovements(artworkId: string): Promise<ArtworkMovement[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("artwork_movements")
        .select("*")
        .eq("artwork_id", artworkId)
        .order("date_from", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching movements:", error);
        return [];
    }

    return data as ArtworkMovement[];
}

/**
 * Fetches distinct locations from the movement history for autocomplete.
 */
export async function getDistinctLocations(): Promise<string[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("artwork_movements")
        .select("location")
        .not("location", "is", null);

    if (error) {
        console.error("Error fetching distinct locations:", error);
        return [];
    }

    const unique = [...new Set(data.map(d => d.location))].filter(Boolean) as string[];
    return unique.sort();
}

/**
 * Creates a batch movement request using the Configurable Workflow Engine.
 * Resolves initial status based on movement type (internal vs external) and organization settings.
 */
export async function createBatchMovementAction(data: {
    artwork_ids: string[];
    destination: string;
    movement_type: "internal" | "external";
    responsible_name?: string;
    responsible_id_number?: string;
}): Promise<ActionResult<{ requestId: string }>> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado" };
    if (!data.artwork_ids || !data.artwork_ids.length) return { success: false, error: "La cesta está vacía" };

    // Resolve initial status according to configurable workflow engine
    const settings = await getOrganizationSettings();
    const initialStatus = resolveNextStatus({
        movementType: data.movement_type,
        settings,
        action: "create",
    });

    const isDirectlyAuthorized = initialStatus === "authorized";
    const now = new Date().toISOString();

    const insertPayload: any = {
        movement_type: data.movement_type,
        destination: data.destination,
        artwork_ids: data.artwork_ids,
        responsible_name: data.responsible_name,
        responsible_id_number: data.responsible_id_number,
        status: initialStatus,
        created_by: user.id,
    };

    if (isDirectlyAuthorized) {
        insertPayload.authorized_at = now;
        insertPayload.authorized_by_user_id = user.id;
    }

    // 1. Create the Request
    const { data: request, error: reqError } = await supabase
        .from("movement_requests")
        .insert(insertPayload)
        .select()
        .single();

    if (reqError) {
        console.error("Error creating batch request:", reqError);
        return { success: false, error: "Error al crear la solicitud: " + reqError.message };
    }

    // If completely authorized (no intermediate checkpoints required), execute movements immediately
    if (isDirectlyAuthorized) {
        const { data: openMovements } = await supabase
            .from("artwork_movements")
            .select("id")
            .in("artwork_id", data.artwork_ids)
            .is("date_to", null);

        if (openMovements?.length) {
            await supabase
                .from("artwork_movements")
                .update({ date_to: now })
                .in("id", openMovements.map(m => m.id));
        }

        await supabase.from("artwork_movements").insert(
            data.artwork_ids.map(id => ({
                artwork_id: id,
                location: data.destination,
                date_from: now,
                created_by: user.id,
                request_id: request.id,
            }))
        );

        await supabase
            .from("artworks")
            .update({ artwork_location: data.destination })
            .in("id", data.artwork_ids);
    }

    // Revalidate paths
    revalidatePath("/dashboard/artworks");
    revalidatePath("/security-portal");
    revalidatePath("/bienes-portal");
    revalidatePath("/chief-portal");
    revalidatePath("/dashboard");

    return { success: true, data: { requestId: request.id } };
}
