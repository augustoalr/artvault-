"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Artwork } from "@/lib/supabase/types";

interface BasketContextType {
    basket: Artwork[];
    addToBasket: (artworks: Artwork[]) => void;
    removeFromBasket: (artworkId: string) => void;
    clearBasket: () => void;
    isInBasket: (artworkId: string) => boolean;
    basketCount: number;
}

const MovementBasketContext = createContext<BasketContextType | undefined>(undefined);

export function MovementBasketProvider({ children }: { children: ReactNode }) {
    const [basket, setBasket] = useState<Artwork[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize from Storage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("movement_basket");
            if (stored) {
                try {
                    setBasket(JSON.parse(stored));
                } catch (e) {
                    console.error("Error parsing basket from storage", e);
                }
            }
            setIsInitialized(true);
        }
    }, []);

    // Save to Storage
    useEffect(() => {
        if (!isInitialized) return;
        sessionStorage.setItem("movement_basket", JSON.stringify(basket));
    }, [basket, isInitialized]);

    const addToBasket = useCallback((newArtworks: Artwork[]) => {
        setBasket(prev => {
            const currentIds = new Set(prev.map(a => a.id));
            const uniqueNew = newArtworks.filter(a => !currentIds.has(a.id));
            return [...prev, ...uniqueNew];
        });
    }, []);

    const removeFromBasket = useCallback((artworkId: string) => {
        setBasket(prev => prev.filter(a => a.id !== artworkId));
    }, []);

    const clearBasket = useCallback(() => {
        setBasket([]);
    }, []);

    const isInBasket = useCallback((artworkId: string) => {
        return basket.some(a => a.id === artworkId);
    }, [basket]);

    return (
        <MovementBasketContext.Provider value={{
            basket,
            addToBasket,
            removeFromBasket,
            clearBasket,
            isInBasket,
            basketCount: basket.length
        }}>
            {children}
        </MovementBasketContext.Provider>
    );
}

export function useMovementBasket() {
    const context = useContext(MovementBasketContext);
    if (context === undefined) {
        throw new Error("useMovementBasket must be used within a MovementBasketProvider");
    }
    return context;
}
