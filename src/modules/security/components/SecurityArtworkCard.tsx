"use client";

import React from "react";
import { getImageUrl } from "@/modules/media/services/imageService";

export interface SecurityArtworkCardProps {
    artwork: {
        id: string;
        title: string;
        inventory_number: string;
        author: string | null;
        technique?: string | null;
        media_assets?: Array<{ storage_path: string; is_primary?: boolean }>;
    };
    isChecked: boolean;
    isAuthorizedByChief: boolean;
    isExternalRequest: boolean;
    onToggle: (id: string) => void;
    onBlockedClick?: (title: string) => void;
}

export function SecurityArtworkCard({
    artwork,
    isChecked,
    isAuthorizedByChief,
    isExternalRequest,
    onToggle,
    onBlockedClick,
}: SecurityArtworkCardProps) {
    const isBlocked = isExternalRequest && !isAuthorizedByChief;
    const primaryMedia = artwork.media_assets?.find((m) => m.is_primary) ?? artwork.media_assets?.[0];

    const handleClick = () => {
        if (isBlocked) {
            onBlockedClick?.(artwork.title);
            return;
        }
        onToggle(artwork.id);
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative overflow-hidden rounded-xl border transition-all select-none ${
                isBlocked
                    ? "border-red-200 bg-red-50/25 opacity-65 cursor-not-allowed"
                    : isChecked
                    ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500 shadow-md cursor-pointer"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer"
            }`}
            title={
                isBlocked
                    ? `Obra excluida: ${artwork.title} no fue avalada por el Jefe de Departamento.`
                    : isChecked
                    ? `Obra verificada: ${artwork.title}`
                    : `Hacer clic para verificar físicamente: ${artwork.title}`
            }
        >
            {/* Image container */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                {primaryMedia ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getImageUrl(primaryMedia.storage_path)}
                        alt={artwork.title}
                        className={`h-full w-full object-cover transition-transform duration-200 ${
                            isBlocked
                                ? "grayscale brightness-90"
                                : isChecked
                                ? "opacity-100"
                                : "opacity-85 group-hover:scale-105 group-hover:opacity-100"
                        }`}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Sin imagen
                    </div>
                )}

                {/* Overlays */}
                {isBlocked ? (
                    /* Blocked badge overlay */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 text-center backdrop-blur-[1px]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <span className="mt-1.5 rounded-md bg-red-700/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                            No Avalada
                        </span>
                        <span className="text-[9px] font-medium text-white/90 drop-shadow-xs">
                            Salida Bloqueada
                        </span>
                    </div>
                ) : (
                    /* Checkmark overlay for authorized artworks */
                    <div className={`absolute top-2.5 right-2.5 transition-all ${isChecked ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-80"}`}>
                        <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-colors ${
                                isChecked ? "bg-emerald-600 text-white" : "bg-white/90 text-gray-400"
                            }`}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Status indicator on bottom of thumbnail */}
                {!isBlocked && isChecked && (
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                        ✓ Verificada
                    </div>
                )}
            </div>

            {/* Artwork text content */}
            <div className={`p-3 transition-colors ${isChecked ? "bg-emerald-50/50" : isBlocked ? "bg-red-50/40" : "bg-white"}`}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-mono text-[11px] text-gray-400 truncate">{artwork.inventory_number}</p>
                    {isBlocked ? (
                        <span className="text-[10px] font-bold text-red-600">Excluida</span>
                    ) : (
                        <span className="text-[10px] font-semibold text-emerald-600">Avalada</span>
                    )}
                </div>
                <p className="text-xs font-semibold text-gray-900 truncate" title={artwork.title}>
                    {artwork.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{artwork.author || "Autor no registrado"}</p>
                {artwork.technique && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{artwork.technique}</p>
                )}
            </div>
        </div>
    );
}
