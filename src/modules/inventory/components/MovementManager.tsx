/**
 * MovementManager — Sub-form for artwork movements/loans (Page 2).
 * Automates "Salón Bolívar desde 19-08-2025 hasta 31-12-2025" entries.
 * Shows chronological timeline of movements.
 */
"use client";

import { useState } from "react";
import { createMovementAction } from "../services/movementService";
import type { ArtworkMovement } from "@/lib/supabase/types";

interface MovementManagerProps {
    artworkId: string;
    initialMovements?: ArtworkMovement[];
    readOnly?: boolean;
}

interface NewMovement {
    location: string;
    date_from: string;
    date_to: string;
    notes: string;
}

const EMPTY_MOVEMENT: NewMovement = {
    location: "",
    date_from: "",
    date_to: "",
    notes: "",
};

export function MovementManager({
    artworkId,
    initialMovements = [],
    readOnly = false,
}: MovementManagerProps) {
    const [movements, setMovements] = useState<ArtworkMovement[]>(initialMovements);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<NewMovement>(EMPTY_MOVEMENT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleChange(field: keyof NewMovement, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!form.location || !form.date_from) {
            setError("Ubicación y Fecha desde son requeridos.");
            return;
        }

        setSaving(true);
        setError(null);

        const result = await createMovementAction({
            artwork_id: artworkId,
            location: form.location,
            date_from: form.date_from,
            date_to: form.date_to || null,
            notes: form.notes || null,
        });

        if (!result.success) {
            setError(result.error || "Error desconocido.");
            setSaving(false);
            return;
        }

        if (result.data) {
            setMovements((prev) => [result.data!, ...prev]);
        }

        setForm(EMPTY_MOVEMENT);
        setIsAdding(false);
        setSaving(false);
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-art-fg-primary">
                    Historia, Préstamos y Movimientos
                </h4>
                {!readOnly && !isAdding && (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="rounded-lg border border-dashed border-art-accent-gold/40 px-3 py-1.5 text-xs font-medium text-art-accent-gold transition-all hover:border-art-accent-gold hover:bg-art-accent-gold/5"
                    >
                        ＋ Agregar movimiento
                    </button>
                )}
            </div>

            {/* Add form */}
            {isAdding && (
                <div className="rounded-xl border border-art-accent-gold/20 bg-art-bg-secondary/50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Ubicación *
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => handleChange("location", e.target.value)}
                                placeholder="Ej: Salón Bolívar"
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Notas
                            </label>
                            <input
                                type="text"
                                value={form.notes}
                                onChange={(e) => handleChange("notes", e.target.value)}
                                placeholder="Opcional"
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Desde *
                            </label>
                            <input
                                type="date"
                                value={form.date_from}
                                onChange={(e) => handleChange("date_from", e.target.value)}
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={form.date_to}
                                onChange={(e) => handleChange("date_to", e.target.value)}
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                            />
                            <p className="mt-0.5 text-[10px] text-art-fg-muted">
                                Dejar vacío si aún se encuentra ahí
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-art-danger">{error}</p>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => { setIsAdding(false); setForm(EMPTY_MOVEMENT); setError(null); }}
                            className="rounded-lg border border-art-border px-3 py-1.5 text-xs text-art-fg-muted transition-colors hover:border-art-fg-muted"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-art-accent-gold px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-art-accent-gold-dark disabled:opacity-50"
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline */}
            {movements.length === 0 && !isAdding ? (
                <p className="py-6 text-center text-sm text-art-fg-muted italic">
                    Sin movimientos registrados
                </p>
            ) : (
                <div className="relative space-y-0">
                    {/* Vertical line */}
                    {movements.length > 1 && (
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-art-border" />
                    )}

                    {movements.map((m) => {
                        const isCurrent = !m.date_to;
                        return (
                            <div key={m.id} className="relative flex gap-3 py-2">
                                {/* Dot */}
                                <div
                                    className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${isCurrent
                                        ? "border-art-accent-gold bg-art-accent-gold/20"
                                        : "border-art-border bg-art-bg-primary"
                                        }`}
                                />
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-art-fg-primary">
                                        {m.location}
                                        {isCurrent && (
                                            <span className="ml-2 inline-block rounded-full bg-art-accent-gold/10 px-2 py-0.5 text-[10px] font-semibold text-art-accent-gold">
                                                ACTUAL
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-art-fg-muted">
                                        {formatDate(m.date_from)}
                                        {m.date_to ? ` — ${formatDate(m.date_to)}` : " — presente"}
                                    </p>
                                    {m.notes && (
                                        <p className="mt-0.5 text-xs text-art-fg-secondary italic">{m.notes}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
