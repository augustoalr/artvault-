"use client";

import { useEffect, useState } from "react";
import type { PdfReportType } from "../services/pdfGenerator";

interface PdfExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: { reportType: PdfReportType; includeValuation: boolean }) => void;
    isExporting: boolean;
}

export function PdfExportModal({ isOpen, onClose, onExport, isExporting }: PdfExportModalProps) {
    const [reportType, setReportType] = useState<PdfReportType>("full");
    const [includeValuation, setIncludeValuation] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onExport({ reportType, includeValuation });
    };

    return (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={!isExporting ? onClose : undefined}
            />

            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <div
                        className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-art-border duration-300 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
                    >
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg font-serif font-bold leading-6 text-art-fg-primary" id="modal-title">
                                        Exportar PDF
                                    </h3>
                                    <div className="mt-2 text-sm text-art-fg-muted">
                                        <p>Selecciona el tipo de reporte y las opciones a incluir.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                        {/* Report Type Selection */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-art-fg-secondary block text-left">Tipo de Reporte</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-colors ${reportType === 'full' ? 'border-art-accent-gold ring-1 ring-art-accent-gold bg-art-accent-gold/5' : 'border-art-border bg-white hover:bg-art-bg-surface'}`}>
                                                    <input
                                                        type="radio"
                                                        name="report-type"
                                                        value="full"
                                                        className="sr-only"
                                                        checked={reportType === 'full'}
                                                        onChange={() => setReportType('full')}
                                                    />
                                                    <span className="flex flex-1">
                                                        <span className="flex flex-col text-left">
                                                            <span className="block text-sm font-medium text-art-fg-primary">Ficha Completa</span>
                                                            <span className="mt-1 flex items-center text-xs text-art-fg-muted">Datos técnicos, descripción, movimientos y avalúos.</span>
                                                        </span>
                                                    </span>
                                                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${reportType === 'full' ? 'border-art-accent-gold' : 'border-transparent'}`} aria-hidden="true" />
                                                </label>

                                                <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-colors ${reportType === 'history' ? 'border-art-accent-gold ring-1 ring-art-accent-gold bg-art-accent-gold/5' : 'border-art-border bg-white hover:bg-art-bg-surface'}`}>
                                                    <input
                                                        type="radio"
                                                        name="report-type"
                                                        value="history"
                                                        className="sr-only"
                                                        checked={reportType === 'history'}
                                                        onChange={() => setReportType('history')}
                                                    />
                                                    <span className="flex flex-1">
                                                        <span className="flex flex-col text-left">
                                                            <span className="block text-sm font-medium text-art-fg-primary">Historial de Movimientos</span>
                                                            <span className="mt-1 flex items-center text-xs text-art-fg-muted">Datos básicos y listado detallado de ubicaciones.</span>
                                                        </span>
                                                    </span>
                                                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${reportType === 'history' ? 'border-art-accent-gold' : 'border-transparent'}`} aria-hidden="true" />
                                                </label>

                                                <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-colors ${reportType === 'technical' ? 'border-art-accent-gold ring-1 ring-art-accent-gold bg-art-accent-gold/5' : 'border-art-border bg-white hover:bg-art-bg-surface'}`}>
                                                    <input
                                                        type="radio"
                                                        name="report-type"
                                                        value="technical"
                                                        className="sr-only"
                                                        checked={reportType === 'technical'}
                                                        onChange={() => setReportType('technical')}
                                                    />
                                                    <span className="flex flex-1">
                                                        <span className="flex flex-col text-left">
                                                            <span className="block text-sm font-medium text-art-fg-primary">Resumen Técnico</span>
                                                            <span className="mt-1 flex items-center text-xs text-art-fg-muted">Solo datos técnicos básicos y biografía.</span>
                                                        </span>
                                                    </span>
                                                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${reportType === 'technical' ? 'border-art-accent-gold' : 'border-transparent'}`} aria-hidden="true" />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Options */}
                                        {reportType === 'full' && (
                                            <div className="flex items-center gap-3 rounded-md bg-art-bg-surface p-3">
                                                <input
                                                    id="include-valuation"
                                                    type="checkbox"
                                                    checked={includeValuation}
                                                    onChange={(e) => setIncludeValuation(e.target.checked)}
                                                    className="h-4 w-4 rounded border-art-border text-art-accent-gold focus:ring-art-accent-gold cursor-pointer"
                                                />
                                                <label htmlFor="include-valuation" className="text-sm text-art-fg-secondary cursor-pointer select-none">
                                                    Incluir Valoración Económica
                                                </label>
                                            </div>
                                        )}

                                        <div className="mt-8 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="rounded-lg px-4 py-2 text-sm font-medium text-art-fg-secondary hover:text-art-fg-primary hover:bg-art-bg-surface transition-colors focus:outline-none"
                                                onClick={onClose}
                                                disabled={isExporting}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isExporting}
                                                className="inline-flex justify-center rounded-lg bg-art-accent-gold px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-art-accent-gold disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                                            >
                                                {isExporting ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Generando...
                                                    </span>
                                                ) : (
                                                    "Descargar PDF"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
