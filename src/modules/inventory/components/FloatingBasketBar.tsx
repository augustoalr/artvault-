"use client";

import { useMovementBasket } from "@/modules/inventory/context/MovementBasketContext";
import { useState } from "react";
import { BasketManagerModal } from "./BasketManagerModal";
// import { BatchMovementModal } from "./BatchMovementModal"; // We will create this next

export function FloatingBasketBar() {
    const { basket, clearBasket } = useMovementBasket();
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    if (basket.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
                <div className="flex items-center gap-4 rounded-full border border-art-accent-gold/30 bg-art-bg-surface/95 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                    <span className="flex items-center gap-2 text-sm font-medium text-art-fg-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-art-accent-gold text-xs font-bold text-white">
                            {basket.length}
                        </span>
                        Obras seleccionadas
                    </span>

                    <div className="h-4 w-px bg-art-border" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearBasket}
                            className="rounded-full px-3 py-1.5 text-xs font-medium text-art-fg-muted hover:bg-art-bg-secondary hover:text-art-danger transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={() => setIsBatchModalOpen(true)}
                            className="flex items-center gap-2 rounded-full bg-art-accent-gold px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                            </svg>
                            Mover Lote
                        </button>
                    </div>
                </div>
            </div>

            {/* Actual Batch Modal */}
            {isBatchModalOpen && (
                <BasketManagerModal
                    isOpen={isBatchModalOpen}
                    onClose={() => setIsBatchModalOpen(false)}
                />
            )}
        </>
    );
}
