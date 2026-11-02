"use client";

import { useState, useCallback, useEffect } from "react";
import type { ArtworkMovement } from "@/lib/supabase/types";
import { getArtworkMovements } from "../services/movementService";
import { MovementTimeline } from "./MovementTimeline";
import { RegisterMovementModal } from "./RegisterMovementModal";

interface MovementHistorySectionProps {
    artworkId: string;
    initialMovements: ArtworkMovement[];
    readOnly?: boolean;
}

export function MovementHistorySection({ artworkId, initialMovements, readOnly = false }: MovementHistorySectionProps) {
    const [movements, setMovements] = useState(initialMovements);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Refresh movements when modal closes successfully
    const handleMovementRegistered = useCallback(async () => {
        const updatedMovements = await getArtworkMovements(artworkId);
        setMovements(updatedMovements);
        setIsModalOpen(false);
    }, [artworkId]);

    // Update if initialMovements change (e.g. from server refresh)
    useEffect(() => {
        setMovements(initialMovements);
    }, [initialMovements]);

    return (
        <section className="mt-12 border-t border-art-border-subtle pt-8 animate-in fade-in duration-500 delay-150">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-art-fg-primary">
                    Historial de Movimientos
                </h2>
                {!readOnly && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-art-fg-secondary hover:text-art-fg-primary border border-art-border-strong rounded-md hover:border-art-fg-primary transition-all"
                    >
                        <span className="text-lg leading-none">+</span>
                        <span>Registrar Traslado</span>
                    </button>
                )}
            </div>

            <MovementTimeline movements={movements} />

            {isModalOpen && (
                <RegisterMovementModal
                    artworkId={artworkId}
                    currentLocation={movements[0]?.location}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleMovementRegistered}
                />
            )}
        </section>
    );
}
