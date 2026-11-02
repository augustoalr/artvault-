/**
 * Inventory Actions — Server Actions for artwork CRUD + valuations.
 * Handles create, update, soft-delete, restore, and valuation operations.
 */
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

interface ArtworkFormData {
    inventory_number: string;
    title: string;
    author?: string | null;
    year?: string | null;
    category?: string | null;
    technique?: string | null;
    dimensions?: string | null;
    provenance?: string | null;
    entry_date?: string | null;
    original_owner?: string | null;
    owner_address?: string | null;
    artwork_location?: string | null;
    photo_type?: string | null;
    photographer?: string | null;
    author_biography?: string | null;
    biography_researcher?: string | null;
    mounting_description?: string | null;
    general_observations?: string | null;
    reviewed_by?: string | null;
    tags?: string[];
    completion_percentage?: number;
}

interface ActionResult {
    success: boolean;
    error?: string;
    id?: string;
}

export async function createArtworkAction(
    data: ArtworkFormData
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    const { data: artwork, error } = await supabase
        .from("artworks")
        .insert({
            ...data,
            created_by: user.id,
            registered_by: user.id,
        })
        .select("id")
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    // Audit log
    await supabase.from("audit_logs").insert({
        table_name: "artworks",
        record_id: artwork.id,
        action: "INSERT",
        new_data: data as unknown as Json,
        changed_by: user.id,
    });

    revalidatePath("/dashboard/artworks");
    revalidatePath("/");

    return { success: true, id: artwork.id };
}

export async function updateArtworkAction(
    id: string,
    data: Partial<ArtworkFormData>
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    // Get old data for audit
    const { data: oldArtwork } = await supabase
        .from("artworks")
        .select("*")
        .eq("id", id)
        .single();

    const { error } = await supabase
        .from("artworks")
        .update(data)
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    // Audit log
    await supabase.from("audit_logs").insert({
        table_name: "artworks",
        record_id: id,
        action: "UPDATE",
        old_data: oldArtwork as unknown as Json,
        new_data: data as unknown as Json,
        changed_by: user.id,
    });

    // Sync: If location changed, record movement history automatically
    if (oldArtwork && data.artwork_location && data.artwork_location !== oldArtwork.artwork_location) {
        const { error: moveError } = await supabase
            .from("artwork_movements")
            .insert({
                artwork_id: id,
                location: data.artwork_location,
                date_from: new Date().toISOString().split('T')[0], // Today
                created_by: user.id,
                notes: "Actualización automática desde ficha técnica"
            });

        if (moveError) {
            console.error("Error auto-creating movement history:", moveError);
        }
    }

    revalidatePath("/dashboard/artworks");
    revalidatePath("/");

    return { success: true, id };
}

export async function softDeleteArtworkAction(
    id: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    const { error } = await supabase
        .from("artworks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    // Audit log
    await supabase.from("audit_logs").insert({
        table_name: "artworks",
        record_id: id,
        action: "SOFT_DELETE",
        changed_by: user.id,
    });

    revalidatePath("/dashboard/artworks");
    revalidatePath("/");

    return { success: true };
}

export async function restoreArtworkAction(
    id: string
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    const { error } = await supabase
        .from("artworks")
        .update({ deleted_at: null })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    await supabase.from("audit_logs").insert({
        table_name: "artworks",
        record_id: id,
        action: "RESTORE",
        changed_by: user.id,
    });

    revalidatePath("/dashboard/artworks");
    revalidatePath("/");

    return { success: true };
}

// ─── Valuation ───

interface ValuationData {
    value_bs?: number;
    value_usd?: number;
    appraisal_date?: string;
    approved_by?: string;
    reviewed_by?: string;
}

export async function saveValuationAction(
    artworkId: string,
    data: ValuationData
): Promise<ActionResult> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    // Upsert: check if valuation exists for this artwork
    const { data: existing } = await supabase
        .from("artwork_valuations")
        .select("id")
        .eq("artwork_id", artworkId)
        .maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from("artwork_valuations")
            .update({
                value_bs: data.value_bs ?? null,
                value_usd: data.value_usd ?? null,
                appraisal_date: data.appraisal_date ?? null,
                approved_by: data.approved_by ?? null,
                reviewed_by: data.reviewed_by ?? null,
            })
            .eq("id", existing.id);

        if (error) return { success: false, error: error.message };
    } else {
        const { error } = await supabase
            .from("artwork_valuations")
            .insert({
                artwork_id: artworkId,
                value_bs: data.value_bs ?? null,
                value_usd: data.value_usd ?? null,
                appraisal_date: data.appraisal_date ?? null,
                approved_by: data.approved_by ?? null,
                reviewed_by: data.reviewed_by ?? null,
                registered_by: user.id,
            });

        if (error) return { success: false, error: error.message };
    }

    return { success: true };
}
