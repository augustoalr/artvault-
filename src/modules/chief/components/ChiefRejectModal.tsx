"use client";

import React, { useState, useEffect } from "react";

interface ChiefRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
    isRejecting: boolean;
    requestNumber: number;
}

export function ChiefRejectModal({
    isOpen,
    onClose,
    onReject,
    isRejecting,
    requestNumber,
}: ChiefRejectModalProps) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isRejecting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isRejecting]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReject(reason);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
        >
            <div
                className="w-full max-w-md rounded-xl border border-art-border bg-art-bg-primary p-6 shadow-art-float transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 border-b border-art-border pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div>
                        <h3 id="reject-modal-title" className="font-serif text-lg font-bold text-art-fg-primary">
                            Rechazar Solicitud
                        </h3>
                        <p className="text-xs text-art-fg-muted">
                            Solicitud N° {String(requestNumber).padStart(4, "0")}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                            Motivo o justificación del rechazo (opcional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Indica el motivo por el cual no procede la autorización..."
                            className="w-full rounded-lg border border-art-border bg-art-bg-primary p-3 text-xs text-art-fg-primary focus:border-red-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-art-border pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isRejecting}
                            className="rounded-lg border border-art-border px-4 py-2 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isRejecting}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {isRejecting ? "Rechazando..." : "Confirmar Rechazo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
