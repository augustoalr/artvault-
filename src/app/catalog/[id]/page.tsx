/**
 * Public Artwork Detail Page — /catalog/[id]
 *
 * Renders the museum-style public view (PublicArtworkView).
 * Data is fetched with getPublicArtworkById — a query that intentionally
 * excludes confidential fields (valuations, owner data, conservation).
 *
 * Filter context (search, technique) is passed from the gallery via URL params
 * and used to compute prev/next artwork IDs for in-context navigation.
 *
 * Staff with dashboard access see an inline banner with a link to
 * the full editable sheet in the Dashboard.
 */
import { notFound } from "next/navigation";
import {
    getPublicArtworkById,
    getAdjacentArtworkIds,
} from "@/modules/catalog/services/catalogService";
import { PublicArtworkView } from "@/modules/catalog/components/PublicArtworkView";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        search?: string;
        technique?: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const artwork = await getPublicArtworkById(id);
    if (!artwork) return { title: "Obra no encontrada — ArtVault" };
    return {
        title: `${artwork.title}${artwork.author ? ` — ${artwork.author}` : ""} | ArtVault`,
        description: `Ficha técnica de "${artwork.title}"${artwork.technique ? `, ${artwork.technique}` : ""}${artwork.year ? ` (${artwork.year})` : ""}.`,
    };
}

export default async function PublicArtworkPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { search, technique } = await searchParams;

    // Fetch artwork data, navigation context, and user profile in parallel
    const [artwork, navContext, profile] = await Promise.all([
        getPublicArtworkById(id),
        getAdjacentArtworkIds(id, {
            search: search || undefined,
            technique: technique || undefined,
        }),
        getCurrentUserProfile(),
    ]);

    if (!artwork) return notFound();

    // Build filter-aware detail URLs for prev/next navigation
    const buildDetailUrl = (targetId: string) => {
        const p = new URLSearchParams();
        if (search) p.set("search", search);
        if (technique) p.set("technique", technique);
        const qs = p.toString();
        return qs ? `/catalog/${targetId}?${qs}` : `/catalog/${targetId}`;
    };

    // Build the back-to-catalog URL preserving filters
    const buildCatalogUrl = () => {
        const p = new URLSearchParams();
        if (search) p.set("search", search);
        if (technique) p.set("technique", technique);
        const qs = p.toString();
        return qs ? `/?${qs}` : "/";
    };

    // Determine if the current user can edit the artwork in the Dashboard
    const canEdit =
        profile?.role === "admin" ||
        profile?.role === "editor" ||
        profile?.role === "conservador";
    const adminDashboardLink = canEdit ? `/dashboard/artworks/${id}` : undefined;

    return (
        <PublicArtworkView
            artwork={artwork}
            adminDashboardLink={adminDashboardLink}
            navigation={{
                prevUrl: navContext.prevId ? buildDetailUrl(navContext.prevId) : null,
                nextUrl: navContext.nextId ? buildDetailUrl(navContext.nextId) : null,
                currentIndex: navContext.currentIndex,
                totalCount: navContext.totalCount,
                catalogUrl: buildCatalogUrl(),
                activeSearch: search || null,
                activeTechnique: technique || null,
            }}
        />
    );
}
