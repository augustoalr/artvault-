/**
 * Catalog Data Service — Server-side data fetching
 * Pure data layer — no UI logic.
 */
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Artwork, MediaAsset, ArtworkMovement } from "@/lib/supabase/types";

export interface ArtworkWithMedia extends Artwork {
    primary_image_url: string | null;
    movements?: ArtworkMovement[];
    valuation?: {
        value_bs: number | null;
        value_usd: number | null;
        appraisal_date: string | null;
        approved_by: string | null;
        reviewed_by: string | null;
    } | null;
}

interface CatalogFilters {
    search?: string;
    technique?: string;
    author?: string;
    yearFrom?: string;
    yearTo?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 24;

export async function getPublicArtworks(
    filters: CatalogFilters = {}
): Promise<{ data: ArtworkWithMedia[]; count: number }> {
    const supabase = await getSupabaseServerClient();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("artworks")
        .select("*, media_assets(storage_path, is_primary)", {
            count: "exact",
        })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,technique.ilike.%${filters.search}%`
        );
    }

    if (filters.technique) {
        query = query.eq("technique", filters.technique);
    }

    if (filters.author) {
        query = query.ilike("author", `%${filters.author}%`);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error("Supabase Error [getPublicArtworks]:", error);
        throw new Error(`Failed to fetch artworks: ${error.message || 'Network error'}`);
    }

    const artworks: ArtworkWithMedia[] = (data || []).map((row: Record<string, unknown>) => {
        const mediaAssets = (row.media_assets as any[]) || [];
        const primaryImage = mediaAssets.find((m: any) => m.is_primary) || mediaAssets[0];

        let publicUrl = null;
        if (primaryImage?.storage_path) {
            const { data } = supabase.storage
                .from("artworks")
                .getPublicUrl(primaryImage.storage_path);
            publicUrl = data.publicUrl;
        }

        return {
            ...(row as unknown as Artwork),
            primary_image_url: publicUrl,
        };
    });

    return { data: artworks, count: count ?? 0 };
}

export async function getArtworkById(
    id: string
): Promise<ArtworkWithMedia | null> {
    const supabase = await getSupabaseServerClient();

    // Fetch artwork + media + valuation + movements
    const [artworkRes, valuationRes, movementsRes] = await Promise.all([
        supabase
            .from("artworks")
            .select("*, media_assets(id, storage_path, file_type, size_kb, is_primary)")
            .eq("id", id)
            .is("deleted_at", null)
            .single(),
        supabase
            .from("artwork_valuations")
            .select("*")
            .eq("artwork_id", id)
            .maybeSingle(),
        supabase
            .from("artwork_movements")
            .select("*")
            .eq("artwork_id", id)
            .order("date_from", { ascending: false })
    ]);

    if (artworkRes.error || !artworkRes.data) {
        if (artworkRes.error) console.error("Supabase Error [getArtworkById]:", artworkRes.error);
        return null;
    }

    const data = artworkRes.data;
    const valuation = valuationRes.data;
    const movements = movementsRes.data;

    const mediaAssets = (data as Record<string, unknown>).media_assets as any[] | undefined;
    const primaryImage = mediaAssets?.find((m: any) => m.is_primary) || mediaAssets?.[0];

    let publicUrl = null;
    if (primaryImage?.storage_path) {
        const { data } = supabase.storage
            .from("artworks")
            .getPublicUrl(primaryImage.storage_path);
        publicUrl = data.publicUrl;
    }

    return {
        ...(data as unknown as Artwork),
        primary_image_url: publicUrl,
        movements: (movements ?? []) as ArtworkMovement[],
        valuation: valuation ? {
            value_bs: valuation.value_bs,
            value_usd: valuation.value_usd,
            appraisal_date: valuation.appraisal_date,
            approved_by: valuation.approved_by,
            reviewed_by: valuation.reviewed_by,
        } : null
    };
}


// ─── Navigation context ───────────────────────────────────────────────────────

export interface NavigationContext {
    prevId: string | null;
    nextId: string | null;
    currentIndex: number; // 1-based
    totalCount: number;
    filters: { search?: string; technique?: string };
}

/**
 * Returns the prev/next artwork IDs relative to `currentId` within the
 * filtered result set. Fetches only IDs — very lightweight query.
 */
export async function getAdjacentArtworkIds(
    currentId: string,
    filters: { search?: string; technique?: string } = {}
): Promise<NavigationContext> {
    const supabase = await getSupabaseServerClient();

    let query = supabase
        .from("artworks")
        .select("id")
        .is("deleted_at", null)
        .order("inventory_number", { ascending: true });

    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,technique.ilike.%${filters.search}%,inventory_number.ilike.%${filters.search}%`
        );
    }
    if (filters.technique) {
        query = query.eq("technique", filters.technique);
    }

    const { data } = await query;
    const ids = (data ?? []).map((r: { id: string }) => r.id);
    const idx = ids.indexOf(currentId);

    return {
        prevId: idx > 0 ? ids[idx - 1] : null,
        nextId: idx < ids.length - 1 ? ids[idx + 1] : null,
        currentIndex: idx + 1,
        totalCount: ids.length,
        filters,
    };
}

