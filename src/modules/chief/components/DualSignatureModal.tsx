"use client";

import React, { useState, useEffect } from "react";
import { DualSignaturePad, SignaturePayload } from "./DualSignaturePad";

interface DualSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signature: SignaturePayload) => void;
    initialSignatureUrl?: string | null;
}

export function DualSignatureModal({
    isOpen,
    onClose,
    onConfirm,
    initialSignatureUrl = null,
}: DualSignatureModalProps) {
    const [currentPayload, setCurrentPayload] = useState<SignaturePayload | null>(null);

    // Escape key listener to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!currentPayload) return;
        onConfirm(currentPayload);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-modal-title"
        >
            <div
                className="w-full max-w-xl rounded-xl border border-art-border bg-art-bg-primary p-6 shadow-art-float transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-art-border pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-art-accent-gold/15 text-art-accent-gold">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="signature-modal-title" className="font-serif text-lg font-bold text-art-fg-primary">
                                Firma Digital y Rúbrica Institucional
                            </h3>
                            <p className="text-xs text-art-fg-muted">
                                Traza tu rúbrica o adjunta el sello oficial para avalar el acta de movimiento
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-art-fg-muted hover:bg-art-bg-secondary hover:text-art-fg-primary transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body: Dual Signature Pad */}
                <div className="py-2">
                    <DualSignaturePad
                        initialDataUrl={initialSignatureUrl}
                        onSignatureChange={(payload) => setCurrentPayload(payload)}
                    />
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-art-border pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-art-border px-4 py-2 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary transition-colors"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!currentPayload}
                        className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar y Usar Firma
                    </button>
                </div>
            </div>
        </div>
    );
}
