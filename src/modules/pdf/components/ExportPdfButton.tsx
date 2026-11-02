/**
 * ExportPdfButton — Client component to trigger PDF generation.
 * Fetches IDs based on current filters, then fetches details and generates PDF.
 */
"use client";

import { useState } from "react";
import { generateArtworksPdf, type PdfReportType } from "@/modules/pdf/services/pdfGenerator";
import { getSettingsAction } from "@/modules/admin/actions/settingsActions";
import {
    getFullArtworkForPdfAction,
    getAllArtworkIdsAction,
    type AdvancedFilters
} from "@/modules/catalog/actions/catalogActions";
import { PdfExportModal } from "./PdfExportModal";

interface ExportPdfButtonProps {
    filters?: AdvancedFilters; // Optional now
    disabled?: boolean;
    artworkId?: string; // New prop for single artwork export
    label?: string; // Optional custom label
}

export function ExportPdfButton({ filters, disabled, artworkId, label }: ExportPdfButtonProps) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = async () => {
        // Check if there are any results before opening
        if (!artworkId && filters) {
            const exportFilters = { ...filters };
            delete exportFilters.page;
            delete exportFilters.pageSize;
            // Ideally we'd check count here but for now just open it
        }
        setIsModalOpen(true);
    };

    async function handleExport({ reportType, includeValuation }: { reportType: PdfReportType; includeValuation: boolean }) {
        setLoading(true);
        setProgress(1); // Started

        try {
            let ids: string[] = [];

            if (artworkId) {
                ids = [artworkId];
            } else if (filters) {
                // 1. Get IDs matching filters
                const exportFilters = { ...filters };
                delete exportFilters.page;
                delete exportFilters.pageSize;

                ids = await getAllArtworkIdsAction(exportFilters);
            } else {
                console.error("No filters or artworkId provided");
                setLoading(false);
                setIsModalOpen(false);
                return;
            }

            if (ids.length === 0) {
                alert("No hay registros que coincidan con los filtros.");
                setLoading(false);
                setIsModalOpen(false);
                return;
            }

            if (ids.length > 200) {
                if (!confirm(`Se exportarán los primeros 200 registros de un total mayor. ¿Continuar?`)) {
                    setLoading(false);
                    return;
                }
            }

            // 2. Get settings
            const settingsRes = await getSettingsAction();
            const opts = {
                institutionName: settingsRes.settings?.institution_name || "ArtVault",
                documentTitle: settingsRes.settings?.document_title || "Ficha Técnica",
                logoUrl: settingsRes.settings?.institution_logo_url || undefined,
                reportType,
                includeValuation,
            };

            const fullData: any[] = [];
            let completed = 0;

            // 3. Batch fetch details
            const CONCURRENCY = 2; // Reduced concurrency for safety
            for (let i = 0; i < ids.length; i += CONCURRENCY) {
                const chunk = ids.slice(i, i + CONCURRENCY);
                try {
                    const results = await Promise.all(chunk.map(async (id) => {
                        return getFullArtworkForPdfAction(id);
                    }));
                    fullData.push(...results.filter(Boolean));
                } catch (chunkErr) {
                    console.error("Error fetching chunk", i, chunkErr);
                    throw new Error("Error de conexión al obtener datos de las obras.");
                }

                completed += chunk.length;
                setProgress(Math.round((completed / ids.length) * 100));
            }

            // 4. Generate PDF
            await generateArtworksPdf(fullData, opts);
            setIsModalOpen(false);

        } catch (err) {
            console.error("PDF Export Error:", err);
            alert("Error al generar el PDF.");
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <>
            <button
                onClick={handleOpenModal}
                disabled={disabled || loading}
                className="flex items-center gap-2 rounded-lg bg-white border border-art-border px-4 py-2 text-sm font-medium text-art-fg-secondary transition-colors hover:bg-art-bg-surface hover:text-art-fg-primary hover:border-art-accent-gold disabled:opacity-50 shadow-sm"
            >
                {loading ? (
                    <>
                        <svg className="h-4 w-4 animate-spin text-art-accent-gold" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{progress}%</span>
                    </>
                ) : (
                    <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span>{label || "Exportar PDF"}</span>
                    </>
                )}
            </button>

            <PdfExportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onExport={handleExport}
                isExporting={loading}
            />
        </>
    );
}
