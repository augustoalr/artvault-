"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ArtworkMovement } from "@/lib/supabase/types";

interface MovementTimelineProps {
    movements: ArtworkMovement[];
}

export function MovementTimeline({ movements }: MovementTimelineProps) {
    if (!movements || movements.length === 0) {
        return (
            <div className="text-center py-8 text-art-fg-muted font-sans text-sm">
                No hay movimientos registrados para esta obra.
            </div>
        );
    }

    return (
        <div className="relative border-l border-art-border-subtle ml-3 space-y-8">
            {movements.map((move, index) => {
                const isCurrent = index === 0 && !move.date_to;

                return (
                    <div key={move.id} className="relative pl-6 group">
                        {/* Timeline Dot */}
                        <div
                            className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-white dark:border-art-bg-primary transition-colors duration-200 ${isCurrent
                                ? "bg-art-accent-gold ring-4 ring-art-accent-gold/20"
                                : "bg-art-border-strong group-hover:bg-art-fg-muted"
                                }`}
                        />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-lg font-serif font-medium text-art-fg-primary">
                                    {move.location}
                                </h4>
                                {move.notes && (
                                    <p className="mt-1 text-sm text-art-fg-muted max-w-prose">
                                        {move.notes}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col items-start sm:items-end text-xs font-mono text-art-fg-muted uppercase tracking-wide">
                                <span>
                                    {format(new Date(move.date_from), "d MMM yyyy", { locale: es })}
                                </span>
                                {isCurrent ? (
                                    <span className="text-art-accent-gold font-bold mt-1 px-2 py-0.5 bg-art-accent-gold/10 rounded-full">
                                        Actual
                                    </span>
                                ) : (
                                    move.date_to && (
                                        <span className="text-art-fg-subtle">
                                            Has: {format(new Date(move.date_to), "d MMM yyyy", { locale: es })}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
