"use client";

import { useState, useEffect, useRef } from "react";
import { getDistinctLocations } from "@/modules/inventory/services/movementService";

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

export function LocationAutocomplete({
    value,
    onChange,
    placeholder = "Ej: Bóveda 1",
    required = false
}: LocationAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [filtered, setFiltered] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load suggestions on mount
        getDistinctLocations().then(setSuggestions).catch(console.error);
    }, []);

    useEffect(() => {
        // Filter suggestions
        if (!value) {
            setFiltered([]);
            return;
        }

        const lowerVal = value.toLowerCase();
        const matches = suggestions.filter(s =>
            s.toLowerCase().includes(lowerVal) && s.toLowerCase() !== lowerVal
        ).slice(0, 5); // Limit to 5

        setFiltered(matches);
        setIsOpen(matches.length > 0);
    }, [value, suggestions]);

    useEffect(() => {
        // Click outside listener
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                required={required}
                className="w-full px-3 py-2 border border-art-border-strong rounded-md focus:ring-1 focus:ring-art-accent-gold focus:border-art-accent-gold outline-none bg-transparent"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => value && filtered.length > 0 && setIsOpen(true)}
            />

            {isOpen && filtered.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-art-bg-surface border border-art-border shadow-lg rounded-md max-h-48 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    {filtered.map((suggestion) => (
                        <li
                            key={suggestion}
                            className="px-3 py-2 text-sm text-art-fg-primary hover:bg-art-bg-secondary cursor-pointer transition-colors"
                            onClick={() => handleSelect(suggestion)}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
