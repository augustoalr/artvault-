/**
 * SecurityPortalView — Portal del Oficial de Seguridad.
 * Segunda y última etapa del flujo de autorización de traslados.
 * Funciones: Verificar obras físicamente → Autorizar / Rechazar → Exportar Acta PDF
 */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovementRequest } from "@/lib/supabase/types";
import {
    authorizeRequestAction,
    rejectRequestAction,
    getRequestArtworks,
} from "@/modules/security/services/securityService";
import { logoutAction } from "@/modules/admin/actions/authActions";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { AuthPdfData } from "@/modules/pdf/services/movementAuthPdf";
import { ChiefEndorsementBanner } from "@/modules/security/components/ChiefEndorsementBanner";
import { ChiefSignatureModal } from "@/modules/security/components/ChiefSignatureModal";
import { SecurityArtworkCard } from "@/modules/security/components/SecurityArtworkCard";

interface SecurityPortalViewProps {
    requests: MovementRequest[];
    historicalRequests: MovementRequest[];
    userName: string;
    userRole?: string;
}

type TabType = "pending" | "history";

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        authorized: { label: "Autorizado", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
        rejected: { label: "Rechazado", className: "bg-red-100 text-red-800 border-red-200" },
        pending_security: { label: "Pendiente Seguridad", className: "bg-blue-100 text-blue-800 border-blue-200" },
        pending_chief: { label: "En Jefatura", className: "bg-purple-100 text-purple-800 border-purple-200" },
        pending_bienes: { label: "En Bienes", className: "bg-amber-100 text-amber-800 border-amber-200" },
        pending: { label: "Pendiente", className: "bg-gray-100 text-gray-700 border-gray-200" },
    };
    const cfg = config[status ?? ""] ?? { label: status ?? "-", className: "bg-gray-100 text-gray-600 border-gray-200" };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function relativeTime(iso: string | null) {
    if (!iso) return "";
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SecurityPortalView({ requests, historicalRequests, userName, userRole }: SecurityPortalViewProps) {
    const router = useRouter();
    const isAdmin = userRole === "admin";
    const [activeTab, setActiveTab] = useState<TabType>("pending");

    // TAREA 1: Filtrar la bandeja de pendientes para que SOLO muestre solicitudes en estado `pending_security`
    const pendingRequests = useMemo(() => {
        return requests.filter((req) => req.status === "pending_security");
    }, [requests]);

    const [selectedRequest, setSelectedRequest] = useState<MovementRequest | null>(null);
    const [requestArtworks, setRequestArtworks] = useState<any[]>([]);
    const [loadingArtworks, setLoadingArtworks] = useState(false);

    // Artwork verification state
    const [checkedArtworks, setCheckedArtworks] = useState<Set<string>>(new Set());

    // Authorization form state
    const [officerName, setOfficerName] = useState(userName);
    const [officerId, setOfficerId] = useState(isAdmin ? "ADMIN-SUP" : "");
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blockedWarning, setBlockedWarning] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Chief Signature Modal state
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Reject confirmation state
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // PDF export (lazy-loaded)
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Check if the current request is an external transfer with Chief authorization restrictions
    const isExternal = selectedRequest?.movement_type === "external";
    const hasChiefRestriction = Boolean(
        isExternal &&
        selectedRequest?.authorized_artwork_ids &&
        Array.isArray(selectedRequest.authorized_artwork_ids)
    );

    const isArtworkAuthorizedByChief = (artworkId: string): boolean => {
        if (!isExternal || !hasChiefRestriction) return true;
        return selectedRequest?.authorized_artwork_ids?.includes(artworkId) ?? false;
    };

    // Filter artworks into authorized vs unauthorized by the Chief
    const authorizedArtworks = useMemo(() => {
        return requestArtworks.filter((art) => isArtworkAuthorizedByChief(art.id));
    }, [requestArtworks, isExternal, hasChiefRestriction, selectedRequest?.authorized_artwork_ids]);

    const unauthorizedArtworks = useMemo(() => {
        if (!isExternal || !hasChiefRestriction) return [];
        return requestArtworks.filter((art) => !isArtworkAuthorizedByChief(art.id));
    }, [requestArtworks, isExternal, hasChiefRestriction, selectedRequest?.authorized_artwork_ids]);

    const isAllChecked =
        authorizedArtworks.length > 0 &&
        checkedArtworks.size === authorizedArtworks.length &&
        Array.from(checkedArtworks).every((id) => isArtworkAuthorizedByChief(id));

    const handleSelectRequest = async (req: MovementRequest) => {
        setSelectedRequest(req);
        setCheckedArtworks(new Set());
        setError(null);
        setBlockedWarning(null);
        setSuccessMessage(null);
        setShowRejectConfirm(false);
        setLoadingArtworks(true);
        try {
            const artworks = await getRequestArtworks(req.id);
            setRequestArtworks(artworks);
        } catch (e) {
            console.error(e);
            setError("Error al cargar las obras de la solicitud.");
        } finally {
            setLoadingArtworks(false);
        }
    };

    const toggleCheck = (id: string) => {
        // TAREA 3: Bloquear si se intenta autorizar una obra no avalada por el Jefe
        if (!isArtworkAuthorizedByChief(id)) {
            const artwork = requestArtworks.find((a) => a.id === id);
            handleBlockedClick(artwork?.title ?? "esta obra");
            return;
        }

        const newSet = new Set(checkedArtworks);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setCheckedArtworks(newSet);
        setBlockedWarning(null);
    };

    const toggleAll = () => {
        // TAREA 3: Solo permitir marcar las obras autorizadas en authorized_artwork_ids
        if (checkedArtworks.size === authorizedArtworks.length) {
            setCheckedArtworks(new Set());
        } else {
            setCheckedArtworks(new Set(authorizedArtworks.map((a: any) => a.id)));
        }
        setBlockedWarning(null);
    };

    const handleBlockedClick = (artworkTitle: string) => {
        setBlockedWarning(
            `⛔ Acción Bloqueada: La obra "${artworkTitle}" no fue avalada por el Jefe de Departamento. Seguridad Física no puede autorizar su salida.`
        );
    };

    const handleAuthorize = async () => {
        if (!selectedRequest || !officerId.trim() || !officerName.trim()) return;

        // TAREA 1: Validación estricta — Solo permitir procesar si está en pending_security
        if (selectedRequest.status !== "pending_security") {
            setError("Esta solicitud no se encuentra en estado pendiente de seguridad para ser procesada.");
            return;
        }

        // TAREA 3: Bloqueo estricto si hay obras no avaladas en la selección
        const unauthorizedAttempt = Array.from(checkedArtworks).filter((id) => !isArtworkAuthorizedByChief(id));
        if (unauthorizedAttempt.length > 0) {
            setError("Bloqueo de seguridad: Se detectaron obras no avaladas por la Jefatura en la verificación.");
            return;
        }

        if (!isAllChecked) {
            setError("Debe verificar físicamente todas las obras avaladas antes de autorizar la salida.");
            return;
        }

        setIsAuthorizing(true);
        setError(null);
        setBlockedWarning(null);
        try {
            const finalOfficerId = officerId.trim() || (isAdmin ? "ADMIN-SUP" : "");
            const verifiedIds = Array.from(checkedArtworks);
            const res = await authorizeRequestAction(selectedRequest.id, officerName, finalOfficerId, verifiedIds);
            if (res.success) {
                setSuccessMessage(`✓ Salida autorizada exitosamente. Solicitud #${selectedRequest.request_number} procesada.`);
                setSelectedRequest(null);
                setCheckedArtworks(new Set());
                router.refresh();
            } else {
                setError(res.error ?? "Error al autorizar el traslado.");
            }
        } catch {
            setError("Error de conexión al autorizar. Intente nuevamente.");
        } finally {
            setIsAuthorizing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !officerName) return;
        setIsAuthorizing(true);
        setError(null);
        setBlockedWarning(null);
        try {
            const res = await rejectRequestAction(selectedRequest.id, officerName, rejectReason);
            if (res.success) {
                setSuccessMessage(`Solicitud #${selectedRequest.request_number} rechazada.`);
                setSelectedRequest(null);
                setShowRejectConfirm(false);
                router.refresh();
            } else {
                setError(res.error ?? "Error al rechazar solicitud.");
            }
        } catch {
            setError("Error de conexión al rechazar.");
        } finally {
            setIsAuthorizing(false);
        }
    };

    const handleExportPdf = async () => {
        if (!selectedRequest || requestArtworks.length === 0) return;
        setIsExportingPdf(true);
        try {
            const { generateMovementAuthPdf } = await import("@/modules/pdf/services/movementAuthPdf");
            const pdfData: AuthPdfData = {
                requestNumber: selectedRequest.request_number,
                destination: selectedRequest.destination,
                responsibleName: selectedRequest.responsible_name ?? "",
                responsibleId: selectedRequest.responsible_id_number ?? "",
                purpose: selectedRequest.purpose ?? "No especificado",
                movementType: selectedRequest.movement_type,
                // Only include the authorized artworks in the physical exit authorization PDF
                artworks: authorizedArtworks.map((a: any) => ({
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
                chiefName: selectedRequest.chief_name,
                chiefDepartment: selectedRequest.chief_department,
                chiefAuthorizedAt: selectedRequest.chief_authorized_at,
            };
            await generateMovementAuthPdf(pdfData);
        } catch (e) {
            console.error("PDF generation failed:", e);
            setError("Error al generar el acta PDF. Intente nuevamente.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* ─── Institutional Top Navigation Bar ─────────────────── */}
            <header className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 shadow-xs shrink-0 z-20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left side: Back to Dashboard & Portal Identity */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-800 transition-all duration-150 group shadow-2xs"
                            title="Regresar al Dashboard Principal"
                        >
                            <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Volver al Dashboard</span>
                        </Link>

                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-800 flex items-center justify-center text-white shadow-xs">
                                <svg className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Portal de Seguridad</h1>
                                    <span className="hidden sm:inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                                        Control Físico y Salidas
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 hidden md:block">
                                    Verificación presencial de inventario y expedición de actas de salida
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Supervisor Badge & User Info */}
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-800 shadow-2xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                                <svg className="h-3.5 w-3.5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Modo Supervisor (Admin)
                            </span>
                        )}

                        <div className="hidden lg:block text-right">
                            <p className="text-xs font-semibold text-gray-900 leading-tight">{userName}</p>
                            <p className="text-[10px] text-gray-500 capitalize">{userRole ?? "seguridad"}</p>
                        </div>

                        <form action={logoutAction}>
                            <button
                                type="submit"
                                title="Cerrar Sesión"
                                className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* ─── Portal Body ──────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ─── Sidebar ────────────────────────────────────────── */}
                <div className={`w-full md:w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col shadow-xs ${selectedRequest ? "hidden md:flex" : "flex"}`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 bg-linear-to-r from-blue-900 to-blue-800 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                            <svg className="h-5 w-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">Portal de Seguridad</p>
                            <p className="text-[11px] text-blue-200">Control Físico y Autorización</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 py-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === "pending"
                                ? "border-b-2 border-blue-600 text-blue-700 bg-white"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                        }`}
                    >
                        <span>Pendientes</span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                activeTab === "pending"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {pendingRequests.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === "history"
                                ? "border-b-2 border-blue-600 text-blue-700 bg-white"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                        }`}
                    >
                        <span>Historial</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-700 font-semibold">
                            {historicalRequests.length}
                        </span>
                    </button>
                </div>

                {/* Requests List */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "pending" ? (
                        pendingRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="font-semibold text-gray-600">Bandeja despejada</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    No hay solicitudes pendientes en estado de seguridad.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {pendingRequests.map((req) => {
                                    const isSelected = selectedRequest?.id === req.id;
                                    const isExternalReq = req.movement_type === "external";
                                    return (
                                        <li
                                            key={req.id}
                                            onClick={() => handleSelectRequest(req)}
                                            className={`p-4 cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-blue-50/90 border-l-4 border-blue-600 shadow-inner"
                                                    : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-gray-500">
                                                        #{req.request_number}
                                                    </span>
                                                    <span
                                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                            isExternalReq
                                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                                : "bg-blue-100 text-blue-700 border border-blue-200"
                                                        }`}
                                                    >
                                                        {isExternalReq ? "Salida Externa" : "Interno"}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-gray-400">{relativeTime(req.created_at)}</span>
                                            </div>

                                            <p className="text-sm font-semibold text-gray-900 truncate" title={req.destination}>
                                                {req.destination}
                                            </p>

                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                                                <span>📦 {req.artwork_ids?.length ?? 0} obras</span>
                                                <span>👤 {req.responsible_name ?? "Sin responsable"}</span>
                                            </div>

                                            {/* Chief endorsement badge in sidebar */}
                                            {isExternalReq && req.chief_name && (
                                                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 border border-amber-200/60">
                                                    <svg className="h-3.5 w-3.5 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    <span className="truncate">Aval Jefe: {req.chief_name}</span>
                                                </div>
                                            )}

                                            {req.bienes_officer_name && !req.chief_name && (
                                                <p className="mt-1.5 text-xs text-amber-700 truncate">
                                                    ✓ Aprobado por Bienes: {req.bienes_officer_name}
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    ) : (
                        <div className="p-3 space-y-2">
                            {historicalRequests.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-8">Sin historial aún.</p>
                            ) : (
                                historicalRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        onClick={() => handleSelectRequest(req)}
                                        className={`cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                            selectedRequest?.id === req.id ? "ring-2 ring-blue-500 border-blue-400" : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500 font-bold">#{req.request_number}</span>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <p className="font-semibold text-gray-900 truncate">{req.destination}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {req.artwork_ids?.length ?? 0} obras · {req.movement_type === "external" ? "Salida Externa" : "Interno"}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500">Oficial de Seguridad</p>
                        </div>
                        <form action={logoutAction}>
                            <button
                                type="submit"
                                title="Cerrar Sesión"
                                className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-200/50 cursor-pointer"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ─── Main Detail Area ────────────────────────────────── */}
            <div className={`flex-1 flex flex-col overflow-hidden ${!selectedRequest ? "hidden md:flex" : "flex"}`}>
                {/* Global Feedback Banners */}
                {successMessage && (
                    <div className="m-4 rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-sm text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="font-medium">{successMessage}</div>
                    </div>
                )}

                {blockedWarning && (
                    <div className="mx-6 mt-4 rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-900 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
                        <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-bold text-amber-950">Aviso de Bloqueo de Seguridad</p>
                            <p className="mt-0.5">{blockedWarning}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setBlockedWarning(null)}
                            className="text-amber-700 hover:text-amber-950 p-1"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {!selectedRequest ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600 shadow-sm">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-700">Selecciona una solicitud pendiente</h2>
                        <p className="text-sm mt-1 max-w-sm text-gray-500">
                            Revisa el aval previo de la Jefatura, verifica físicamente las obras autorizadas y procede a registrar la salida física.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Request Header */}
                        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-xs">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="min-w-0">
                                    {/* Back to list button on mobile */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="md:hidden inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold mb-2 hover:underline"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Volver a la lista
                                    </button>

                                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                        <h2 className="text-xl font-bold text-gray-900 truncate">
                                            {selectedRequest.destination}
                                        </h2>
                                        <StatusBadge status={selectedRequest.status} />
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                                isExternal
                                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                            }`}
                                        >
                                            {isExternal ? "Salida Externa" : "Traslado Interno"}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span>
                                            Solicitud <strong className="font-mono text-gray-700">#{selectedRequest.request_number}</strong>
                                        </span>
                                        <span>
                                            Responsable: <strong className="text-gray-700">{selectedRequest.responsible_name}</strong>
                                            {selectedRequest.responsible_id_number && ` · C.I. ${selectedRequest.responsible_id_number}`}
                                        </span>
                                        {selectedRequest.created_at && (
                                            <span>Registrada: {relativeTime(selectedRequest.created_at)}</span>
                                        )}
                                    </div>

                                    {selectedRequest.purpose && (
                                        <p className="mt-1.5 text-xs text-gray-600">
                                            <span className="font-semibold text-gray-700">Propósito / Finalidad:</span>{" "}
                                            {selectedRequest.purpose}
                                        </p>
                                    )}
                                </div>

                                {/* PDF Export button */}
                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportPdf}
                                        disabled={isExportingPdf || requestArtworks.length === 0}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                                        title="Exportar Acta de Autorización PDF"
                                    >
                                        {isExportingPdf ? (
                                            <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        Exportar Acta PDF
                                    </button>
                                </div>
                            </div>

                            {/* TAREA 2: Banner de Aval Previo del Jefe */}
                            {isExternal && (selectedRequest.chief_name || selectedRequest.status === "pending_security") && (
                                <div className="mt-4">
                                    <ChiefEndorsementBanner
                                        chiefName={selectedRequest.chief_name}
                                        chiefDepartment={selectedRequest.chief_department}
                                        chiefAuthorizedAt={selectedRequest.chief_authorized_at}
                                        chiefSignaturePath={selectedRequest.chief_signature_path}
                                        totalArtworks={selectedRequest.artwork_ids?.length ?? requestArtworks.length}
                                        authorizedArtworksCount={
                                            selectedRequest.authorized_artwork_ids?.length ??
                                            selectedRequest.artwork_ids?.length ??
                                            requestArtworks.length
                                        }
                                        onInspectSignature={() => setIsSignatureModalOpen(true)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Artwork Gallery — Physical Verification Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Verification Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                        Verificación Física de Obras ({checkedArtworks.size}/{authorizedArtworks.length} avaladas)
                                    </h3>
                                    {unauthorizedArtworks.length > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                            {unauthorizedArtworks.length} excluida(s) por el Jefe
                                        </span>
                                    )}
                                </div>

                                {authorizedArtworks.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer text-left sm:text-right"
                                    >
                                        {isAllChecked ? "Desmarcar todas las avaladas" : "Marcar todas las avaladas"}
                                    </button>
                                )}
                            </div>

                            {/* Informational banner if partial authorization exists */}
                            {unauthorizedArtworks.length > 0 && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 flex items-start gap-2.5">
                                    <svg className="h-4 w-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <span className="font-bold">Restricción de Seguridad: </span>
                                        El Jefe de Departamento no autorizó {unauthorizedArtworks.length} obra(s) para este traslado externo.
                                        Dichas piezas están inhabilitadas en el sistema y permanecerán bajo custodia física sin salir de la institución.
                                    </div>
                                </div>
                            )}

                            {loadingArtworks ? (
                                <div className="flex flex-col items-center justify-center text-gray-400 py-16 gap-3">
                                    <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <p className="text-sm font-medium">Cargando inventario de obras...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {requestArtworks.map((pt: any) => {
                                        const isAuthorized = isArtworkAuthorizedByChief(pt.id);
                                        const isChecked = checkedArtworks.has(pt.id);
                                        return (
                                            <SecurityArtworkCard
                                                key={pt.id}
                                                artwork={pt}
                                                isChecked={isChecked}
                                                isAuthorizedByChief={isAuthorized}
                                                isExternalRequest={Boolean(isExternal)}
                                                onToggle={toggleCheck}
                                                onBlockedClick={handleBlockedClick}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Authorization Footer */}
                        <div className="bg-white border-t border-gray-200 p-5 shadow-lg">
                            {error && (
                                <div className="mb-4 rounded-xl bg-red-50 border border-red-300 p-3 text-sm text-red-800 flex items-start gap-2.5">
                                    <svg className="h-5 w-5 mt-0.5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="font-medium">{error}</div>
                                </div>
                            )}

                            {!isAllChecked && authorizedArtworks.length > 0 && (
                                <p className="mb-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Protocolo Obligatorio: Debe verificar físicamente y marcar cada una de las {authorizedArtworks.length} obra(s) avaladas ({checkedArtworks.size}/{authorizedArtworks.length}) antes de firmar la salida.
                                    </span>
                                </p>
                            )}

                            {showRejectConfirm ? (
                                <div className="space-y-3 rounded-xl bg-red-50/60 p-4 border border-red-200">
                                    <p className="text-sm font-bold text-red-800">
                                        ¿Rechazar solicitud #{selectedRequest.request_number}?
                                    </p>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Especifique el motivo de seguridad para el rechazo..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-hidden resize-none bg-white"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectConfirm(false)}
                                            className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleReject}
                                            disabled={isAuthorizing}
                                            className="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-sm"
                                        >
                                            {isAuthorizing ? "Procesando..." : "Confirmar Rechazo"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
                                    <div className="flex flex-wrap items-end gap-3 flex-1">
                                        {/* Officer Name */}
                                        <div className="w-full sm:w-64">
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                                                Oficial Autorizante
                                            </label>
                                            <input
                                                type="text"
                                                value={officerName}
                                                onChange={(e) => setOfficerName(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-gray-50"
                                            />
                                        </div>

                                        {/* Officer ID */}
                                        <div className="w-full sm:w-48">
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                                                Cédula / Identificación
                                            </label>
                                            <input
                                                type="text"
                                                value={officerId}
                                                onChange={(e) => setOfficerId(e.target.value)}
                                                placeholder="Ej: 15.400.200"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectConfirm(true)}
                                            disabled={isAuthorizing}
                                            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer text-center"
                                        >
                                            Rechazar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleAuthorize}
                                            disabled={
                                                (!officerId.trim() && !isAdmin) ||
                                                !officerName.trim() ||
                                                isAuthorizing ||
                                                !isAllChecked ||
                                                selectedRequest.status !== "pending_security"
                                            }
                                            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer text-center"
                                        >
                                            {isAuthorizing ? (
                                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            {isAuthorizing
                                                ? "Autorizando salida física..."
                                                : isAllChecked
                                                ? `AUTORIZAR SALIDA (${checkedArtworks.size} OBRAS)`
                                                : `Verificar obras avaladas (${checkedArtworks.size}/${authorizedArtworks.length})`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            </div>

            {/* Modal para Inspeccionar Firma Digital del Jefe */}
            {selectedRequest && (
                <ChiefSignatureModal
                    isOpen={isSignatureModalOpen}
                    onClose={() => setIsSignatureModalOpen(false)}
                    chiefName={selectedRequest.chief_name}
                    chiefDepartment={selectedRequest.chief_department}
                    chiefIdNumber={selectedRequest.chief_id_number}
                    chiefAuthorizedAt={selectedRequest.chief_authorized_at}
                    chiefSignaturePath={selectedRequest.chief_signature_path}
                    requestNumber={selectedRequest.request_number}
                />
            )}
        </div>
    );
}
