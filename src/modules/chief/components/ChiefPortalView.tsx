"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MovementRequest, Profile } from "@/lib/supabase/types";
import {
    ChiefArtwork,
    getChiefRequestArtworks,
    authorizeMovementByChief,
    rejectChiefRequestAction,
} from "../services/chiefService";
import { ChiefHeader } from "./ChiefHeader";
import { ChiefTabs, ChiefTabType } from "./ChiefTabs";
import { ChiefRequestCard } from "./ChiefRequestCard";
import { ArtworkChecklistItem } from "./ArtworkChecklistItem";
import { ChiefSnapshotForm } from "./ChiefSnapshotForm";
import { ChiefConfirmModal } from "./ChiefConfirmModal";
import { ChiefRejectModal } from "./ChiefRejectModal";
import { ChiefHistorySection } from "./ChiefHistorySection";
import { DualSignatureModal } from "./DualSignatureModal";
import { SignaturePayload } from "./DualSignaturePad";
import { RequestEmptyState } from "./RequestEmptyState";
import { RequestSkeleton } from "./RequestSkeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChiefPortalViewProps {
    requests: MovementRequest[];
    historicalRequests: MovementRequest[];
    userProfile: Profile;
}

export function ChiefPortalView({
    requests,
    historicalRequests,
    userProfile,
}: ChiefPortalViewProps) {
    const [activeTab, setActiveTab] = useState<ChiefTabType>("pending");

    // Tray & Selection State
    const [selectedRequest, setSelectedRequest] = useState<MovementRequest | null>(
        requests.length > 0 ? requests[0] : null
    );
    const [searchPendingQuery, setSearchPendingQuery] = useState("");

    // Artworks Checklist State
    const [artworks, setArtworks] = useState<ChiefArtwork[]>([]);
    const [checkedArtworkIds, setCheckedArtworkIds] = useState<Set<string>>(new Set());
    const [loadingArtworks, setLoadingArtworks] = useState(false);

    // Chief Snapshot Form State
    const [chiefName, setChiefName] = useState(userProfile.full_name || "Lic. Custodio");
    const [chiefIdNumber, setChiefIdNumber] = useState("");
    const [chiefDepartment, setChiefDepartment] = useState("Dirección de Patrimonio Cultural");
    const [signature, setSignature] = useState<SignaturePayload | null>(null);

    // Modal States
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    // Async Action States
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load artworks when a request is selected
    const loadArtworksForRequest = useCallback(async (req: MovementRequest) => {
        setLoadingArtworks(true);
        setErrorMessage(null);
        try {
            const fetched = await getChiefRequestArtworks(req.id);
            setArtworks(fetched);
            // By default, pre-select all artworks in the request
            setCheckedArtworkIds(new Set(fetched.map((a) => a.id)));
        } catch (err) {
            console.error("Error loading artworks:", err);
            setErrorMessage("No fue posible cargar las obras asociadas a esta solicitud.");
        } finally {
            setLoadingArtworks(false);
        }
    }, []);

    // Initial load for first request
    useEffect(() => {
        if (selectedRequest) {
            loadArtworksForRequest(selectedRequest);
        }
    }, [selectedRequest, loadArtworksForRequest]);

    // Handle selecting a request from the tray
    const handleSelectRequest = (req: MovementRequest) => {
        setSelectedRequest(req);
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    // Checklist toggles
    const handleToggleArtwork = (artworkId: string) => {
        setCheckedArtworkIds((prev) => {
            const next = new Set(prev);
            if (next.has(artworkId)) {
                next.delete(artworkId);
            } else {
                next.add(artworkId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        setCheckedArtworkIds(new Set(artworks.map((a) => a.id)));
    };

    const handleDeselectAll = () => {
        setCheckedArtworkIds(new Set());
    };

    // Validation before opening confirmation modal
    const handlePrepareAuthorization = () => {
        setErrorMessage(null);

        if (checkedArtworkIds.size === 0) {
            setErrorMessage("Debes seleccionar al menos una obra para autorizar.");
            return;
        }

        if (!chiefName.trim()) {
            setErrorMessage("El Nombre y Apellido del Jefe autorizante es obligatorio.");
            return;
        }

        if (!chiefIdNumber.trim()) {
            setErrorMessage("La Cédula de Identidad / DNI es obligatoria.");
            return;
        }

        if (!chiefDepartment.trim()) {
            setErrorMessage("La Dependencia o Departamento es obligatoria.");
            return;
        }

        if (!signature?.dataUrl) {
            setErrorMessage("Debes capturar o adjuntar tu firma digital antes de autorizar.");
            return;
        }

        setIsConfirmModalOpen(true);
    };

    // Execute Authorization
    const handleConfirmAuthorization = async () => {
        if (!selectedRequest) return;

        setIsAuthorizing(true);
        setErrorMessage(null);

        try {
            const result = await authorizeMovementByChief({
                requestId: selectedRequest.id,
                chiefName,
                chiefIdNumber,
                chiefDepartment,
                signatureFile: signature?.dataUrl ?? null,
                authorizedArtworkIds: Array.from(checkedArtworkIds),
            });

            if (!result.success) {
                setErrorMessage(result.error || "Error al procesar la autorización.");
                setIsConfirmModalOpen(false);
                return;
            }

            setSuccessMessage(
                `¡Autorización completada con éxito! Se autorizaron ${checkedArtworkIds.size} de ${artworks.length} obras. La solicitud pasó a la etapa de Seguridad.`
            );
            setIsConfirmModalOpen(false);

            // Deselect current request or remove from pending list
            setSelectedRequest(null);
        } catch (err: unknown) {
            console.error("Authorization error:", err);
            const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado al autorizar el movimiento.";
            setErrorMessage(msg);
            setIsConfirmModalOpen(false);
        } finally {
            setIsAuthorizing(false);
        }
    };

    // Execute Rejection
    const handleConfirmReject = async (reason: string) => {
        if (!selectedRequest) return;

        setIsRejecting(true);
        setErrorMessage(null);

        try {
            const result = await rejectChiefRequestAction(
                selectedRequest.id,
                chiefName,
                reason
            );

            if (!result.success) {
                setErrorMessage(result.error || "Error al rechazar la solicitud.");
                return;
            }

            setSuccessMessage(`La solicitud SOL-#${String(selectedRequest.request_number).padStart(4, "0")} ha sido rechazada.`);
            setIsRejectModalOpen(false);
            setSelectedRequest(null);
        } catch (err: unknown) {
            console.error("Reject error:", err);
            const msg = err instanceof Error ? err.message : "Ocurrió un error al rechazar la solicitud.";
            setErrorMessage(msg);
        } finally {
            setIsRejecting(false);
        }
    };

    // Filter pending requests for tray search
    const filteredPending = requests.filter((r) => {
        if (!searchPendingQuery) return true;
        const q = searchPendingQuery.toLowerCase();
        return (
            r.request_number.toString().includes(q) ||
            r.destination.toLowerCase().includes(q) ||
            (r.responsible_name && r.responsible_name.toLowerCase().includes(q))
        );
    });

    const isPartialSelection = checkedArtworkIds.size > 0 && checkedArtworkIds.size < artworks.length;

    return (
        <div className="min-h-screen bg-art-bg-secondary flex flex-col">
            {/* Institutional Header */}
            <ChiefHeader
                userName={userProfile.full_name || "Jefe de Dependencia"}
                userRole={userProfile.role}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Tabs */}
                <ChiefTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    pendingCount={requests.length}
                    historyCount={historicalRequests.length}
                />

                {/* Notifications & Feedback */}
                {successMessage && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">{successMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage(null)}
                            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium">{errorMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="text-red-700 hover:text-red-900 text-xs font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* TAB 1: PENDING REQUESTS VIEW */}
                {activeTab === "pending" && (
                    requests.length === 0 ? (
                        <RequestEmptyState
                            title="No hay solicitudes pendientes de autorización"
                            description="En este momento no existen traslados pendientes de firma o revisión por parte del Jefe de Dependencia."
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Tray of Pending Requests (4 cols) */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="rounded-xl border border-art-border bg-art-bg-elevated p-4 shadow-art-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-serif text-sm font-bold text-art-fg-primary">
                                            Bandeja de Solicitudes
                                        </h2>
                                        <span className="rounded-full bg-art-accent-gold/15 px-2 py-0.5 text-[10px] font-bold text-art-accent-gold-dark">
                                            {filteredPending.length} pendientes
                                        </span>
                                    </div>

                                    {/* Search input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchPendingQuery}
                                            onChange={(e) => setSearchPendingQuery(e.target.value)}
                                            placeholder="Filtrar por N°, destino o custodio..."
                                            className="w-full rounded-lg border border-art-border bg-art-bg-primary pl-8 pr-3 py-1.5 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none transition-colors"
                                        />
                                        <svg
                                            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-art-fg-muted"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Requests list */}
                                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                                    {filteredPending.map((req) => (
                                        <ChiefRequestCard
                                            key={req.id}
                                            request={req}
                                            isSelected={selectedRequest?.id === req.id}
                                            onSelect={handleSelectRequest}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Request Details, Interactive Checklist & Snapshot Form (8 cols) */}
                            <div className="lg:col-span-8 space-y-6">
                                {selectedRequest ? (
                                    <>
                                        {/* Request Summary Banner */}
                                        <div className="rounded-xl border border-art-border bg-art-bg-elevated p-6 shadow-art-sm space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-art-border pb-3">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-art-accent-gold-dark">
                                                        SOL-#{String(selectedRequest.request_number).padStart(4, "0")}
                                                    </span>
                                                    <h2 className="font-serif text-lg font-bold text-art-fg-primary mt-0.5">
                                                        Destino: {selectedRequest.destination}
                                                    </h2>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                                                        selectedRequest.movement_type === "external"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {selectedRequest.movement_type === "external" ? "Traslado Externo" : "Traslado Interno"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                                <div>
                                                    <span className="text-art-fg-muted block">Custodio / Responsable:</span>
                                                    <span className="font-semibold text-art-fg-primary">
                                                        {selectedRequest.responsible_name || "No especificado"}
                                                    </span>
                                                    {selectedRequest.responsible_id_number && (
                                                        <span className="text-[11px] text-art-fg-muted block">
                                                            C.I.: {selectedRequest.responsible_id_number}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <span className="text-art-fg-muted block">Aprobado por Bienes:</span>
                                                    <span className="font-semibold text-art-fg-primary">
                                                        {selectedRequest.bienes_officer_name || "Aprobado"}
                                                    </span>
                                                    {selectedRequest.bienes_approved_at && (
                                                        <span className="text-[11px] text-art-fg-muted block">
                                                            {formatDistanceToNow(new Date(selectedRequest.bienes_approved_at), { addSuffix: true, locale: es })}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <span className="text-art-fg-muted block">Propósito:</span>
                                                    <span className="font-medium text-art-fg-secondary italic">
                                                        &ldquo;{selectedRequest.purpose || "Traslado institucional de colección"}&rdquo;
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interactive Artworks Checklist Section */}
                                        <div className="rounded-xl border border-art-border bg-art-bg-elevated p-6 shadow-art-sm space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-art-border pb-3">
                                                <div>
                                                    <h3 className="font-serif text-base font-bold text-art-fg-primary">
                                                        Checklist de Obras a Autorizar
                                                    </h3>
                                                    <p className="text-xs text-art-fg-muted">
                                                        Marca únicamente las piezas autorizadas para salir de custodia
                                                    </p>
                                                </div>

                                                {/* Bulk selection actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSelectAll}
                                                        className="text-xs font-medium text-art-accent-gold hover:underline"
                                                    >
                                                        Aprobar todas ({artworks.length})
                                                    </button>
                                                    <span className="text-art-border">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeselectAll}
                                                        className="text-xs font-medium text-art-fg-muted hover:underline"
                                                    >
                                                        Deseleccionar todas
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Selection counter pill & partial warning */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 bg-art-bg-surface/50 p-3 rounded-lg border border-art-border">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-art-fg-secondary">
                                                        Selección actual:
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-art-accent-gold px-2.5 py-0.5 text-xs font-bold text-white">
                                                        {checkedArtworkIds.size} de {artworks.length} obras seleccionadas
                                                    </span>
                                                </div>

                                                {isPartialSelection && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Aprobación Parcial ({artworks.length - checkedArtworkIds.size} piezas quedarán excluidas)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Artworks List */}
                                            {loadingArtworks ? (
                                                <RequestSkeleton />
                                            ) : artworks.length === 0 ? (
                                                <div className="p-8 text-center text-xs text-art-fg-muted border border-dashed border-art-border rounded-lg">
                                                    No se encontraron obras vinculadas a esta solicitud.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {artworks.map((artwork) => (
                                                        <ArtworkChecklistItem
                                                            key={artwork.id}
                                                            artwork={artwork}
                                                            isChecked={checkedArtworkIds.has(artwork.id)}
                                                            onToggle={handleToggleArtwork}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Chief Snapshot Form (Editable fields + Signature) */}
                                        <ChiefSnapshotForm
                                            chiefName={chiefName}
                                            onChiefNameChange={setChiefName}
                                            chiefIdNumber={chiefIdNumber}
                                            onChiefIdNumberChange={setChiefIdNumber}
                                            chiefDepartment={chiefDepartment}
                                            onChiefDepartmentChange={setChiefDepartment}
                                            signature={signature}
                                            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                                        />

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsRejectModalOpen(true)}
                                                disabled={isAuthorizing || isRejecting}
                                                className="rounded-lg border border-red-300 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 transition-colors"
                                            >
                                                Rechazar Solicitud
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handlePrepareAuthorization}
                                                disabled={isAuthorizing || isRejecting || checkedArtworkIds.size === 0}
                                                className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-6 py-2.5 text-xs font-bold text-white shadow-art-md hover:bg-art-accent-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Autorizar Traslado ({checkedArtworkIds.size} de {artworks.length} obras)
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-art-border bg-art-bg-elevated p-12 text-center space-y-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-art-accent-gold/10 text-art-accent-gold mx-auto">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                            </svg>
                                        </div>
                                        <h3 className="font-serif text-sm font-bold text-art-fg-primary">
                                            Selecciona una solicitud
                                        </h3>
                                        <p className="text-xs text-art-fg-muted max-w-sm mx-auto">
                                            Haz clic en una solicitud de la bandeja izquierda para revisar sus obras y estampar tu firma de autorización.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}

                {/* TAB 2: HISTORY VIEW */}
                {activeTab === "history" && (
                    <ChiefHistorySection historicalRequests={historicalRequests} />
                )}
            </main>

            {/* Modals */}
            <DualSignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onConfirm={(sigPayload) => {
                    setSignature(sigPayload);
                    setErrorMessage(null);
                }}
                initialSignatureUrl={signature?.dataUrl}
            />

            {selectedRequest && (
                <>
                    <ChiefConfirmModal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={handleConfirmAuthorization}
                        authorizedCount={checkedArtworkIds.size}
                        totalCount={artworks.length}
                        chiefName={chiefName}
                        chiefIdNumber={chiefIdNumber}
                        chiefDepartment={chiefDepartment}
                        signature={signature}
                        isAuthorizing={isAuthorizing}
                    />

                    <ChiefRejectModal
                        isOpen={isRejectModalOpen}
                        onClose={() => setIsRejectModalOpen(false)}
                        onReject={handleConfirmReject}
                        isRejecting={isRejecting}
                        requestNumber={selectedRequest.request_number}
                    />
                </>
            )}
        </div>
    );
}
