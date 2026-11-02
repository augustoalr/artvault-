"use client";

import { MovementRequest } from "@/lib/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChiefRequestCardProps {
    request: MovementRequest;
    isSelected: boolean;
    onSelect: (request: MovementRequest) => void;
}

export function ChiefRequestCard({
    request,
    isSelected,
    onSelect,
}: ChiefRequestCardProps) {
    const artworkCount = request.artwork_ids?.length ?? 0;
    const timeAgo = request.created_at
        ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })
        : "";

    return (
        <div
            onClick={() => onSelect(request)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(request);
                }
            }}
            className={`group relative flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-all ${
                isSelected
                    ? "border-art-accent-gold bg-art-accent-gold/5 shadow-art-md"
                    : "border-art-border bg-art-bg-elevated hover:border-art-accent-gold/40 hover:bg-art-bg-secondary/40"
            }`}
        >
            {/* Header: Request Number & Movement Type */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-art-accent-gold-dark">
                    SOL-#{String(request.request_number).padStart(4, "0")}
                </span>

                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        request.movement_type === "external"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                >
                    {request.movement_type === "external" ? "Externo" : "Interno"}
                </span>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-art-fg-primary mb-1">
                <svg className="h-3.5 w-3.5 shrink-0 text-art-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{request.destination}</span>
            </div>

            {/* Requester & Artworks count */}
            <div className="flex items-center justify-between text-[11px] text-art-fg-muted mt-2 border-t border-art-border/50 pt-2">
                <span className="truncate max-w-[130px]">
                    {request.responsible_name || "Sin responsable"}
                </span>
                <span className="inline-flex items-center rounded bg-art-bg-surface px-1.5 py-0.5 text-[10px] font-medium text-art-fg-secondary">
                    {artworkCount} {artworkCount === 1 ? "obra" : "obras"}
                </span>
            </div>

            {/* Relative Date */}
            {timeAgo && (
                <div className="text-[10px] text-art-fg-muted mt-1 text-right">
                    {timeAgo}
                </div>
            )}
        </div>
    );
}
