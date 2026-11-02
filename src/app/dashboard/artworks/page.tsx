/**
 * Artworks List Page — Dashboard view of all artworks with advanced filtering.
 * Features:
 * - Advanced Search Panel
 * - PDF Export Button
 * - Image Thumbnail in Table
 * - Pagination
 */
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { searchArtworksAction, AdvancedFilters } from "@/modules/catalog/actions/catalogActions";
import { AdvancedSearch } from "@/modules/catalog/components/AdvancedSearch";
import { ExportPdfButton } from "@/modules/pdf/components/ExportPdfButton";
import { ArtworksTable } from "@/modules/inventory/components/ArtworksTable";

export const metadata = {
    title: "Obras — ArtVault",
};

export default async function ArtworksPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;

    // 1. Parse params
    const page = Number(params.page) || 1;
    const pageSize = 20;

    const filters: AdvancedFilters = {
        page,
        pageSize,
        search: params.search,
        inventory_number: params.inventory_number,
        author: params.author,
        title: params.title,
        technique: params.technique,
        category: params.category,
        provenance: params.provenance,
        year_from: params.year_from ? Number(params.year_from) : undefined,
        year_to: params.year_to ? Number(params.year_to) : undefined,
    };

    // 2. Fetch Data
    const { data: artworks, count } = await searchArtworksAction(filters);
    const totalPages = Math.ceil(count / pageSize);

    // 3. Fetch Options for Filter
    const supabase = await getSupabaseServerClient();
    const { data: optionsData } = await supabase
        .from("catalog_options")
        .select("category, value")
        .eq("is_active", true)
        .order("value");

    const catalogOptions: Record<string, string[]> = {};
    if (optionsData) {
        for (const opt of optionsData) {
            if (!catalogOptions[opt.category]) {
                catalogOptions[opt.category] = [];
            }
            catalogOptions[opt.category].push(opt.value);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                        Colección
                    </h1>
                    <p className="mt-1 text-sm text-art-fg-muted">
                        {count} obras registradas
                    </p>
                </div>
                <div className="flex gap-3">
                    <ExportPdfButton filters={filters} disabled={count === 0} />
                    <Link
                        href="/dashboard/artworks/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-art-accent-gold-dark"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nueva Obra
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <AdvancedSearch catalogOptions={catalogOptions} />

            {/* Table */}
            <ArtworksTable
                artworks={artworks}
                totalPages={totalPages}
                currentPage={page}
            />
        </div>
    );
}
