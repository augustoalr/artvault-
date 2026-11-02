"use client";

import { useState } from "react";
import { MovementRequest } from "@/lib/supabase/types";
import { getChiefRequestArtworks } from "../services/chiefService";
import { generateMovementAuthPdf, AuthPdfData } from "@/modules/pdf/services/movementAuthPdf";
import { RequestEmptyState } from "./RequestEmptyState";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChiefHistorySectionProps {
    historicalRequests: MovementRequest[];
}

export function ChiefHistorySection({ historicalRequests }: ChiefHistorySectionProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "authorized" | "rejected">("all");
    const [exportingId, setExportingId] = useState<string | null>(null);

    // Filter requests
    const filtered = historicalRequests.filter((req) => {
        const matchesQuery =
            !searchQuery ||
            req.request_number.toString().includes(searchQuery) ||
            req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.responsible_name && req.responsible_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (req.chief_name && req.chief_name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        if (filterStatus === "all") return true;
        if (filterStatus === "rejected") return req.status === "rejected";
        if (filterStatus === "authorized") return req.status === "authorized" || req.status === "pending_security";

        return true;
    });

    const handleExportPdf = async (req: MovementRequest) => {
        setExportingId(req.id);
        try {
            const artworks = await getChiefRequestArtworks(req.id);

            // Filter only authorized artworks if partial authorization was recorded
            const authorizedIds = req.authorized_artwork_ids ?? req.artwork_ids ?? [];
            const artworksForPdf = artworks.filter((a) => authorizedIds.includes(a.id));

            const pdfData: AuthPdfData = {
                requestNumber: req.request_number,
                destination: req.destination,
                responsibleName: req.responsible_name || "Personal Asignado",
                responsibleId: req.responsible_id_number || "No registrado",
                purpose: req.purpose || "Traslado oficial patrimonial",
                movementType: req.movement_type,
                artworks: artworksForPdf.map((a) => ({
                    inventory_number: a.inventory_number,
                    title: a.title,
                    author: a.author,
                    technique: a.technique,
                    artwork_location: a.artwork_location,
                })),
                bienesOfficerName: req.bienes_officer_name,
                bienesOfficerId: req.bienes_officer_id,
                bienesApprovedAt: req.bienes_approved_at,
                chiefName: req.chief_name,
                chiefIdNumber: req.chief_id_number,
                chiefDepartment: req.chief_department,
                chiefAuthorizedAt: req.chief_authorized_at,
                chiefSignatureUrl: req.chief_signature_path,
                securityOfficerName: req.security_officer_name,
                securityOfficerId: req.security_officer_id,
                authorizedAt: req.authorized_at,
            };

            await generateMovementAuthPdf(pdfData);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocurrió un error al preparar el PDF de autorización.");
        } finally {
            setExportingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-art-border bg-art-bg-elevated p-4 shadow-art-sm">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por N°, destino o responsable..."
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary pl-9 pr-3 py-2 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none transition-colors"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-4 w-4 text-art-fg-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setFilterStatus("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            filterStatus === "all"
                                ? "bg-art-accent-gold text-white font-semibold shadow-sm"
                                : "text-art-fg-secondary hover:bg-art-bg-secondary"
                        }`}
                    >
                        Todas ({historicalRequests.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("authorized")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            filterStatus === "authorized"
                                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                                : "text-art-fg-secondary hover:bg-art-bg-secondary"
                        }`}
                    >
                        Autorizadas
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("rejected")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            filterStatus === "rejected"
                                ? "bg-red-600 text-white font-semibold shadow-sm"
                                : "text-art-fg-secondary hover:bg-art-bg-secondary"
                        }`}
                    >
                        Rechazadas
                    </button>
                </div>
            </div>

            {/* List / Table */}
            {filtered.length === 0 ? (
                <RequestEmptyState
                    title="No se encontraron registros en el historial"
                    description={
                        searchQuery
                            ? `No hay solicitudes que coincidan con "${searchQuery}".`
                            : "Aún no se han procesado autorizaciones en esta sección."
                    }
                    actionLabel={searchQuery ? "Limpiar búsqueda" : undefined}
                    onAction={() => setSearchQuery("")}
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-art-border bg-art-bg-elevated shadow-art-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-art-border bg-art-bg-secondary/60 text-art-fg-muted font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Solicitud</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Destino</th>
                                    <th className="px-4 py-3">Autorizado por</th>
                                    <th className="px-4 py-3">Obras</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-art-border">
                                {filtered.map((req) => {
                                    const totalArtworks = req.artwork_ids?.length ?? 0;
                                    const authArtworks = req.authorized_artwork_ids?.length ?? totalArtworks;
                                    const isExporting = exportingId === req.id;
                                    const timeDistance = req.chief_authorized_at
                                        ? formatDistanceToNow(new Date(req.chief_authorized_at), { addSuffix: true, locale: es })
                                        : req.created_at
                                        ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: es })
                                        : "";

                                    return (
                                        <tr key={req.id} className="hover:bg-art-bg-surface/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-mono font-bold text-art-fg-primary">
                                                    SOL-#{String(req.request_number).padStart(4, "0")}
                                                </div>
                                                <div className="text-[10px] text-art-fg-muted">{timeDistance}</div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        req.movement_type === "external"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {req.movement_type === "external" ? "Externo" : "Interno"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 font-medium text-art-fg-primary max-w-xs truncate">
                                                {req.destination}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-medium text-art-fg-primary">
                                                    {req.chief_name || req.security_officer_name || "—"}
                                                </div>
                                                <div className="text-[10px] text-art-fg-muted truncate max-w-[140px]">
                                                    {req.chief_department || "Jefatura"}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 font-medium text-art-fg-secondary">
                                                    <span className="font-bold text-art-accent-gold-dark">{authArtworks}</span>
                                                    <span>de {totalArtworks}</span>
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                {req.status === "rejected" ? (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                        Rechazado
                                                    </span>
                                                ) : req.status === "authorized" ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        Completado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                        En Seguridad
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleExportPdf(req)}
                                                    disabled={isExporting}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-art-accent-gold/60 bg-art-accent-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-art-accent-gold-dark hover:bg-art-accent-gold hover:text-white disabled:opacity-50 transition-all"
                                                >
                                                    {isExporting ? (
                                                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    )}
                                                    <span>{isExporting ? "Generando..." : "Acta PDF"}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
