/**
 * TransfersWidget — Live transfers panel for the Dashboard.
 * Shows all active movement requests grouped by approval stage.
 * Expandable rows reveal artwork/destination details without navigation.
 */
"use client";

import { useState } from "react";
import { MovementRequest } from "@/lib/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TransfersWidgetProps {
    pendingBienes: MovementRequest[];
    pendingSecurity: MovementRequest[];
    authorizedToday: MovementRequest[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function relativeTime(iso: string | null) {
    if (!iso) return "";
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
}

// ─── Single Request Row ──────────────────────────────────────────────────

interface RequestRowProps {
    req: MovementRequest;
    accentColor: string;
}

function RequestRow({ req, accentColor }: RequestRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-lg border border-gray-100 bg-white overflow-hidden transition-shadow hover:shadow-sm">
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${accentColor}`} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">#{req.request_number}</span>
                            <span className="text-sm font-semibold text-gray-900 truncate">{req.destination}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span>👤 {req.responsible_name ?? "Sin responsable"}</span>
                            <span>·</span>
                            <span>📦 {req.artwork_ids?.length ?? 0} {(req.artwork_ids?.length ?? 0) === 1 ? "obra" : "obras"}</span>
                            <span>·</span>
                            <span>{relativeTime(req.created_at)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${req.movement_type === "external" ? "text-orange-500" : "text-blue-500"}`}>
                        {req.movement_type === "external" ? "↗ Externo" : "↔ Interno"}
                    </span>
                    <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs text-gray-600 space-y-1.5">
                    {req.responsible_name && (
                        <p><span className="font-semibold">Responsable:</span> {req.responsible_name} · CI: {req.responsible_id_number ?? "—"}</p>
                    )}
                    {req.purpose && (
                        <p><span className="font-semibold">Finalidad:</span> {req.purpose}</p>
                    )}
                    {req.bienes_officer_name && (
                        <p className="text-amber-700"><span className="font-semibold">✓ Bienes:</span> {req.bienes_officer_name} {req.bienes_approved_at ? `· ${relativeTime(req.bienes_approved_at)}` : ""}</p>
                    )}
                    {req.security_officer_name && (
                        <p className="text-emerald-700"><span className="font-semibold">✓ Seguridad:</span> {req.security_officer_name} {req.authorized_at ? `· ${relativeTime(req.authorized_at)}` : ""}</p>
                    )}
                    <p className="text-gray-400">Creada: {req.created_at ? new Date(req.created_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                </div>
            )}
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────

interface SectionProps {
    title: string;
    subtitle: string;
    requests: MovementRequest[];
    indicatorColor: string;
    dotColor: string;
    emptyText?: string;
}

function Section({ title, subtitle, requests, indicatorColor, dotColor, emptyText }: SectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    if (requests.length === 0 && !emptyText) return null;

    return (
        <div>
            <button
                onClick={() => setCollapsed(p => !p)}
                className="flex items-center justify-between w-full mb-2 group"
            >
                <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${indicatorColor}`} />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${subtitle}`}>
                        {requests.length}
                    </span>
                </div>
                <svg
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {!collapsed && (
                <div className="space-y-2">
                    {requests.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-4">{emptyText}</p>
                    ) : (
                        requests.map(req => (
                            <RequestRow key={req.id} req={req} accentColor={dotColor} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Widget ──────────────────────────────────────────────────────────

export function TransfersWidget({ pendingBienes, pendingSecurity, authorizedToday }: TransfersWidgetProps) {
    const totalActive = pendingBienes.length + pendingSecurity.length;

    return (
        <div className="rounded-xl border border-art-border bg-art-bg-elevated shadow-[var(--art-shadow-sm)] overflow-hidden">
            {/* Widget Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-art-border bg-art-bg-surface">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-art-accent-gold/10 text-art-accent-gold">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-art-fg-primary">Traslados en Curso</h2>
                        <p className="text-xs text-art-fg-muted">
                            {totalActive === 0 ? "Sin traslados activos" : `${totalActive} pendiente${totalActive !== 1 ? "s" : ""} de autorización`}
                        </p>
                    </div>
                </div>
                {totalActive > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                        {totalActive}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-5">
                {totalActive === 0 && authorizedToday.length === 0 ? (
                    <div className="py-6 text-center">
                        <p className="text-2xl mb-1">✓</p>
                        <p className="text-sm font-medium text-art-fg-secondary">Todo en orden</p>
                        <p className="text-xs text-art-fg-muted">No hay traslados activos ni autorizaciones hoy.</p>
                    </div>
                ) : (
                    <>
                        <Section
                            title="Esperando Bienes Nacionales"
                            subtitle="bg-amber-100 text-amber-700"
                            requests={pendingBienes}
                            indicatorColor="bg-amber-400"
                            dotColor="bg-amber-400"
                        />
                        <Section
                            title="Esperando Seguridad"
                            subtitle="bg-blue-100 text-blue-700"
                            requests={pendingSecurity}
                            indicatorColor="bg-blue-400"
                            dotColor="bg-blue-400"
                        />
                        {authorizedToday.length > 0 && (
                            <Section
                                title="Autorizados Hoy"
                                subtitle="bg-emerald-100 text-emerald-700"
                                requests={authorizedToday}
                                indicatorColor="bg-emerald-400"
                                dotColor="bg-emerald-400"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
