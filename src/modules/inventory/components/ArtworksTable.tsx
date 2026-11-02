"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterMovementModal } from "@/modules/inventory/components/RegisterMovementModal";
import type { Artwork } from "@/lib/supabase/types";
import { useMovementBasket } from "@/modules/inventory/context/MovementBasketContext";

// Extends Artwork to include the joined properties we need
export interface ArtworkWithDetails extends Artwork {
    primary_image_url?: string | null;
    completion_percentage?: number | null;
}

interface ArtworksTableProps {
    artworks: ArtworkWithDetails[];
    totalPages: number;
    currentPage: number;
}

export function ArtworksTable({ artworks, totalPages, currentPage }: ArtworksTableProps) {
    const router = useRouter();
    const [selectedArtwork, setSelectedArtwork] = useState<ArtworkWithDetails | null>(null);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    // Basket Context
    const { addToBasket, removeFromBasket, isInBasket, basket } = useMovementBasket();

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Add all visible artworks to basket
            // Note: Types might mismatch slightly if ArtworkWithDetails has extra props not in Artwork, 
            // but usually safe if extending. MovementBasket expects Artwork.
            addToBasket(artworks);
        } else {
            // Remove visible artworks from basket
            artworks.forEach(art => removeFromBasket(art.id));
        }
    };

    const isAllSelected = artworks.length > 0 && artworks.every(art => isInBasket(art.id));


    const handleQuickMove = (artwork: ArtworkWithDetails) => {
        setSelectedArtwork(artwork);
        setIsMoveModalOpen(true);
    };

    const handleMoveSuccess = () => {
        setIsMoveModalOpen(false);
        setSelectedArtwork(null);
        router.refresh(); // Refresh data to show new location in table if applicable
    };

    return (
        <div className="overflow-hidden rounded-xl border border-art-border bg-art-bg-elevated shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-art-border bg-art-bg-surface text-left text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                            <th className="w-10 px-4 py-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-art-border text-art-accent-gold focus:ring-art-accent-gold"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3">Imagen</th>
                            <th className="px-4 py-3">N° Reg</th>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Ubicación</th>
                            <th className="px-4 py-3">Autor</th>
                            <th className="px-4 py-3">Técnica</th>
                            <th className="px-4 py-3">Año</th>
                            <th className="px-4 py-3">Progreso</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-art-border/50">
                        {artworks.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center text-art-fg-muted">
                                    No se encontraron obras. Intenta ajustar los filtros.
                                </td>
                            </tr>
                        ) : (
                            artworks.map((art) => (
                                <tr key={art.id} className={`group transition-colors hover:bg-art-bg-surface ${isInBasket(art.id) ? "bg-art-bg-surface/50" : ""}`}>
                                    <td className="px-4 py-2">
                                        <input
                                            type="checkbox"
                                            className="rounded border-art-border text-art-accent-gold focus:ring-art-accent-gold"
                                            checked={isInBasket(art.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) addToBasket([art]);
                                                else removeFromBasket(art.id);
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="h-10 w-10 overflow-hidden rounded bg-art-bg-secondary">
                                            {art.primary_image_url ? (
                                                <img
                                                    src={art.primary_image_url}
                                                    alt={art.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-art-fg-muted text-[10px]">
                                                    Sin foto
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs font-medium text-art-fg-secondary">
                                        {art.inventory_number}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-art-fg-primary">
                                        <Link href={`/dashboard/artworks/${art.id}`} className="hover:text-art-accent-gold hover:underline">
                                            {art.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-art-fg-secondary">
                                        {art.artwork_location ? (
                                            <span className="inline-flex items-center rounded-sm bg-art-bg-secondary px-2 py-0.5 text-xs font-medium text-art-fg-secondary">
                                                {art.artwork_location}
                                            </span>
                                        ) : (
                                            <span className="text-art-fg-muted text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-art-fg-secondary">
                                        {art.author || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-art-fg-muted truncate max-w-[150px]">
                                        {art.technique || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-art-fg-muted">
                                        {art.year || "—"}
                                    </td>
                                    {/* Progress Indicator */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 rounded-full bg-art-bg-secondary overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${(art.completion_percentage || 0) >= 100
                                                        ? "bg-art-success"
                                                        : "bg-art-accent-gold"
                                                        }`}
                                                    style={{ width: `${art.completion_percentage || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-art-fg-muted">
                                                {art.completion_percentage || 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleQuickMove(art)}
                                                title="Registrar Traslado"
                                                className="rounded p-1 text-art-fg-muted hover:bg-art-bg-secondary hover:text-art-accent-gold transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2 17a2 2 0 0 0 2 2h15.5" />
                                                    <path d="m14 13 4 4-4 4" />
                                                    <path d="M18 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
                                                </svg>
                                            </button>
                                            <Link
                                                href={`/dashboard/artworks/${art.id}`}
                                                className="text-xs font-medium text-art-fg-secondary hover:text-art-fg-primary"
                                            >
                                                Editar
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Stats inside the table wrapper */}
            <div className="flex items-center justify-between border-t border-art-border bg-art-bg-surface px-4 py-3">
                <p className="text-xs text-art-fg-muted">
                    Página {currentPage} de {totalPages || 1}
                </p>
                <div className="flex gap-2">
                    {currentPage > 1 && (
                        <Link
                            href={`?page=${currentPage - 1}`}
                            className="rounded border border-art-border bg-white px-3 py-1 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary"
                        >
                            Anterior
                        </Link>
                    )}
                    {currentPage < totalPages && (
                        <Link
                            href={`?page=${currentPage + 1}`}
                            className="rounded border border-art-border bg-white px-3 py-1 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary"
                        >
                            Siguiente
                        </Link>
                    )}
                </div>
            </div>

            {/* Movement Modal */}
            {selectedArtwork && (
                <RegisterMovementModal
                    artworkId={selectedArtwork.id}
                    currentLocation={selectedArtwork.artwork_location || undefined}
                    isOpen={isMoveModalOpen}
                    onClose={() => setIsMoveModalOpen(false)}
                    onSuccess={handleMoveSuccess}
                />
            )}
        </div>
    );
}
