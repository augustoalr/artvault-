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
    const { basket, clearBasket } = useMovementBasket();
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
                // We could show a success toast here
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-art-fg-primary">Mover Lote</h2>
                    <button onClick={onClose} className="text-art-fg-muted hover:text-art-fg-primary">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-6 bg-art-bg-secondary/50 p-3 rounded-lg flex items-center gap-3">
                    <div className="bg-art-accent-gold text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                        {basket.length}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-art-fg-primary">Obras seleccionadas</p>
                        <p className="text-xs text-art-fg-muted">Estas obras serán trasladadas conjuntamente.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Destination */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-art-fg-secondary">Destino</label>
                        <LocationAutocomplete
                            value={destination}
                            onChange={setDestination}
                            placeholder="Ej: Bóveda 1, Museo Bellas Artes..."
                            required
                        />
                        <p className="text-xs text-art-fg-muted">Selecciona una ubicación existente o escribe una nueva para crearla.</p>
                    </div>

                    {/* Type Toggle */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-art-fg-secondary">Tipo de Traslado</label>
                        <div className="flex p-1 bg-art-bg-secondary rounded-lg">
                            <button
                                type="button"
                                onClick={() => setMovementType("internal")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${movementType === "internal"
                                        ? "bg-white shadow text-art-fg-primary"
                                        : "text-art-fg-muted hover:text-art-fg-secondary"
                                    }`}
                            >
                                Interno
                            </button>
                            <button
                                type="button"
                                onClick={() => setMovementType("external")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${movementType === "external"
                                        ? "bg-white shadow text-art-fg-primary"
                                        : "text-art-fg-muted hover:text-art-fg-secondary"
                                    }`}
                            >
                                Externo / Salida
                            </button>
                        </div>
                    </div>

                    {/* Internal Info */}
                    {movementType === "internal" && (
                        <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                            <strong>Nota:</strong> Los traslados internos se actualizan inmediatamente en el sistema.
                        </div>
                    )}

                    {/* External Fields */}
                    {movementType === "external" && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 border border-amber-100">
                                <strong>Flujo de aprobación en 2 etapas:</strong> Se creará una solicitud que deberá ser aprobada primero por el <strong>Jefe de Bienes Nacionales</strong> y luego autorizada por el <strong>Oficial de Seguridad</strong> antes de registrar el traslado.
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-art-fg-secondary mb-1">Nombre del Responsable (Quien retira)</label>
                                <input
                                    type="text"
                                    required
                                    value={responsibleName}
                                    onChange={e => setResponsibleName(e.target.value)}
                                    className="w-full px-3 py-2 border border-art-border rounded-md text-sm focus:ring-1 focus:ring-art-accent-gold outline-none"
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-art-fg-secondary mb-1">Documento de Identidad (C.I.)</label>
                                <input
                                    type="text"
                                    required
                                    value={responsibleId}
                                    onChange={e => setResponsibleId(e.target.value)}
                                    className="w-full px-3 py-2 border border-art-border rounded-md text-sm focus:ring-1 focus:ring-art-accent-gold outline-none"
                                    placeholder="Ej: 12.345.678"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-art-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-art-fg-secondary hover:bg-art-bg-secondary rounded-md"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !destination}
                            className="bg-art-fg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {loading ? "Procesando..." : movementType === "internal" ? "Confirmar Traslado" : "Crear Solicitud"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
