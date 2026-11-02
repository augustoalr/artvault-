/**
 * PDF Generator Service — Client-side PDF generation using jsPDF
 * Generates technical sheets for artworks.
 */

import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import type { ArtworkSearchResult } from "@/modules/catalog/actions/catalogActions";
import type { Database } from "@/lib/supabase/types";

type Artwork = ArtworkSearchResult;
type Movement = Database["public"]["Tables"]["artwork_movements"]["Row"];
type Valuation = Database["public"]["Tables"]["artwork_valuations"]["Row"];
type Conservation = Database["public"]["Tables"]["artwork_conservation"]["Row"];

export type PdfReportType = "full" | "history" | "technical";

export interface PdfOptions {
    institutionName?: string;
    documentTitle?: string;
    logoUrl?: string; // base64 or public url (cors might be issue)
    includeValuation?: boolean;
    includeConservation?: boolean;
    reportType?: PdfReportType;
}

interface ArtworkFullData extends Artwork {
    movements?: Movement[];
    valuation?: Valuation | null;
    conservation?: Conservation | null;
    primary_image_url?: string | null; // Ensure this is available
}

// ─── Helpers ───

async function loadImage(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error("Failed to load image");
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn("Could not load image for PDF:", url, error);
        return null;
    }
}

function addHeader(doc: jsPDF, opts: PdfOptions, pageIndex: number, totalPages: number) {
    const pageWidth = doc.internal.pageSize.width;

    // Logo (placeholder if url not working/cors)
    // In real implementation we'd fetch the image and convert to base64

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(opts.institutionName || "ArtVault", 14, 15);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const titleMap: Record<string, string> = {
        full: "Ficha Técnica Completa",
        history: "Historial de Movimientos",
        technical: "Ficha Técnica"
    };
    const defaultTitle = titleMap[opts.reportType || "full"] || opts.documentTitle || "Ficha Técnica";

    doc.text(opts.documentTitle || defaultTitle, 14, 22);

    // Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, pageWidth - 14, 25);
}

function addFooter(doc: jsPDF, pageIndex: number) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const date = new Date().toLocaleDateString("es-ES");
    doc.text(`Generado el: ${date}`, 14, pageHeight - 10);
    doc.text(`Página ${pageIndex}`, pageWidth - 20, pageHeight - 10, { align: "right" });
}

// ─── Main Generator ───

