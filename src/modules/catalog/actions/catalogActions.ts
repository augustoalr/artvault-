/**
 * Catalog Actions — Server Actions for advanced search and data retrieval.
 * Used by Dashboard (PDF export, filtered lists) and Public Catalog.
 */
"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Artwork, MediaAsset } from "@/lib/supabase/types";

export interface AdvancedFilters {
    search?: string;          // Global search term
    inventory_number?: string;
    author?: string;
    title?: string;
    technique?: string;
    category?: string;
    provenance?: string;
    year_from?: number;
    year_to?: number;
    include_deleted?: boolean; // Admin only
    page?: number;
    pageSize?: number;
}

export interface ArtworkSearchResult extends Artwork {
    primary_image_path?: string | null; // storage path
    primary_image_url?: string | null;  // signed/public url
}

function buildQuery(supabase: any, filters: AdvancedFilters) {
    let query = supabase.from("artworks").select("*", { count: "exact", head: false });

    // Global search
    if (filters.search) {
        const term = filters.search;
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,inventory_number.ilike.%${term}%`);
    }

    // Specific filters
    if (filters.inventory_number) query = query.ilike("inventory_number", `%${filters.inventory_number}%`);
    if (filters.author) query = query.ilike("author", `%${filters.author}%`);
    if (filters.title) query = query.ilike("title", `%${filters.title}%`);
    if (filters.technique) query = query.eq("technique", filters.technique);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.provenance) query = query.eq("provenance", filters.provenance);

    // Soft delete
    if (!filters.include_deleted) {
        query = query.is("deleted_at", null);
    }

    return query;
}

export async function searchArtworksAction(
    filters: AdvancedFilters
): Promise<{ data: ArtworkSearchResult[]; count: number; error?: string }> {
    const supabase = await getSupabaseServerClient();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("artworks")
        .select(`
            *,
            media_assets(storage_path, is_primary)
        `, { count: "exact" });

    // Apply filters (duplicate logic, should extract but 'query' object is specific to select string)
    // Global search
    if (filters.search) {
        const term = filters.search;
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,inventory_number.ilike.%${term}%`);
    }
    if (filters.inventory_number) query = query.ilike("inventory_number", `%${filters.inventory_number}%`);
    if (filters.author) query = query.ilike("author", `%${filters.author}%`);
    if (filters.title) query = query.ilike("title", `%${filters.title}%`);
    if (filters.technique) query = query.eq("technique", filters.technique);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.provenance) query = query.eq("provenance", filters.provenance);

    // Soft delete
    if (!filters.include_deleted) {
        query = query.is("deleted_at", null);
    }

    query = query
        .order("created_at", { ascending: false })
        .range(from, to);

    const { data, count, error } = await query;

    if (error) {
        console.error("Search error:", error);
        return { data: [], count: 0, error: error.message };
    }

    // Process media and return flat structure
    const results: ArtworkSearchResult[] = (data ?? []).map((row: any) => {
        const media = row.media_assets as { storage_path: string; is_primary: boolean }[] | null;
        const primary = media?.find((m) => m.is_primary);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { media_assets, ...artwork } = row;

        let publicUrl = null;
        if (primary?.storage_path) {
            const { data: url } = supabase.storage
                .from("artworks")
                .getPublicUrl(primary.storage_path);
            publicUrl = url.publicUrl;
        }

        return {
            ...artwork,
            primary_image_path: primary?.storage_path ?? null,
            primary_image_url: publicUrl,
        };
    });

    return { data: results, count: count ?? 0 };
}

/**
 * Get ALL matching IDs for export (ignoring pagination).
 */
export async function getAllArtworkIdsAction(filters: AdvancedFilters): Promise<string[]> {
    const supabase = await getSupabaseServerClient();

    // Build query just for IDs
    let query = supabase.from("artworks").select("id");

    if (filters.search) {
        const term = filters.search;
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,inventory_number.ilike.%${term}%`);
    }
    if (filters.inventory_number) query = query.ilike("inventory_number", `%${filters.inventory_number}%`);
    if (filters.author) query = query.ilike("author", `%${filters.author}%`);
    if (filters.title) query = query.ilike("title", `%${filters.title}%`);
    if (filters.technique) query = query.eq("technique", filters.technique);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.provenance) query = query.eq("provenance", filters.provenance);

    if (!filters.include_deleted) {
        query = query.is("deleted_at", null);
    }

    // Limit to 200 for safety export via client generator
    const { data } = await query.limit(200);

    return (data ?? []).map((d) => d.id);
}

/**
 * Get full artwork details for PDF generation (base data + relations).
 */
export async function getFullArtworkForPdfAction(artworkId: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Check role for conservation data access
        let role = "visitante";
        if (user) {
            // Use maybeSingle to avoid throw on 0 rows
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
            role = profile?.role ?? "visitante";
        }
        const canViewConservation = ["admin", "editor", "conservador"].includes(role);

        // 1. Fetch base artwork
        const { data: artwork, error } = await supabase
            .from("artworks")
            .select("*, media_assets(storage_path, is_primary)")
            .eq("id", artworkId)
            .single();

        if (error || !artwork) {
            console.error("Error fetching artwork base:", artworkId, error);
            return null;
        }

        // Process media path
        const media = (artwork as any).media_assets as { storage_path: string; is_primary: boolean }[] | null;
        const primary = media?.find((m) => m.is_primary);
        // Remove nested to keep object clean
        // @ts-ignore
        delete artwork.media_assets;

        let primary_image_url = null;
        if (primary?.storage_path) {
            // getPublicUrl is synchronous (just string formatting) unless configured otherwise?
            // Actually getPublicUrl is synchronous in supabase-js v2.
            const { data: url } = supabase.storage
                .from("artworks")
                .getPublicUrl(primary.storage_path);
            primary_image_url = url.publicUrl;
        }

        // 2. Fetch related data in parallel
        const [movementsData, valuationData, conservationData] = await Promise.all([
            supabase.from("artwork_movements").select("*").eq("artwork_id", artworkId).order("date_from", { ascending: false }),
            supabase.from("artwork_valuations").select("*").eq("artwork_id", artworkId).maybeSingle(),
            canViewConservation
                ? supabase.from("artwork_conservation").select("*").eq("artwork_id", artworkId).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
        ]);

        return {
            ...artwork,
            primary_image_path: primary?.storage_path ?? null,
            primary_image_url,
            movements: movementsData.data ?? [],
            valuation: valuationData.data ?? null,
            conservation: conservationData.data ?? null,
        };
    } catch (err) {
        console.error("Critical error in getFullArtworkForPdfAction:", err);
        return null;
    }
}
