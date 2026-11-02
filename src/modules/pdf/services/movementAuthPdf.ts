/**
 * Movement Authorization PDF Generator
 * Generates a formal A4 authorization document for artwork transfers.
 * Uses jsPDF with institutional header and signature fields.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AuthPdfData {
    requestNumber: number;
    destination: string;
    responsibleName: string;
    responsibleId: string;
    purpose: string;
    movementType: "internal" | "external";
    artworks: Array<{
        inventory_number: string;
        title: string;
        author: string | null;
        technique: string | null;
        artwork_location: string | null;
    }>;
    bienesOfficerName: string | null;
    bienesOfficerId: string | null;
    bienesApprovedAt: string | null;
    chiefName?: string | null;
    chiefIdNumber?: string | null;
    chiefDepartment?: string | null;
    chiefAuthorizedAt?: string | null;
    chiefSignatureUrl?: string | null;
    securityOfficerName: string | null;
    securityOfficerId: string | null;
    authorizedAt: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return "_______________";
    return new Date(isoString).toLocaleDateString("es-VE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function addHeader(doc: jsPDF, pageNum: number, totalPages: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Institution placeholder (future: replace with actual logo)
    doc.setFillColor(196, 160, 73); // art-accent-gold
    doc.rect(margin, 12, 30, 18, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("LOGO\nINSTITUCIÓN", margin + 15, 19, { align: "center" });

    // Institution name
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Dirección de Patrimonio Cultural", margin + 34, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Sistema de Gestión de Colecciones — ArtVault", margin + 34, 23);

    // Date top-right
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" }), pageWidth - margin, 18, { align: "right" });
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, 24, { align: "right" });

    // Divider
    doc.setDrawColor(196, 160, 73);
    doc.setLineWidth(0.5);
    doc.line(margin, 33, pageWidth - margin, 33);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
}

function addFooter(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
        "Documento generado automáticamente por ArtVault — Sistema de Gestión de Colecciones — Dirección de Patrimonio Cultural",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
    );
}

// ─── Main Generator ──────────────────────────────────────────────────────

export async function generateMovementAuthPdf(data: AuthPdfData): Promise<void> {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 40;

    // ─── Title ─────────────────────────────────────────────────────

    addHeader(doc, 1, 1);

    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("ACTA DE AUTORIZACIÓN DE TRASLADO", pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Solicitud N° ${data.requestNumber.toString().padStart(4, "0")}  ·  ${data.movementType === "external" ? "Traslado Externo" : "Traslado Interno"}`, pageWidth / 2, y, { align: "center" });
    y += 10;

    // ─── Authorization Text ─────────────────────────────────────────

    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(20, 20, 20);

    const bodyText = `Por medio de la presente, la Dirección de Patrimonio Cultural autoriza a la ciudadana(o) ${data.responsibleName}, portadora(o) de la cédula de identidad N° ${data.responsibleId}, a realizar el traslado de las obras de arte que se relacionan a continuación:`;

    const bodyLines = doc.splitTextToSize(bodyText, pageWidth - margin * 2);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 5.5 + 6;

    // ─── Artworks Table ─────────────────────────────────────────────

    autoTable(doc, {
        startY: y,
        head: [["N° Inventario", "Título", "Autor", "Técnica", "Ubicación Actual"]],
        body: data.artworks.map(a => [
            a.inventory_number,
            a.title,
            a.author ?? "—",
            a.technique ?? "—",
            a.artwork_location ?? "—",
        ]),
        headStyles: {
            fillColor: [196, 160, 73],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [252, 250, 245] },
        margin: { left: margin, right: margin },
        theme: "grid",
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── Destination & Purpose ──────────────────────────────────────

    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(20, 20, 20);

    const destText = `Desde: ${data.artworks[0]?.artwork_location ?? "ubicación actual"}     →     Hasta: ${data.destination}`;
    doc.text(destText, margin, y);
    y += 8;

    doc.setFont("times", "bold");
    doc.text("Con el fin de:", margin, y);
    doc.setFont("times", "normal");
    y += 5;

    const purposeLines = doc.splitTextToSize(data.purpose, pageWidth - margin * 2);
    doc.text(purposeLines, margin, y);
    y += purposeLines.length * 5.5 + 14;

    // ─── Signature Blocks ──────────────────────────────────────────

    const hasChief = !!data.chiefName;
    const blockWidth = (pageWidth - margin * 2 - 8) / 2;
    const blockHeight = 38;

    // Check if new page is needed for signatures
    const requiredHeight = hasChief ? 90 : 50;
    if (y + requiredHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        addHeader(doc, 2, 2);
        y = 45;
    }

    if (hasChief) {
        // Row 1: Bienes Nacionales & Jefe de Dependencia
        doc.setFillColor(248, 247, 245);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, y, blockWidth, blockHeight, 2, 2, "FD");
        doc.roundedRect(margin + blockWidth + 8, y, blockWidth, blockHeight, 2, 2, "FD");

        const col1X = margin + 6;
        const col2X = margin + blockWidth + 14;

        // Block 1: Bienes Nacionales
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("APROBADO POR — BIENES NACIONALES", col1X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(8.5);
        doc.text(`Nombre: ${data.bienesOfficerName ?? "___________________________"}`, col1X, y + 16);
        doc.text(`C.I.: ${data.bienesOfficerId ?? "___________________________"}`, col1X, y + 23);
        doc.text(`Fecha: ${formatDate(data.bienesApprovedAt)}`, col1X, y + 30);

        // Block 2: Jefe de Dependencia / Custodio
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("AUTORIZADO POR — JEFE DE DEPENDENCIA", col2X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(8.5);
        doc.text(`Nombre: ${data.chiefName ?? "___________________________"}`, col2X, y + 15);
        doc.text(`C.I.: ${data.chiefIdNumber ?? "___________________________"}`, col2X, y + 21);
        doc.text(`Dpto: ${data.chiefDepartment ?? "Patrimonio Cultural"}`, col2X, y + 27);
        doc.text(`Fecha: ${formatDate(data.chiefAuthorizedAt)}`, col2X, y + 33);

        // Attempt to embed signature if available
        if (data.chiefSignatureUrl) {
            try {
                doc.addImage(data.chiefSignatureUrl, "PNG", col2X + 46, y + 12, 26, 16);
            } catch (err) {
                console.warn("Could not embed chief signature in PDF:", err);
            }
        }

        y += blockHeight + 6;

        // Row 2: Seguridad & Sello Institucional
        doc.setFillColor(248, 247, 245);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, y, blockWidth, blockHeight, 2, 2, "FD");
        doc.roundedRect(margin + blockWidth + 8, y, blockWidth, blockHeight, 2, 2, "FD");

        // Block 3: Seguridad
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("DESPACHO / OFICIAL DE SEGURIDAD", col1X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(8.5);
        doc.text(`Nombre: ${data.securityOfficerName ?? "___________________________"}`, col1X, y + 16);
        doc.text(`C.I.: ${data.securityOfficerId ?? "___________________________"}`, col1X, y + 23);
        doc.text(`Fecha: ${formatDate(data.authorizedAt)}`, col1X, y + 30);

        // Block 4: Sello Institucional
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("SELLO INSTITUCIONAL / CUSTODIA", col2X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text("Espacio reservado para sello húmedo", col2X, y + 18);
        doc.text("y rúbrica de contraloría patrimonial.", col2X, y + 23);

        y += blockHeight + 10;
    } else {
        // Legacy 2-column layout
        doc.setFillColor(248, 247, 245);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, y, blockWidth, 38, 2, 2, "FD");
        doc.roundedRect(margin + blockWidth + 8, y, blockWidth, 38, 2, 2, "FD");

        const col1X = margin + 6;
        const col2X = margin + blockWidth + 14;

        // Block 1: Bienes Nacionales
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("APROBADO POR — BIENES NACIONALES", col1X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(9);
        doc.text(`Nombre: ${data.bienesOfficerName ?? "___________________________"}`, col1X, y + 16);
        doc.text(`C.I.: ${data.bienesOfficerId ?? "___________________________"}`, col1X, y + 23);
        doc.text(`Fecha: ${formatDate(data.bienesApprovedAt)}`, col1X, y + 30);

        // Block 2: Seguridad
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("AUTORIZADO POR — OFICIAL DE SEGURIDAD", col2X, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(9);
        doc.text(`Nombre: ${data.securityOfficerName ?? "___________________________"}`, col2X, y + 16);
        doc.text(`C.I.: ${data.securityOfficerId ?? "___________________________"}`, col2X, y + 23);
        doc.text(`Fecha: ${formatDate(data.authorizedAt)}`, col2X, y + 30);

        y += 46;

        // Stamp line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Firma y sello institucional: _________________________________", margin, y + 5);
    }

    addFooter(doc);

    // Save
    const fileName = `Acta_Traslado_${String(data.requestNumber).padStart(4, "0")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}