export async function generateArtworksPdf(
    artworks: ArtworkFullData[],
    options: PdfOptions
) {
    const doc = new jsPDF();
    let currentPage = 1;

    for (let i = 0; i < artworks.length; i++) {
        const art = artworks[i];
        const reportType = options.reportType || "full";

        if (i > 0) {
            doc.addPage();
            currentPage++;
        }

        addHeader(doc, options, currentPage, 0);

        // ─── Header: Inv Number & Title ───
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`N° Reg: ${art.inventory_number}`, 14, 35);

        doc.setFontSize(16);
        doc.text(art.title, 14, 42);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(art.author || "Autor Desconocido", 14, 48);

        // ─── Image Handling ───
        let imageBase64: string | null = null;
        if (art.primary_image_url) {
            // Attempt to load image
            imageBase64 = await loadImage(art.primary_image_url);
        }

        if (imageBase64) {
            try {
                // Keep aspect ratio roughly inside a box of 65x65
                // jsPDF addImage(data, format, x, y, w, h)
                doc.addImage(imageBase64, "JPEG", 130, 30, 65, 65, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding image to PDF", e);
                // Fallback box
                drawPlaceholderImage(doc);
            }
        } else {
            drawPlaceholderImage(doc);
        }

        // ─── Content based on Report Type ───

        let finalY = 105; // Start below header area

        if (reportType === "full" || reportType === "technical") {
            // ─── Technical Data Table ───
            const techData = [
                ["Año", art.year || "—"],
                ["Técnica", art.technique || "—"],
                ["Medidas", art.dimensions || "—"],
                ["Categoría", art.category || "—"],
                ["Ubicación", art.artwork_location || "—"],
                ["Procedencia", art.provenance || "—"],
            ];

            autoTable(doc, {
                startY: 55,
                head: [],
                body: techData,
                theme: "plain",
                styles: { fontSize: 10, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 } },
                margin: { left: 14, right: 80 }, // Right margin to avoid image box
            });

            finalY = (doc as any).lastAutoTable.finalY + 10;
            // Adjust if table was short
            if (finalY < 100) finalY = 105;

            // ─── Description / History ───
            if (art.author_biography) {
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text("Biografía / Historia", 14, finalY);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const splitBio = doc.splitTextToSize(art.author_biography, 180);
                doc.text(splitBio, 14, finalY + 6);

                finalY += (splitBio.length * 5) + 15;
            }
        } else if (reportType === "history") {
            // For history report, we skip technical table and go straight to movements
            // But we keep basic info (title/author) which is already printed at top.
            finalY = 105;
        }

        // ─── Movements Table ───
        if ((reportType === "full" || reportType === "history") && art.movements && art.movements.length > 0) {
            // Validate page break
            if (finalY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                currentPage++;
                addHeader(doc, options, currentPage, 0);
                finalY = 35;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Historial de Ubicaciones", 14, finalY);

            const moveRows = art.movements.map(m => [
                m.location || "—",
                new Date(m.date_from).toLocaleDateString(),
                m.date_to ? new Date(m.date_to).toLocaleDateString() : "—",
                m.notes || "—"
            ]);

            autoTable(doc, {
                startY: finalY + 4,
                head: [["Ubicación", "Desde", "Hasta", "Notas"]],
                body: moveRows,
                theme: "striped",
                headStyles: { fillColor: [200, 200, 200], textColor: 0 },
                styles: { fontSize: 9 },
            });

            finalY = (doc as any).lastAutoTable.finalY + 15;
        }

        // ─── Valuation (Optional) ───
        if ((reportType === "full" || options.includeValuation) && art.valuation) {
            if (finalY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                currentPage++;
                addHeader(doc, options, currentPage, 0);
                finalY = 35;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Valoración y Avalúo", 14, finalY);

            const valData = [
                ["Valor USD", art.valuation.value_usd ? `$${art.valuation.value_usd.toLocaleString()}` : "—"],
                ["Valor Bs", art.valuation.value_bs ? `Bs ${art.valuation.value_bs.toLocaleString()}` : "—"],
                ["Fecha Avalúo", art.valuation.appraisal_date ? new Date(art.valuation.appraisal_date).toLocaleDateString() : "—"],
            ];

            autoTable(doc, {
                startY: finalY + 4,
                body: valData,
                theme: "plain",
                styles: { fontSize: 10, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
            });

            finalY = (doc as any).lastAutoTable.finalY + 15;
        }

        // ─── Conservation (Optional) ───
        if ((reportType === "full" || options.includeConservation) && art.conservation) {
            if (finalY > doc.internal.pageSize.height - 50) {
                doc.addPage();
                currentPage++;
                addHeader(doc, options, currentPage, 0);
                finalY = 35;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Estado de Conservación", 14, finalY);

            const consData = [
                ["Diagnóstico", art.conservation.diagnosis || "—"],
                ["Recomendaciones", art.conservation.recommendations || "—"],
            ];

            autoTable(doc, {
                startY: finalY + 4,
                body: consData,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 } },
            });

            finalY = (doc as any).lastAutoTable.finalY + 15;
        }


        addFooter(doc, currentPage);
    }

    // Save
    const filename = artworks.length === 1
        ? `Ficha_${artworks[0].inventory_number}.pdf`
        : `Reporte_Obras_${new Date().toISOString().slice(0, 10)}.pdf`;

    doc.save(filename);
}

function drawPlaceholderImage(doc: jsPDF) {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(130, 30, 65, 65, "FD");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Fotografía de la Obra", 162.5, 62.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
}