// ─── Public-safe artwork type ─────────────────────────────────────────────────
// Only fields appropriate for public display — no valuation, no private ownership data.
export interface PublicArtwork {
    id: string;
    inventory_number: string;
    title: string;
    author: string | null;
    year: string | null;
    category: string | null;
    technique: string | null;
    dimensions: string | null;
    provenance: string | null;
    entry_date: string | null;
    artwork_location: string | null;
    author_biography: string | null;
    biography_researcher: string | null;
    primary_image_url: string | null;
    all_image_urls: string[];
}

/**
 * Fetches only public-safe artwork fields for the museum catalog view.
 * Confidential data (valuations, owner address, conservation notes) is
 * intentionally excluded at the query level — not just hidden in the UI.
 */
export async function getPublicArtworkById(
    id: string
): Promise<PublicArtwork | null> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("artworks")
        .select(
            `id, inventory_number, title, author, year, category, technique,
             dimensions, provenance, entry_date, artwork_location,
             author_biography, biography_researcher,
             media_assets(storage_path, is_primary)`
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (error || !data) {
        if (error) console.error("Supabase Error [getPublicArtworkById]:", error);
        return null;
    }

    const mediaAssets = (data as any).media_assets as Array<{ storage_path: string; is_primary: boolean }> | undefined;
    const primaryMedia = mediaAssets?.find(m => m.is_primary) ?? mediaAssets?.[0];

    const getUrl = (path: string) =>
        supabase.storage.from("artworks").getPublicUrl(path).data.publicUrl;

    return {
        id: data.id,
        inventory_number: data.inventory_number,
        title: data.title,
        author: data.author ?? null,
        year: data.year ?? null,
        category: data.category ?? null,
        technique: data.technique ?? null,
        dimensions: data.dimensions ?? null,
        provenance: data.provenance ?? null,
        entry_date: data.entry_date ?? null,
        artwork_location: data.artwork_location ?? null,
        author_biography: data.author_biography ?? null,
        biography_researcher: data.biography_researcher ?? null,
        primary_image_url: primaryMedia ? getUrl(primaryMedia.storage_path) : null,
        all_image_urls: (mediaAssets ?? []).map(m => getUrl(m.storage_path)),
    };
}

export async function getDistinctTechniques(): Promise<string[]> {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
        .from("artworks")
        .select("technique")
        .is("deleted_at", null)
        .not("technique", "is", null);

    if (!data) return [];

    const unique = [...new Set(data.map((d: { technique: string | null }) => d.technique).filter(Boolean))] as string[];
    return unique.sort();
}
