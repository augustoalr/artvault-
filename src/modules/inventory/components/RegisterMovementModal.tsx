"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMovementAction } from "../services/movementService";
import { LocationAutocomplete } from "@/modules/shared/components/LocationAutocomplete";

interface RegisterMovementModalProps {
    artworkId: string;
    currentLocation?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function RegisterMovementModal({
    artworkId,
    currentLocation,
    isOpen,
    onClose,
    onSuccess,
}: RegisterMovementModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        location: "",
        date_from: new Date().toISOString().split("T")[0],
        notes: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createMovementAction({
                artwork_id: artworkId,
                ...formData,
            });

            if (!result.success) {
                throw new Error(result.error || "Error al registrar movimiento");
            }

            setFormData({
                location: "",
                date_from: new Date().toISOString().split("T")[0],
                notes: "",
            });

            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to register movement:", error);
            alert("Error al registrar movimiento. Por favor intente de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
            <div
                className="bg-white dark:bg-art-bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-art-border flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Fixed) */}
                <div className="px-4 sm:px-6 py-4 border-b border-art-border flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-base sm:text-lg font-serif font-bold text-art-fg-primary">
                            Registrar Movimiento
                        </h3>
                        <p className="text-xs text-art-fg-muted">
                            Actualización de localización física de la obra
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
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {currentLocation && (
                        <div className="p-3 bg-art-bg-secondary rounded-lg border border-art-border">
                            <span className="text-[10px] sm:text-xs font-semibold text-art-fg-muted uppercase tracking-wider block mb-0.5">
                                Origen (Ubicación Actual)
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-art-fg-primary block">
                                {currentLocation}
                            </span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-art-fg-secondary uppercase tracking-wider">
                            Destino / Nueva Ubicación <span className="text-art-color-danger">*</span>
                        </label>
                        <div className="relative z-20">
                            <LocationAutocomplete
                                value={formData.location}
                                onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                                required
                                placeholder="Ej: Sala de Exposiciones 1"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-art-fg-secondary uppercase tracking-wider">
                            Fecha de Traslado <span className="text-art-color-danger">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-art-border rounded-lg text-base sm:text-xs focus:ring-2 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none bg-transparent text-art-fg-primary"
                            value={formData.date_from}
                            onChange={(e) => setFormData((prev) => ({ ...prev, date_from: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-art-fg-secondary uppercase tracking-wider">
                            Notas (Opcional)
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-art-border rounded-lg text-base sm:text-xs focus:ring-2 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none bg-transparent resize-none text-art-fg-primary placeholder:text-art-fg-muted"
                            placeholder="Detalles sobre el traslado, motivo, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    {/* Action Buttons (Fixed in footer of modal) */}
                    <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t border-art-border shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-art-fg-secondary hover:bg-art-bg-secondary rounded-lg border border-art-border transition-colors text-center cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.location.trim()}
                            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-art-fg-primary hover:bg-black/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-center cursor-pointer"
                        >
                            {isLoading ? "Registrando..." : "Confirmar Traslado"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
