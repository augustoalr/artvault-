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

export function RegisterMovementModal({ artworkId, currentLocation, isOpen, onClose, onSuccess }: RegisterMovementModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        location: "",
        date_from: new Date().toISOString().split('T')[0],
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
                date_from: new Date().toISOString().split('T')[0],
                notes: "",
            });

            router.refresh(); // Refresh server components to show up-to-date data
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to register movement:", error);
            // Ideally show toast notification here
            alert("Error al registrar movimiento. Por favor intente de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-art-bg-primary w-full max-w-md rounded-lg shadow-xl border border-art-border-subtle overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-art-border-subtle flex justify-between items-center">
                    <h3 className="text-lg font-serif font-medium text-art-fg-primary">
                        Registrar Movimiento
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-art-fg-muted hover:text-art-fg-primary transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {currentLocation && (
                        <div className="p-3 bg-art-bg-secondary rounded-md border border-art-border-subtle">
                            <span className="text-xs font-semibold text-art-fg-muted uppercase tracking-wider block mb-1">
                                Origen (Ubicación Actual)
                            </span>
                            <span className="text-sm font-medium text-art-fg-primary">
                                {currentLocation}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-art-fg-secondary mb-1">
                            Destino / Nueva Ubicación
                        </label>
                        <LocationAutocomplete
                            value={formData.location}
                            onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                            required
                            placeholder="Ej: Sala de Exposiciones 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-art-fg-secondary mb-1">
                            Fecha de Traslado
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-art-border-strong rounded-md focus:ring-1 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none bg-transparent"
                            value={formData.date_from}
                            onChange={(e) => setFormData(prev => ({ ...prev, date_from: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-art-fg-secondary mb-1">
                            Notas (Opcional)
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-art-border-strong rounded-md focus:ring-1 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none bg-transparent resize-none"
                            placeholder="Detalles sobre el traslado, motivo, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-art-fg-secondary hover:text-art-fg-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-art-fg-primary hover:bg-black rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Registrando..." : "Confirmar Traslado"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
