/**
 * BienesPortalView — Portal del Jefe de Bienes Nacionales.
 * Primera etapa de aprobación del flujo de traslados.
 * Funciones: Revisar solicitudes → Aprobar (con finalidad) → Rechazar
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MovementRequest } from "@/lib/supabase/types";
import {
    approveBienesAction,
    rejectRequestAction,
    getRequestArtworks,
} from "@/modules/security/services/securityService";
import { getImageUrl } from "@/modules/media/services/imageService";
import { logoutAction } from "@/modules/admin/actions/authActions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BienesPortalViewProps {
    requests: MovementRequest[];
    historicalRequests: MovementRequest[];
    userName: string;
}

type TabType = "pending" | "history";

// ─── Status badge helper ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        authorized: { label: "Autorizado", className: "bg-emerald-100 text-emerald-700" },
        rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
        pending_security: { label: "En Seguridad", className: "bg-blue-100 text-blue-700" },
        pending_bienes: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
    };
    const cfg = config[status ?? ""] ?? { label: status ?? "-", className: "bg-gray-100 text-gray-600" };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

// ─── Request Row for history ──────────────────────────────────────────────

function HistoryRow({ req }: { req: MovementRequest }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-gray-400 text-xs shrink-0">#{req.request_number}</span>
                <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{req.destination}</p>
                    <p className="text-xs text-gray-500 truncate">
                        {req.responsible_name} · {req.artwork_ids?.length ?? 0} obras
                    </p>
                </div>
            </div>
            <StatusBadge status={req.status} />
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────

export function BienesPortalView({ requests, historicalRequests, userName }: BienesPortalViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("pending");
    const [selectedRequest, setSelectedRequest] = useState<MovementRequest | null>(null);
    const [requestArtworks, setRequestArtworks] = useState<any[]>([]);
    const [loadingArtworks, setLoadingArtworks] = useState(false);

    // Approval form state
    const [officerName, setOfficerName] = useState(userName);
    const [officerId, setOfficerId] = useState("");
    const [purpose, setPurpose] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Reject confirmation state
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const handleSelectRequest = async (req: MovementRequest) => {
        setSelectedRequest(req);
        setError(null);
        setSuccessMessage(null);
        setShowRejectConfirm(false);
        setPurpose("");
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

    const handleApprove = async () => {
        if (!selectedRequest || !officerName || !officerId || !purpose.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await approveBienesAction(selectedRequest.id, officerName, officerId, purpose);
            if (res.success) {
                setSuccessMessage("✓ Solicitud aprobada. Enviada al Oficial de Seguridad.");
                setSelectedRequest(null);
                router.refresh();
            } else {
                setError(res.error ?? "Error desconocido");
            }
        } catch {
            setError("Error de conexión. Intente de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !officerName) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await rejectRequestAction(selectedRequest.id, officerName, rejectReason);
            if (res.success) {
                setSuccessMessage("Solicitud rechazada correctamente.");
                setSelectedRequest(null);
                setShowRejectConfirm(false);
                router.refresh();
            } else {
                setError(res.error ?? "Error desconocido");
            }
        } catch {
            setError("Error de conexión. Intente de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApprove = officerName.trim() && officerId.trim() && purpose.trim().length >= 10;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

            {/* ─── Sidebar ─────────────────────────────────────────── */}
            <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 bg-amber-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-full bg-amber-600 flex items-center justify-center">
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Bienes Nacionales</p>
                            </div>
                        </div>
                        <a
                            href="/bienes-portal/catalogo"
                            className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 bg-white border border-amber-200 rounded-md px-2 py-1 transition-colors"
                            title="Ver Catálogo de Obras"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            Catálogo
                        </a>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === "pending" ? "border-b-2 border-amber-600 text-amber-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Pendientes
                        {requests.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">{requests.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === "history" ? "border-b-2 border-amber-600 text-amber-700" : "text-gray-500 hover:text-gray-700"}`}
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
                                        className={`p-4 cursor-pointer hover:bg-amber-50 transition-colors ${selectedRequest?.id === req.id ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-mono text-gray-400">#{req.request_number}</span>
                                            <span className="text-xs text-gray-400">
                                                {req.created_at ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: es }) : ""}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{req.destination}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            <span>📦 {req.artwork_ids?.length ?? 0} obras</span>
                                            <span>👤 {req.responsible_name ?? "Sin responsable"}</span>
                                        </div>
                                        <div className="mt-1.5">
                                            <span className={`text-xs font-medium ${req.movement_type === "external" ? "text-orange-600" : "text-blue-600"}`}>
                                                {req.movement_type === "external" ? "↗ Externo" : "↔ Interno"}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="p-3 space-y-2">
                            {historicalRequests.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-8">Sin historial aún.</p>
                            ) : (
                                historicalRequests.map(req => <HistoryRow key={req.id} req={req} />)
                            )}
                        </div>
                    )}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500">Bienes Nacionales</p>
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

            {/* ─── Main Content ────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {successMessage && (
                    <div className="m-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {successMessage}
                    </div>
                )}

                {!selectedRequest ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-400">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-600">Selecciona una solicitud</h2>
                        <p className="text-sm mt-1 max-w-xs">Elige una solicitud de la lista para revisarla y tomar una decisión.</p>
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
                                        <span className={selectedRequest.movement_type === "external" ? "text-orange-600 font-medium" : "text-blue-600 font-medium"}>
                                            {selectedRequest.movement_type === "external" ? "↗ Traslado Externo" : "↔ Traslado Interno"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Artworks Gallery */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                                Obras a trasladar ({requestArtworks.length})
                            </h3>
                            {loadingArtworks ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Cargando obras...
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {requestArtworks.map((pt: any) => {
                                        const primaryMedia = pt.media_assets?.find((m: any) => m.is_primary) ?? pt.media_assets?.[0];
                                        return (
                                            <div key={pt.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                <div className="aspect-square bg-gray-100">
                                                    {primaryMedia ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={getImageUrl(primaryMedia.storage_path)} alt={pt.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
                                                    )}
                                                </div>
                                                <div className="p-2.5">
                                                    <p className="text-xs font-mono text-gray-400">{pt.inventory_number}</p>
                                                    <p className="text-xs font-semibold text-gray-900 truncate" title={pt.title}>{pt.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{pt.author}</p>
                                                    {pt.artwork_location && (
                                                        <p className="text-xs text-blue-500 mt-0.5 truncate" title={`Actualmente: ${pt.artwork_location}`}>
                                                            📍 {pt.artwork_location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Approval / Rejection Footer */}
                        <div className="bg-white border-t border-gray-200 p-5">
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {showRejectConfirm ? (
                                /* Reject confirmation panel */
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-red-700">¿Confirmar rechazo de la solicitud #{selectedRequest.request_number}?</p>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Motivo del rechazo (opcional)..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowRejectConfirm(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            Cancelar
                                        </button>
                                        <button onClick={handleReject} disabled={isSubmitting} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                            {isSubmitting ? "Procesando..." : "Confirmar Rechazo"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal approval form */
                                <div className="flex flex-col gap-4">
                                    {/* Purpose field */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Finalidad del Traslado <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={purpose}
                                            onChange={e => setPurpose(e.target.value)}
                                            placeholder="Ej: Exhibición temporal en el Museo de Bellas Artes con motivo del..."
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-0.5">Mínimo 10 caracteres. Este texto aparecerá en el acta de autorización.</p>
                                    </div>

                                    <div className="flex items-end gap-3">
                                        {/* Officer Name */}
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del Autorizante</label>
                                            <input
                                                type="text"
                                                value={officerName}
                                                onChange={e => setOfficerName(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none bg-gray-50"
                                            />
                                        </div>
                                        {/* Officer ID */}
                                        <div className="w-44">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cédula / ID</label>
                                            <input
                                                type="text"
                                                value={officerId}
                                                onChange={e => setOfficerId(e.target.value)}
                                                placeholder="Ej: 12.345.678"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                                            />
                                        </div>

                                        {/* Reject */}
                                        <button
                                            onClick={() => setShowRejectConfirm(true)}
                                            disabled={isSubmitting}
                                            className="shrink-0 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            Rechazar
                                        </button>

                                        {/* Approve */}
                                        <button
                                            onClick={handleApprove}
                                            disabled={!canApprove || isSubmitting}
                                            className="shrink-0 px-6 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            ) : (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                            {isSubmitting ? "Aprobando..." : "Aprobar → Seguridad"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
