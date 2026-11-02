"use client";

import React, { useEffect } from "react";
import { SignaturePayload } from "./DualSignaturePad";

interface ChiefConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    authorizedCount: number;
    totalCount: number;
    chiefName: string;
    chiefIdNumber: string;
    chiefDepartment: string;
    signature: SignaturePayload | null;
    isAuthorizing: boolean;
}

export function ChiefConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    authorizedCount,
    totalCount,
    chiefName,
    chiefIdNumber,
    chiefDepartment,
    signature,
    isAuthorizing,
}: ChiefConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isAuthorizing) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isAuthorizing]);

    if (!isOpen) return null;

    const isPartial = authorizedCount < totalCount;
    const excludedCount = totalCount - authorizedCount;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div
                className="w-full max-w-lg rounded-xl border border-art-border bg-art-bg-primary p-6 shadow-art-float transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-art-border pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-art-accent-gold/15 text-art-accent-gold">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h3 id="confirm-modal-title" className="font-serif text-lg font-bold text-art-fg-primary">
                            Confirmación de Autorización
                        </h3>
                        <p className="text-xs text-art-fg-muted">
                            Por favor revisa el alcance de la autorización antes de firmar
                        </p>
                    </div>
                </div>

                {/* Prompt message */}
                <div className="py-2 space-y-4">
                    <div className="rounded-lg bg-art-bg-surface/50 p-4 border border-art-border text-center">
                        <p className="font-serif text-base font-bold text-art-fg-primary">
                            Vas a autorizar <span className="text-art-accent-gold-dark">{authorizedCount}</span> de <span className="text-art-accent-gold-dark">{totalCount}</span> obras solicitadas.
                        </p>
                        <p className="text-xs text-art-fg-secondary mt-1">
                            ¿Deseas confirmar la emisión de esta autorización?
                        </p>
                    </div>

                    {/* Partial Approval Warning */}
                    {isPartial && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-amber-900">
                            <div className="flex items-start gap-2.5">
                                <svg className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="text-xs">
                                    <span className="font-bold">Aviso de Autorización Parcial:</span> Has excluido{" "}
                                    <span className="font-bold underline">{excludedCount}</span> {excludedCount === 1 ? "obra" : "obras"} de la solicitud. Dichas piezas no podrán salir de su ubicación y no figurarán en el acta de salida aprobada.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Snapshot Summary */}
                    <div className="rounded-lg border border-art-border bg-white p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-art-fg-muted">Jefe Autorizante:</span>
                            <span className="font-semibold text-art-fg-primary">{chiefName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-art-fg-muted">Documento (C.I.):</span>
                            <span className="font-semibold text-art-fg-primary">{chiefIdNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-art-fg-muted">Dependencia:</span>
                            <span className="font-semibold text-art-fg-primary">{chiefDepartment}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-art-border pt-2">
                            <span className="text-art-fg-muted">Firma / Rúbrica:</span>
                            {signature?.dataUrl ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Firma adjunta
                                </span>
                            ) : (
                                <span className="text-amber-700 font-semibold">Sin rúbrica</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-art-border pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isAuthorizing}
                        className="rounded-lg border border-art-border px-4 py-2 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary disabled:opacity-50 transition-colors"
                    >
                        Volver y Revisar
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isAuthorizing}
                        className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark disabled:opacity-50 transition-colors"
                    >
                        {isAuthorizing ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Procesando Autorización...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmar y Autorizar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
