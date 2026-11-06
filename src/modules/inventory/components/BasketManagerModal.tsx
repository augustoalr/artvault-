"use client";

import { useState } from "react";
import { useMovementBasket } from "@/modules/inventory/context/MovementBasketContext";
import { LocationAutocomplete } from "@/modules/shared/components/LocationAutocomplete";
import { createBatchMovementAction } from "@/modules/inventory/services/movementService";

interface BasketManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BasketManagerModal({ isOpen, onClose }: BasketManagerModalProps) {
    const { basket, clearBasket, removeFromBasket } = useMovementBasket();
    const [destination, setDestination] = useState("");
    const [movementType, setMovementType] = useState<"internal" | "external">("internal");
    const [responsibleName, setResponsibleName] = useState("");
    const [responsibleId, setResponsibleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createBatchMovementAction({
                artwork_ids: basket.map(a => a.id),
                destination,
                movement_type: movementType,
                responsible_name: movementType === "external" ? responsibleName : undefined,
                responsible_id_number: movementType === "external" ? responsibleId : undefined,
            });

            if (result.success) {
                clearBasket();
                onClose();
            } else {
                setError(result.error || "Error desconocido");
            }
        } catch (err) {
            setError("Error de conexión");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
            <div
                className="w-full max-w-lg rounded-2xl bg-white dark:bg-art-bg-surface p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] md:max-h-[85vh] border border-art-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Fixed) */}
                <div className="flex items-center justify-between pb-3 border-b border-art-border shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-art-fg-primary">
                            Mover Lote
                        </h2>
                        <p className="text-xs text-art-fg-muted">
                            Traslado simultáneo de obras seleccionadas
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-art-fg-muted hover:text-art-fg-primary p-1.5 rounded-lg hover:bg-art-bg-secondary transition-colors"
                        title="Cerrar modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form & Scrollable Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                    {/* Artworks List / Basket Stack */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-art-accent-gold text-[11px] font-bold text-white shadow-xs">
                                    {basket.length}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-art-fg-secondary">
                                    Obras en el lote
                                </span>
                            </div>
                            <span className="text-[11px] text-art-fg-muted">
                                {basket.length === 1 ? "1 obra" : `${basket.length} obras`}
                            </span>
                        </div>

                        {basket.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-art-border p-4 text-center text-xs text-art-fg-muted">
                                No hay obras seleccionadas en la cesta.
                            </div>
                        ) : (
                            /* Responsive Card Stack with Horizontal Scroll in mobile and 2-column grid in sm+ */
                            <div className="overflow-x-auto pb-2 -mx-1 px-1 flex sm:grid sm:grid-cols-2 gap-2 max-h-44 sm:max-h-40 overflow-y-auto">
                                {basket.map((item) => (
                                    <div
                                        key={item.id}
                                        className="shrink-0 w-52 sm:w-auto flex items-center justify-between gap-2 rounded-lg border border-art-border bg-art-bg-secondary/60 p-2 text-xs hover:border-art-accent-gold/40 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-art-fg-primary truncate">{item.title}</p>
                                            <p className="text-[10px] text-art-fg-muted truncate">
                                                <span className="font-mono text-art-accent-gold font-medium">#{item.inventory_number}</span>
                                                {item.artwork_location ? ` · ${item.artwork_location}` : ""}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFromBasket(item.id)}
                                            className="text-art-fg-muted hover:text-art-color-danger p-1 rounded transition-colors shrink-0"
                                            title="Quitar del lote"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Destination */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-art-fg-secondary uppercase tracking-wider">
                            Destino / Ubicación <span className="text-art-color-danger">*</span>
                        </label>
                        <div className="relative z-20">
                            <LocationAutocomplete
                                value={destination}
                                onChange={setDestination}
                                placeholder="Ej: Bóveda 1, Museo Bellas Artes..."
                                required
                            />
                        </div>
                        <p className="text-[11px] text-art-fg-muted">
                            Selecciona una ubicación existente o escribe una nueva para crearla.
                        </p>
                    </div>

                    {/* Type Toggle */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-art-fg-secondary uppercase tracking-wider">
                            Tipo de Traslado
                        </label>
                        <div className="flex p-1 bg-art-bg-secondary rounded-lg border border-art-border">
                            <button
                                type="button"
                                onClick={() => setMovementType("internal")}
                                className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                                    movementType === "internal"
                                        ? "bg-white shadow-xs text-art-fg-primary"
                                        : "text-art-fg-muted hover:text-art-fg-secondary"
                                }`}
                            >
                                Interno
                            </button>
                            <button
                                type="button"
                                onClick={() => setMovementType("external")}
                                className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                                    movementType === "external"
                                        ? "bg-white shadow-xs text-art-fg-primary"
                                        : "text-art-fg-muted hover:text-art-fg-secondary"
                                }`}
                            >
                                Externo / Salida
                            </button>
                        </div>
                    </div>

                    {/* Internal Info */}
                    {movementType === "internal" && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <strong>Actualización directa:</strong> Los traslados internos se registran inmediatamente en el inventario patrimonial.
                            </div>
                        </div>
                    )}

                    {/* External Fields */}
                    {movementType === "external" && (
                        <div className="space-y-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 p-3.5 text-xs text-amber-900 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <strong>Flujo Institucional de Aprobación:</strong> Se generará una solicitud que requerirá el aval del <strong>Jefe de Bienes Nacionales</strong> y el control del <strong>Oficial de Seguridad</strong>.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                                    Nombre del Responsable (Quien retira) <span className="text-art-color-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={responsibleName}
                                    onChange={(e) => setResponsibleName(e.target.value)}
                                    className="w-full px-3 py-2 border border-art-border rounded-lg text-base sm:text-xs bg-white text-art-fg-primary focus:ring-2 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none"
                                    placeholder="Nombre y apellido completos"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                                    Documento de Identidad (C.I. / DNI) <span className="text-art-color-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={responsibleId}
                                    onChange={(e) => setResponsibleId(e.target.value)}
                                    className="w-full px-3 py-2 border border-art-border rounded-lg text-base sm:text-xs bg-white text-art-fg-primary focus:ring-2 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none"
                                    placeholder="Ej: 12.345.678"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Buttons (Fixed at bottom of form) */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-art-border shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-art-fg-secondary hover:bg-art-bg-secondary rounded-lg border border-art-border transition-colors text-center cursor-pointer"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !destination || basket.length === 0}
                            className="w-full sm:w-auto bg-art-fg-primary text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-center cursor-pointer"
                        >
                            {loading
                                ? "Procesando..."
                                : movementType === "internal"
                                ? `Confirmar Traslado (${basket.length} obras)`
                                : `Crear Solicitud (${basket.length} obras)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
