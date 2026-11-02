/**
 * CatalogGallery — Client Component
 * Handles search, filter, and pagination interactions.
 * The "dumb" UI layer: receives data from props, delegates navigation for filtering.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArtworkCard, ArtworkCardSkeleton } from "@/modules/shared/components/ArtworkCard";
import { SearchBar } from "@/modules/shared/components/SearchBar";
import { ExportPdfButton } from "@/modules/pdf/components/ExportPdfButton";
import type { ArtworkWithMedia } from "@/modules/catalog/services/catalogService";

interface CatalogGalleryProps {
    artworks: ArtworkWithMedia[];
    totalCount: number;
    techniques: string[];
    currentPage: number;
    currentSearch?: string;
    currentTechnique?: string;
}

const PAGE_SIZE = 24;

export function CatalogGallery({
    artworks,
    totalCount,
    techniques,
    currentPage,
    currentSearch,
    currentTechnique,
}: CatalogGalleryProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParams = useCallback(
        (updates: Record<string, string | undefined>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            // Reset to page 1 on filter change
            if (!updates.page) {
                params.delete("page");
            }

            router.push(`/?${params.toString()}`);
        },
        [router, searchParams]
    );

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasResults = artworks.length > 0;

    return (
        <div className="space-y-8">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SearchBar
                    onSearch={(query) => updateParams({ search: query || undefined })}
                />
                <div className="flex items-center gap-3">
                    <ExportPdfButton
                        filters={{
                            search: currentSearch,
                            technique: currentTechnique,
                            page: 1, // Default
                            pageSize: 1000 // To fetch all logic handles pagination removal anyway
                        }}
                    />
                    <select
                        value={currentTechnique ?? ""}
                        onChange={(e) =>
                            updateParams({ technique: e.target.value || undefined })
                        }
                        className="rounded-lg border border-art-border bg-art-bg-elevated px-4 py-2.5 text-sm text-art-fg-primary transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                        id="technique-filter"
                    >
                        <option value="">Todas las técnicas</option>
                        {techniques.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-art-fg-muted">
                        {totalCount} obra{totalCount !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Gallery Grid */}
            {hasResults ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {artworks.map((artwork) => (
                        <ArtworkCard
                            key={artwork.id}
                            id={artwork.id}
                            title={artwork.title}
                            author={artwork.author}
                            year={artwork.year}
                            technique={artwork.technique}
                            imageUrl={artwork.primary_image_url}
                            filterSearch={currentSearch}
                            filterTechnique={currentTechnique}
                            filterPage={currentPage}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <svg
                        className="mb-4 h-16 w-16 text-art-fg-muted/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                    </svg>
                    <h3 className="font-serif text-xl text-art-fg-secondary">
                        No se encontraron obras
                    </h3>
                    <p className="mt-2 text-sm text-art-fg-muted">
                        Intenta ajustar los filtros de búsqueda.
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() =>
                            updateParams({ page: String(currentPage - 1) })
                        }
                        disabled={currentPage <= 1}
                        className="rounded-lg border border-art-border px-4 py-2 text-sm font-medium text-art-fg-secondary transition-colors hover:border-art-accent-gold hover:text-art-accent-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Anterior
                    </button>
                    <span className="px-4 text-sm text-art-fg-muted">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            updateParams({ page: String(currentPage + 1) })
                        }
                        disabled={currentPage >= totalPages}
                        className="rounded-lg border border-art-border px-4 py-2 text-sm font-medium text-art-fg-secondary transition-colors hover:border-art-accent-gold hover:text-art-accent-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Loading skeleton for server-side Suspense
 */
export function CatalogGallerySkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <ArtworkCardSkeleton key={i} />
            ))}
        </div>
    );
}
