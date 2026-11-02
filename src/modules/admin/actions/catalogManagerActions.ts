"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CatalogCategory = "technique" | "category" | "provenance" | "location" | "investigador";

export interface CatalogOption {
    id?: string;
    category: string;
    value: string;
    is_active: boolean;
}

/**
 * Get all options for a specific category
 */
export async function getCatalogOptionsAction(category: CatalogCategory) {
    const supabase = await getSupabaseServerClient();

    // For location, we might need a different strategy if it's not in catalog_options
    // But per plan, we will handle locations via distinct query if needed, 
    // or if the user wants to manage them as explicit options.
    // For now, let's assume they might want to "manage" locations that are used in the autocomplete.

    if (category === "location") {
        // Locations are strictly derived from usage in this system design, 
        // but to allow "renaming", we fetch distinct values.
        const { data: artworks } = await supabase
            .from("artworks")
            .select("artwork_location")
            .not("artwork_location", "is", null);

        const { data: movements } = await supabase
            .from("artwork_movements")
            .select("location");

        const locations = new Set<string>();
        artworks?.forEach(a => a.artwork_location && locations.add(a.artwork_location.trim()));
        movements?.forEach(m => m.location && locations.add(m.location.trim()));

        return Array.from(locations).sort().map(loc => ({
            category: "location",
            value: loc,
            is_active: true
        }));
    }

    const { data, error } = await supabase
        .from("catalog_options")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("value");

    if (error) throw new Error(error.message);
    return data as CatalogOption[];
}

/**
 * Add a new option
 */
export async function addCatalogOptionAction(category: CatalogCategory, value: string) {
    const supabase = await getSupabaseServerClient();

    if (category === "location") {
        // Locations are just strings in the DB, so "adding" one specifically 
        // doesn't mean much unless we have a specific table. 
        // For now, we'll skip adding 'unused' locations to keep it simple 
        // unless we migrate to a strict locations table.
        // We'll return mock success for now as the user will just type it in the autocomplete.
        return { success: true, message: "Las ubicaciones se crean al usarlas en una obra." };
    }

    const { error } = await supabase
        .from("catalog_options")
        .insert({ category, value, is_active: true });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/settings/catalog");
    return { success: true };
}

/**
 * Rename an option and batch update all artworks using it
 */
export async function renameCatalogOptionAction(
    category: CatalogCategory,
    oldValue: string,
    newValue: string
) {
    const supabase = await getSupabaseServerClient();

    try {
        // 1. Update the catalog option itself (if it exists in the table)
        if (category !== "location") {
            await supabase
                .from("catalog_options")
                .update({ value: newValue })
                .eq("category", category)
                .eq("value", oldValue);
        }

        // 2. Batch update Artworks table
        // Map category to column name
        const columnMap: Record<string, string> = {
            technique: "technique",
            category: "category",
            provenance: "provenance",
            location: "artwork_location",
            investigador: "biography_researcher"
        };

        const column = columnMap[category];
        if (column) {
            const { error: artworkError } = await supabase
                .from("artworks")
                .update({ [column]: newValue })
                .eq(column, oldValue);

            if (artworkError) throw artworkError;
        }

        // 3. Special handling for Location -> Update Movements history too
        if (category === "location") {
            const { error: moveError } = await supabase
                .from("artwork_movements")
                .update({ location: newValue })
                .eq("location", oldValue);

            if (moveError) throw moveError;
        }

        revalidatePath("/dashboard/settings/catalog");
        revalidatePath("/dashboard/artworks");
        return { success: true, message: `Se actualizó "${oldValue}" a "${newValue}" en todas las obras.` };

    } catch (error: any) {
        console.error("Rename error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete (Soft Delete) an option
 */
export async function deleteCatalogOptionAction(category: CatalogCategory, value: string) {
    const supabase = await getSupabaseServerClient();

    if (category === "location") {
        return { success: false, error: "No se pueden eliminar ubicaciones que están en uso histórico." };
    }

    const { error } = await supabase
        .from("catalog_options")
        .update({ is_active: false })
        .eq("category", category)
        .eq("value", value);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/settings/catalog");
    return { success: true };
}
