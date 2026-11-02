/**
 * ActivityTimeline — Visual audit trail component.
 * Shows a premium timeline of recent changes with:
 * - User avatar/name
 * - Action type with color coding
 * - Relative timestamps
 * - Expandable diff view (old vs new data)
 */
"use client";

import { useState } from "react";

interface ActivityEntry {
    id: string;
    action: string;
    table_name: string;
    record_id: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
    changed_by_name: string | null;
}

interface ActivityTimelineProps {
    entries: ActivityEntry[];
}

// ─── Action color/icon mapping ───
const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    INSERT: {
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200",
        icon: "＋",
        label: "Creó registro",
    },
    UPDATE: {
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
        icon: "✎",
        label: "Editó registro",
    },
    SOFT_DELETE: {
        color: "text-red-500",
        bg: "bg-red-50 border-red-200",
        icon: "🗑",
        label: "Eliminó registro",
    },
    RESTORE: {
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        icon: "↩",
        label: "Restauró registro",
    },
    SET_MASTER_PASSWORD: {
        color: "text-purple-600",
        bg: "bg-purple-50 border-purple-200",
        icon: "🔒",
        label: "Cambió contraseña maestra",
    },
    FAILED_MASTER_PASSWORD: {
        color: "text-red-600",
        bg: "bg-red-50 border-red-300",
        icon: "⚠",
        label: "Intento fallido de eliminación",
    },
    ROLE_CHANGE: {
        color: "text-violet-600",
        bg: "bg-violet-50 border-violet-200",
        icon: "👤",
        label: "Cambió rol de usuario",
    },
};

const DEFAULT_CONFIG = {
    color: "text-art-fg-secondary",
    bg: "bg-art-bg-secondary border-art-border",
    icon: "•",
    label: "Acción",
};

function getTableLabel(table: string): string {
    const labels: Record<string, string> = {
        artworks: "Obra",
        profiles: "Perfil",
        media_assets: "Imagen",
        app_settings: "Configuración",
        artwork_movements: "Movimiento",
        artwork_conservation: "Conservación",
        artwork_valuations: "Valoración",
    };
    return labels[table] ?? table;
}

function getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Justo ahora";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHour < 24) return `Hace ${diffHour}h`;
    if (diffDay < 7) return `Hace ${diffDay}d`;

    return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function DiffView({
    oldData,
    newData,
}: {
    oldData: Record<string, unknown> | null;
    newData: Record<string, unknown> | null;
}) {
    if (!oldData && !newData) return null;

    // For INSERT, show new data only
    if (!oldData && newData) {
        const entries = Object.entries(newData).filter(
            ([, v]) => v !== null && v !== undefined && v !== ""
        );
        return (
            <div className="mt-2 space-y-1">
                {entries.slice(0, 10).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-[11px]">
                        <span className="shrink-0 font-medium text-art-fg-muted">{key}:</span>
                        <span className="text-emerald-600 truncate">{String(val)}</span>
                    </div>
                ))}
                {entries.length > 10 && (
                    <p className="text-[10px] text-art-fg-muted">
                        +{entries.length - 10} campos más
                    </p>
                )}
            </div>
        );
    }

    // For UPDATE, show changed fields
    if (oldData && newData) {
        const changedKeys = Object.keys(newData).filter(
            (k) => JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])
        );

        if (changedKeys.length === 0) return null;

        return (
            <div className="mt-2 space-y-1.5">
                {changedKeys.slice(0, 8).map((key) => (
                    <div key={key} className="text-[11px]">
                        <span className="font-medium text-art-fg-muted">{key}:</span>
                        <div className="ml-3 flex flex-col gap-0.5">
                            <span className="text-red-400 line-through truncate">
                                {oldData[key] != null ? String(oldData[key]) : "—"}
                            </span>
                            <span className="text-emerald-600 truncate">
                                {newData[key] != null ? String(newData[key]) : "—"}
                            </span>
                        </div>
                    </div>
                ))}
                {changedKeys.length > 8 && (
                    <p className="text-[10px] text-art-fg-muted">
                        +{changedKeys.length - 8} cambios más
                    </p>
                )}
            </div>
        );
    }

    return null;
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-art-bg-secondary">
                    <span className="text-2xl">📋</span>
                </div>
                <p className="text-sm font-medium text-art-fg-secondary">
                    Sin actividad reciente
                </p>
                <p className="mt-1 text-xs text-art-fg-muted">
                    Los cambios aparecerán aquí automáticamente.
                </p>
            </div>
        );
    }

    return (
        <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-art-border" />

            {entries.map((entry) => {
                const config = ACTION_CONFIG[entry.action] ?? DEFAULT_CONFIG;
                const isExpanded = expandedId === entry.id;
                const hasDiff = entry.old_data || entry.new_data;

                return (
                    <div key={entry.id} className="relative flex gap-4 py-3">
                        {/* Circle */}
                        <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${config.bg}`}
                        >
                            {config.icon}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium text-art-fg-primary">
                                        {config.label}
                                    </p>
                                    <p className="text-xs text-art-fg-muted">
                                        {getTableLabel(entry.table_name)}
                                        {entry.changed_by_name && (
                                            <span>
                                                {" · "}
                                                <span className="font-medium text-art-fg-secondary">
                                                    {entry.changed_by_name}
                                                </span>
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <span className="shrink-0 text-[11px] text-art-fg-muted">
                                    {getRelativeTime(entry.created_at)}
                                </span>
                            </div>

                            {/* Expand toggle */}
                            {hasDiff && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpandedId(isExpanded ? null : entry.id)
                                    }
                                    className="mt-1 text-[11px] font-medium text-art-accent-gold transition-colors hover:text-art-accent-gold-dark"
                                >
                                    {isExpanded ? "Ocultar detalles ▲" : "Ver detalles ▼"}
                                </button>
                            )}

                            {/* Diff */}
                            {isExpanded && hasDiff && (
                                <div className="mt-2 rounded-lg border border-art-border bg-art-bg-secondary/50 p-3">
                                    <DiffView
                                        oldData={entry.old_data}
                                        newData={entry.new_data}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
