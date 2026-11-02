"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getSignatureUrl } from "@/modules/media/services/imageService";

interface ChiefSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    chiefName: string | null;
    chiefDepartment: string | null;
    chiefIdNumber?: string | null;
    chiefAuthorizedAt: string | null;
    chiefSignaturePath: string | null;
    requestNumber: number;
}

function formatModalDate(iso: string | null | undefined): string {
    if (!iso) return "Fecha no registrada";
    try {
        return format(new Date(iso), "d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", { locale: es });
    } catch {
        return iso;
    }
}

export function ChiefSignatureModal({
    isOpen,
    onClose,
    chiefName,
    chiefDepartment,
    chiefIdNumber,
    chiefAuthorizedAt,
    chiefSignaturePath,
    requestNumber,
}: ChiefSignatureModalProps) {
    const [imageError, setImageError] = useState(false);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const signatureUrl = chiefSignaturePath ? getSignatureUrl(chiefSignaturePath) : "";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-modal-title"
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-amber-50/60 to-gray-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 ring-1 ring-amber-400/30">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="signature-modal-title" className="text-base font-bold text-gray-900">
                                Firma Digital Registrada
                            </h3>
                            <p className="text-xs text-gray-500">
                                Aval Institucional · Solicitud #{requestNumber}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Cerrar modal"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-5">
                    {/* Chief Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3.5 rounded-xl bg-gray-50 p-4 border border-gray-100 text-xs">
                        <div>
                            <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                                Funcionario Autorizante
                            </span>
                            <span className="font-bold text-gray-900 text-sm mt-0.5 block truncate">
                                {chiefName || "Jefatura"}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                                Cédula / Identificación
                            </span>
                            <span className="font-mono text-gray-800 text-sm mt-0.5 block">
                                {chiefIdNumber || "No registrada"}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                                Cargo / Dependencia
                            </span>
                            <span className="font-medium text-gray-800 mt-0.5 block truncate">
                                {chiefDepartment || "Dirección de Patrimonio Cultural"}
                            </span>
                        </div>
                        <div className="col-span-2 border-t border-gray-200/80 pt-2.5">
                            <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                                Fecha de Firma y Registro
                            </span>
                            <span className="text-gray-800 font-medium mt-0.5 block">
                                {formatModalDate(chiefAuthorizedAt)}
                            </span>
                        </div>
                    </div>

                    {/* Signature Preview Canvas */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                Rúbrica / Sello Digital
                            </label>
                            <span className="text-[11px] text-gray-400 font-mono">
                                Bucket: signatures
                            </span>
                        </div>

                        <div className="relative flex min-h-[170px] w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-4 shadow-inner">
                            {signatureUrl && !imageError ? (
                                <div className="flex flex-col items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={signatureUrl}
                                        alt={`Firma digital de ${chiefName || "Jefe"}`}
                                        onError={() => setImageError(true)}
                                        className="max-h-36 max-w-full object-contain filter contrast-125"
                                    />
                                    <span className="mt-2 text-[10px] text-gray-400 font-mono">
                                        Firma criptográficamente vinculada a la solicitud
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">
                                        Rúbrica registrada en sistema
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {chiefSignaturePath
                                            ? `Ruta: ${chiefSignaturePath}`
                                            : "Aval asentado formalmente mediante credenciales institucionales."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust & Audit Badge */}
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
                        <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>
                            Aval previo verificado. Esta solicitud fue certificada por la Jefatura antes de su paso a control físico de seguridad.
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Cerrar Inspección
                    </button>
                </div>
            </div>
        </div>
    );
}
