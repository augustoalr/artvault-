/**
 * Artwork Detail / Edit Page
 * Loads full artwork data and renders the form in edit mode or read-only mode depending on permissions.
 */
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { ArtworkForm } from "@/modules/inventory/components/ArtworkForm";
import { MovementHistorySection } from "@/modules/inventory/components/MovementHistorySection";
import { ExportPdfButton } from "@/modules/pdf/components/ExportPdfButton";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ArtworkDetailPage({ params }: PageProps) {
    const { id } = await params; // Await params for Next.js 15+ compatibility
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");

    const supabase = await getSupabaseServerClient();

    // 1. Fetch main artwork
    const { data: artwork, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("id", id)
        .single();

    // ... (fetch valuation and media)
    const { getArtworkMovements } = await import("@/modules/inventory/services/movementService");
    const movements = await getArtworkMovements(id);

    if (error || !artwork) {
        return notFound();
    }

    // 2. Fetch related data (valuation, media)
    const { data: valuation } = await supabase
        .from("artwork_valuations")
        .select("*")
        .eq("artwork_id", id)
        .maybeSingle();

    // Fetch primary media
    const { data: mediaAssets } = await supabase
        .from("media_assets")
        .select("*")
        .eq("artwork_id", id)
        .eq("is_primary", true)
        .maybeSingle();

    // 3. Prepare Image URL
    let primaryImageUrl = undefined;
    if (mediaAssets) {
        const { data } = supabase.storage
            .from("artworks")
            .getPublicUrl(mediaAssets.storage_path);
        primaryImageUrl = data.publicUrl;
    }

    // 4. Fetch Catalog Options
    const { data: optionsData } = await supabase
        .from("catalog_options")
        .select("category, value")
        .eq("is_active", true)
        .order("value");

    const catalogOptions: Record<string, string[]> = {};
    if (optionsData) {
        for (const opt of optionsData) {
            if (!catalogOptions[opt.category]) catalogOptions[opt.category] = [];
            catalogOptions[opt.category].push(opt.value);
        }
    }

    // Fetch dynamic locations (from artworks usage)
    const { getCatalogOptionsAction } = await import("@/modules/admin/actions/catalogManagerActions");
    const locationOptions = await getCatalogOptionsAction("location");
    if (locationOptions) {
        catalogOptions["location"] = locationOptions.map(l => l.value);
    }

    // 5. Map to Form Data structure
    // Combine artwork fields + valuation info
    const existingData = {
        // Explicitly map fields to handle nulls from DB and satisfy form interface
        id: artwork.id,
        inventory_number: artwork.inventory_number,
        title: artwork.title,
        author: artwork.author ?? "",
        year: artwork.year ?? "",
        category: artwork.category ?? "",
        technique: artwork.technique ?? "",
        dimensions: artwork.dimensions ?? "",
        provenance: artwork.provenance ?? "",
        entry_date: artwork.entry_date ?? "",
        original_owner: artwork.original_owner ?? "",
        owner_address: artwork.owner_address ?? "",
        artwork_location: artwork.artwork_location ?? "",
        photo_type: artwork.photo_type ?? "",
        photographer: artwork.photographer ?? "",
        author_biography: artwork.author_biography ?? "",
        biography_researcher: artwork.biography_researcher ?? "",
        mounting_description: artwork.mounting_description ?? "",
        general_observations: artwork.general_observations ?? "",

        value_bs: valuation?.value_bs?.toString() ?? "",
        value_usd: valuation?.value_usd?.toString() ?? "",
        appraisal_date: valuation?.appraisal_date ?? "",
        approved_by: valuation?.approved_by ?? "",
        reviewed_by: valuation?.reviewed_by ?? "",
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                        {profile.role === "visitante" ? "Detalle de Obra" : "Editar Ficha Técnica"}
                    </h1>
                    <p className="mt-1 text-sm text-art-fg-muted">
                        {artwork.title} — {artwork.inventory_number}
                    </p>
                </div>
                <div className="flex gap-3">
                    <ExportPdfButton artworkId={id} label="Exportar Ficha" />
                </div>
            </div>


            <ArtworkForm
                userRole={profile.role}
                userName={profile.full_name ?? "Usuario"}
                existingData={existingData}
                catalogOptions={catalogOptions}
                primaryImageUrl={primaryImageUrl}
                primaryImagePath={mediaAssets?.storage_path}
            />

            <MovementHistorySection
                artworkId={id}
                initialMovements={movements ?? []}
            />
        </div >
    );
}
