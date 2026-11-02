"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChiefEndorsementBannerProps {
    chiefName: string | null;
    chiefDepartment: string | null;
    chiefAuthorizedAt: string | null;
    chiefSignaturePath: string | null;
    totalArtworks: number;
    authorizedArtworksCount: number;
    onInspectSignature: () => void;
}

function formatAuthorizedDate(iso: string | null | undefined): string {
    if (!iso) return "Fecha no registrada";
    try {
        return format(new Date(iso), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
        return iso;
    }
}

export function ChiefEndorsementBanner({
    chiefName,
    chiefDepartment,
    chiefAuthorizedAt,
    chiefSignaturePath,
    totalArtworks,
    authorizedArtworksCount,
    onInspectSignature,
}: ChiefEndorsementBannerProps) {
    const isPartialAuthorization = authorizedArtworksCount < totalArtworks;

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-50/90 via-amber-50/40 to-indigo-50/40 p-4 shadow-xs transition-all">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left side: Institutional Seal & Endorsement Details */}
                <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/30">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 border border-amber-300/60">
                                Aval Previo del Jefe (Fase 1)
                            </span>
                            {/* Artwork Count Badge */}
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                    isPartialAuthorization
                                        ? "bg-amber-100/90 text-amber-900 border-amber-300"
                                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                }`}
                            >
                                {isPartialAuthorization ? (
                                    <>
                                        <svg className="h-3.5 w-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{authorizedArtworksCount} de {totalArtworks} obras autorizadas para salida</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{authorizedArtworksCount} de {totalArtworks} obras autorizadas para salida</span>
                                    </>
                                )}
                            </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 truncate">
                            Avalado previamente por:{" "}
                            <span className="font-bold text-amber-950">{chiefName || "Jefe de Departamento"}</span>
                            {" — "}
                            <span className="font-medium text-gray-700">{chiefDepartment || "Dirección de Patrimonio"}</span>
                            {" el "}
                            <span className="font-medium text-gray-800">{formatAuthorizedDate(chiefAuthorizedAt)}</span>
                        </p>

                        <p className="mt-0.5 text-xs text-gray-600">
                            {isPartialAuthorization
                                ? "Atención: La Jefatura aprobó una salida parcial. Las obras no autorizadas están bloqueadas para Seguridad Física."
                                : "Aprobación total confirmada: Todas las obras de la solicitud cuentan con aval institucional previo."}
                        </p>
                    </div>
                </div>

                {/* Right side: Button to inspect digital signature */}
                <div className="shrink-0 flex items-center lg:self-center">
                    <button
                        type="button"
                        onClick={onInspectSignature}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-xs border border-gray-300 hover:bg-gray-50 hover:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 transition-all cursor-pointer"
                        title={chiefSignaturePath ? "Inspeccionar firma digital registrada" : "Ver aval digital"}
                    >
                        <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Inspeccionar Firma Digital</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
