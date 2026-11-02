/**
 * SearchBar — Atomic UI Component
 * Debounced search input with museum-style aesthetics.
 */
"use client";

import { useEffect, useState, useRef } from "react";

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
}

export function SearchBar({
    placeholder = "Buscar obras, artistas, técnicas…",
    onSearch,
    debounceMs = 300,
}: SearchBarProps) {
    const [value, setValue] = useState("");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            onSearch(value);
        }, debounceMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [value, debounceMs, onSearch]);

    return (
        <div className="relative w-full max-w-xl" id="search-bar">
            {/* Search Icon */}
            <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-art-fg-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
            </svg>
            <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-full border border-art-border bg-art-bg-elevated py-3 pl-12 pr-4 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-all duration-[--art-transition-base] focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                id="search-input"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => setValue("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-art-fg-muted hover:text-art-fg-primary transition-colors"
                    aria-label="Limpiar búsqueda"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
