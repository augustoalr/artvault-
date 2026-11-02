/**
 * SecurityPortalView — Portal del Oficial de Seguridad.
 * Segunda y última etapa del flujo de autorización de traslados.
 * Funciones: Verificar obras físicamente → Autorizar / Rechazar → Exportar Acta PDF
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MovementRequest } from "@/lib/supabase/types";
import {
    authorizeRequestAction,
    rejectRequestAction,
    getRequestArtworks,
} from "@/modules/security/services/securityService";
import { getImageUrl } from "@/modules/media/services/imageService";
import { logoutAction } from "@/modules/admin/actions/authActions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { AuthPdfData } from "@/modules/pdf/services/movementAuthPdf";

interface SecurityPortalViewProps {
    requests: MovementRequest[];
    historicalRequests: MovementRequest[];
    userName: string;
}

type TabType = "pending" | "history";

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        authorized: { label: "Autorizado", className: "bg-emerald-100 text-emerald-700" },
        rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
        pending_security: { label: "Pendiente", className: "bg-blue-100 text-blue-700" },
        pending_bienes: { label: "En Bienes", className: "bg-amber-100 text-amber-700" },
    };
    const cfg = config[status ?? ""] ?? { label: status ?? "-", className: "bg-gray-100 text-gray-600" };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function relativeTime(iso: string | null) {
    if (!iso) return "";
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SecurityPortalView({ requests, historicalRequests, userName }: SecurityPortalViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("pending");

    const [selectedRequest, setSelectedRequest] = useState<MovementRequest | null>(null);
    const [requestArtworks, setRequestArtworks] = useState<any[]>([]);
    const [loadingArtworks, setLoadingArtworks] = useState(false);

    // Artwork verification state
    const [checkedArtworks, setCheckedArtworks] = useState<Set<string>>(new Set());

    // Authorization form state
    const [officerName, setOfficerName] = useState(userName);
    const [officerId, setOfficerId] = useState("");
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Reject confirmation state
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // PDF export (lazy-loaded)
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const handleSelectRequest = async (req: MovementRequest) => {
        setSelectedRequest(req);
        setCheckedArtworks(new Set());
        setError(null);
        setSuccessMessage(null);
        setShowRejectConfirm(false);
        setLoadingArtworks(true);
        try {
            const artworks = await getRequestArtworks(req.id);
            setRequestArtworks(artworks);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingArtworks(false);
        }
    };

    const toggleCheck = (id: string) => {
        const newSet = new Set(checkedArtworks);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setCheckedArtworks(newSet);
    };

    const toggleAll = () => {
        if (checkedArtworks.size === requestArtworks.length) {
            setCheckedArtworks(new Set());
        } else {
            setCheckedArtworks(new Set(requestArtworks.map((a: any) => a.id)));
        }
    };

    const isAllChecked = requestArtworks.length > 0 && checkedArtworks.size === requestArtworks.length;

    const handleAuthorize = async () => {
        if (!selectedRequest || !officerId || !officerName || !isAllChecked) return;
        setIsAuthorizing(true);
        setError(null);
        try {
            const res = await authorizeRequestAction(selectedRequest.id, officerName, officerId);
            if (res.success) {
                setSuccessMessage(`✓ Traslado autorizado. Solicitud #${selectedRequest.request_number} procesada.`);
                setSelectedRequest(null);
                router.refresh();
            } else {
                setError(res.error ?? "Error desconocido");
            }
        } catch {
            setError("Error de conexión. Intente nuevamente.");
        } finally {
            setIsAuthorizing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !officerName) return;
        setIsAuthorizing(true);
        setError(null);
        try {
            const res = await rejectRequestAction(selectedRequest.id, officerName, rejectReason);
            if (res.success) {
                setSuccessMessage("Solicitud rechazada.");
                setSelectedRequest(null);
                setShowRejectConfirm(false);
                router.refresh();
            } else {
                setError(res.error ?? "Error al rechazar");
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setIsAuthorizing(false);
        }
    };

    const handleExportPdf = async () => {
        if (!selectedRequest || requestArtworks.length === 0) return;
        setIsExportingPdf(true);
        try {
            // Lazy-load the PDF module (keeps bundle small)
            const { generateMovementAuthPdf } = await import("@/modules/pdf/services/movementAuthPdf");
            const pdfData: AuthPdfData = {
                requestNumber: selectedRequest.request_number,
                destination: selectedRequest.destination,
                responsibleName: selectedRequest.responsible_name ?? "",
                responsibleId: selectedRequest.responsible_id_number ?? "",
                purpose: selectedRequest.purpose ?? "No especificado",
                movementType: selectedRequest.movement_type,
                artworks: requestArtworks.map((a: any) => ({
                    inventory_number: a.inventory_number,
                    title: a.title,
                    author: a.author,
                    technique: a.technique,
                    artwork_location: a.artwork_location,
                })),
                bienesOfficerName: selectedRequest.bienes_officer_name,
                bienesOfficerId: selectedRequest.bienes_officer_id,
                bienesApprovedAt: selectedRequest.bienes_approved_at,
                securityOfficerName: selectedRequest.security_officer_name,
                securityOfficerId: selectedRequest.security_officer_id,
                authorizedAt: selectedRequest.authorized_at,
            };
            await generateMovementAuthPdf(pdfData);
        } catch (e) {
            console.error("PDF generation failed:", e);
            setError("Error al generar el PDF. Intente nuevamente.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

            {/* ─── Sidebar ────────────────────────────────────────── */}
            <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-700 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Portal de Seguridad</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === "pending" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Pendientes
                        {requests.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-800">{requests.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === "history" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Historial
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "pending" ? (
                        requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <p className="text-2xl mb-2">✓</p>
                                No hay solicitudes pendientes.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <li
                                        key={req.id}
                                        onClick={() => handleSelectRequest(req)}
                                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedRequest?.id === req.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-mono text-gray-400">#{req.request_number}</span>
                                            <span className="text-xs text-gray-400">{relativeTime(req.created_at)}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{req.destination}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            <span>📦 {req.artwork_ids?.length ?? 0} obras</span>
                                            <span>👤 {req.responsible_name ?? "Sin responsable"}</span>
                                        </div>
                                        {req.bienes_officer_name && (
                                            <p className="mt-1 text-xs text-amber-600">✓ Aprobado por Bienes: {req.bienes_officer_name}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="p-3 space-y-2">
                            {historicalRequests.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-8">Sin historial aún.</p>
                            ) : (
                                historicalRequests.map(req => (
                                    <div
                                        key={req.id}
                                        onClick={() => handleSelectRequest(req)}
                                        className={`cursor-pointer rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm hover:bg-gray-50 ${selectedRequest?.id === req.id ? "ring-1 ring-blue-400" : ""}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{req.destination}</p>
                                                <p className="text-xs text-gray-500 font-mono">#{req.request_number} · {req.artwork_ids?.length ?? 0} obras</p>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500">Oficial de Seguridad</p>
                        </div>
                        <form action={logoutAction}>
                            <button type="submit" title="Cerrar Sesión" className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ─── Main Detail Area ────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Global success banner */}
                {successMessage && (
                    <div className="m-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {successMessage}
                    </div>
                )}

                {!selectedRequest ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-400">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-600">Selecciona una solicitud</h2>
                        <p className="text-sm mt-1 max-w-xs">Elige una solicitud de la lista para verificar las obras y autorizar el traslado.</p>
                    </div>
                ) : (
                    <>
                        {/* Request Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-xl font-bold text-gray-900 truncate">{selectedRequest.destination}</h2>
                                        <StatusBadge status={selectedRequest.status} />
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span>Solicitud <strong>#{selectedRequest.request_number}</strong></span>
                                        <span>Responsable: <strong>{selectedRequest.responsible_name}</strong> · CI {selectedRequest.responsible_id_number}</span>
                                    </div>
                                    {selectedRequest.purpose && (
                                        <p className="mt-1 text-xs text-gray-600">
                                            <span className="font-semibold">Finalidad:</span> {selectedRequest.purpose}
                                        </p>
                                    )}
                                    {selectedRequest.bienes_officer_name && (
                                        <p className="mt-1 text-xs text-amber-700">
                                            ✓ Aprobado por Bienes: <strong>{selectedRequest.bienes_officer_name}</strong>
                                            {selectedRequest.bienes_approved_at && ` · ${relativeTime(selectedRequest.bienes_approved_at)}`}
                                        </p>
                                    )}
                                </div>
                                {/* PDF Export button (always available to review/print) */}
                                <button
                                    onClick={handleExportPdf}
                                    disabled={isExportingPdf || requestArtworks.length === 0}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                    title="Exportar Acta de Autorización PDF"
                                >
                                    {isExportingPdf ? (
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    )}
                                    Exportar Acta PDF
                                </button>
                            </div>
                        </div>

                        {/* Artwork Gallery — Verification */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Verificar Obras ({checkedArtworks.size}/{requestArtworks.length})
                                </h3>
                                {requestArtworks.length > 0 && (
                                    <button
                                        onClick={toggleAll}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {isAllChecked ? "Desmarcar todas" : "Marcar todas"}
                                    </button>
                                )}
                            </div>

                            {loadingArtworks ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Cargando obras...
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {requestArtworks.map((pt: any) => {
                                        const isChecked = checkedArtworks.has(pt.id);
                                        const primaryMedia = pt.media_assets?.find((m: any) => m.is_primary) ?? pt.media_assets?.[0];
                                        return (
                                            <div
                                                key={pt.id}
                                                onClick={() => toggleCheck(pt.id)}
                                                className={`group relative bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all cursor-pointer select-none ${isChecked ? "ring-2 ring-emerald-500 border-emerald-400" : "border-gray-200"}`}
                                            >
                                                <div className="aspect-square bg-gray-100 relative">
                                                    {primaryMedia ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={getImageUrl(primaryMedia.storage_path)}
                                                            alt={pt.title}
                                                            className={`h-full w-full object-cover transition-opacity ${isChecked ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
                                                    )}
                                                    {/* Checkmark overlay */}
                                                    <div className={`absolute top-2 right-2 transition-all ${isChecked ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-80"}`}>
                                                        <div className={`rounded-full p-1 shadow ${isChecked ? "bg-emerald-500 text-white" : "bg-white/80 text-gray-400"}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-2.5 transition-colors ${isChecked ? "bg-emerald-50" : ""}`}>
                                                    <p className="text-xs font-mono text-gray-400">{pt.inventory_number}</p>
                                                    <p className="text-xs font-semibold text-gray-900 truncate" title={pt.title}>{pt.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{pt.author}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Authorization Footer */}
                        <div className="bg-white border-t border-gray-200 p-5">
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 flex items-start gap-2">
                                    <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}

                            {!isAllChecked && requestArtworks.length > 0 && (
                                <p className="mb-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                                    ⚠ Debe verificar y marcar todas las obras ({checkedArtworks.size}/{requestArtworks.length}) antes de autorizar.
                                </p>
                            )}

                            {showRejectConfirm ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-red-700">¿Rechazar solicitud #{selectedRequest.request_number}?</p>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Motivo del rechazo (opcional)..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowRejectConfirm(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                                            Cancelar
                                        </button>
                                        <button onClick={handleReject} disabled={isAuthorizing} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                                            {isAuthorizing ? "Procesando..." : "Confirmar Rechazo"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-end gap-3">
                                    {/* Officer Name */}
                                    <div className="flex-1 max-w-xs">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Oficial Autorizante</label>
                                        <input
                                            type="text"
                                            value={officerName}
                                            onChange={e => setOfficerName(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
                                        />
                                    </div>
                                    {/* Officer ID */}
                                    <div className="w-40">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cédula / ID</label>
                                        <input
                                            type="text"
                                            value={officerId}
                                            onChange={e => setOfficerId(e.target.value)}
                                            placeholder="Ej: 15.400.200"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    {/* Reject */}
                                    <button
                                        onClick={() => setShowRejectConfirm(true)}
                                        disabled={isAuthorizing}
                                        className="shrink-0 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                        Rechazar
                                    </button>

                                    {/* Authorize */}
                                    <button
                                        onClick={handleAuthorize}
                                        disabled={!officerId || !officerName || isAuthorizing || !isAllChecked}
                                        className="shrink-0 flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        {isAuthorizing ? (
                                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        ) : (
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )}
                                        {isAuthorizing ? "Autorizando..." : isAllChecked ? "AUTORIZAR SALIDA" : `Verificar obras (${checkedArtworks.size}/${requestArtworks.length})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
