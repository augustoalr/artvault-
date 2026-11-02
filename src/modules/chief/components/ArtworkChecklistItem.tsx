"use client";

import { ChiefArtwork } from "../services/chiefService";
import { getImageUrl } from "@/modules/media/services/imageService";

interface ArtworkChecklistItemProps {
    artwork: ChiefArtwork;
    isChecked: boolean;
    onToggle: (id: string) => void;
}

export function ArtworkChecklistItem({
    artwork,
    isChecked,
    onToggle,
}: ArtworkChecklistItemProps) {
    const primaryMedia = artwork.media_assets?.find((m) => m.is_primary) ?? artwork.media_assets?.[0];
    const imageUrl = primaryMedia?.storage_path ? getImageUrl(primaryMedia.storage_path) : null;

    return (
        <div
            onClick={() => onToggle(artwork.id)}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(artwork.id);
                }
            }}
            className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                isChecked
                    ? "border-art-accent-gold/80 bg-art-accent-gold/5 shadow-sm"
                    : "border-art-border bg-art-bg-surface/30 opacity-75 hover:opacity-100"
            }`}
        >
            {/* Custom Checkbox */}
            <div className="pt-1">
                <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        isChecked
                            ? "border-art-accent-gold bg-art-accent-gold text-white"
                            : "border-art-border bg-white"
                    }`}
                >
                    {isChecked && (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* Thumbnail */}
            <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-art-border bg-art-bg-surface flex items-center justify-center">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={artwork.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-art-fg-muted p-2 text-center">
                        <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[9px]">Sin foto</span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-art-fg-muted">
                        N° {artwork.inventory_number}
                    </span>

                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isChecked
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                        {isChecked ? "✓ Aprobada para traslado" : "✕ Excluida"}
                    </span>
                </div>

                <h4 className="font-serif text-sm font-bold text-art-fg-primary truncate mt-0.5">
                    {artwork.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-art-fg-secondary mt-1.5">
                    <div>
                        <span className="text-art-fg-muted">Autor: </span>
                        <span className="font-medium">{artwork.author || "Anónimo / No identificado"}</span>
                    </div>

                    <div>
                        <span className="text-art-fg-muted">Técnica: </span>
                        <span>{artwork.technique || "No especificada"}</span>
                    </div>

                    <div>
                        <span className="text-art-fg-muted">Ubicación actual: </span>
                        <span className="font-medium text-art-fg-primary">{artwork.artwork_location || "En depósito"}</span>
                    </div>

                    {artwork.dimensions && (
                        <div>
                            <span className="text-art-fg-muted">Medidas: </span>
                            <span>{artwork.dimensions}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
