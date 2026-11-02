/**
 * DynamicSelect — Autocomplete inteligente para campos de catálogo (Categoría, Técnica, etc.)
 * Permite buscar opciones existentes o crear nuevas al vuelo.
 * Se conecta a catalog_options para mantener la consistencia.
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface DynamicSelectProps {
    /** Category key used in catalog_options table */
    category: string;
    /** Display label */
    label: string;
    /** Current value */
    value?: string | null;
    /** Callback when value changes */
    onChange: (value: string) => void;
    /** Pre-loaded options (avoids extra fetch) */
    initialOptions?: string[];
    /** Whether the field is required */
    required?: boolean;
    /** HTML id for the field */
    id?: string;
    /** Whether the field is read-only */
    readOnly?: boolean;
}

export function DynamicSelect({
    category,
    label,
    value,
    onChange,
    initialOptions = [],
    required = false,
    id,
    readOnly = false,
}: DynamicSelectProps) {
    // State
    const [options, setOptions] = useState<string[]>(initialOptions);
    const [inputValue, setInputValue] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(initialOptions.length === 0);
    const [isCreating, setIsCreating] = useState(false); // Loading state for creation

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // On blur, if input matches an option exactly (case-insensitive), normalize it.
                // If it's new and not empty, we keep it as a custom value (but don't add to catalog automatically to avoid pollution).
                // Or should we? The user said "van creando listas desplegables".
                // Let's stick to explicit creation via Enter or Click for now, but ensure the value is kept.
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync input with external value changes
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value || "");
        }
    }, [value]);

    // Fetch options on mount if needed
    useEffect(() => {
        if (initialOptions.length > 0) {
            setLoading(false);
            return;
        }
        async function fetchOptions() {
            setLoading(true);
            const supabase = getSupabaseBrowserClient();
            const { data } = await supabase
                .from("catalog_options")
                .select("value")
                .eq("category", category)
                .eq("is_active", true)
                .order("value");

            if (data) {
                setOptions(data.map((d) => d.value));
            }
            setLoading(false);
        }
        fetchOptions();
    }, [category, initialOptions.length]);

    // Filter options based on input
    const filteredOptions = useMemo(() => {
        if (!inputValue) return options.slice(0, 50); // Show more when empty, but limit for performance
        const lowerInput = inputValue.toLowerCase();
        return options
            .filter((opt) => opt.toLowerCase().includes(lowerInput))
            .slice(0, 10); // Limit to top 10 matches
    }, [inputValue, options]);

    const exactMatch = options.find(
        (opt) => opt.toLowerCase() === inputValue.trim().toLowerCase()
    );

    const showCreateOption = inputValue.trim() && !exactMatch;

    // Handlers
    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setInputValue(optionValue);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        const newValue = inputValue.trim();
        if (!newValue) return;

        setIsCreating(true);
        const supabase = getSupabaseBrowserClient();

        // Optimistic update
        const newOptions = [...options, newValue].sort();
        setOptions(newOptions);
        onChange(newValue);
        setIsOpen(false);

        // Persist to catalog
        const { error } = await supabase.from("catalog_options").insert({
            category,
            value: newValue,
        });

        if (error) {
            console.error("Error creating option:", error);
            // Revert if error? For now, let's just log it. The artwork text is saved anyway.
        }
        setIsCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen) {
                if (filteredOptions.length > 0 && filteredOptions[0].toLowerCase() === inputValue.toLowerCase()) {
                    handleSelect(filteredOptions[0]);
                } else if (showCreateOption) {
                    handleCreate();
                }
            }
        } else if (e.key === "ArrowDown") {
            // Future improvement: keyboard navigation
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label
                htmlFor={id ?? category}
                className="mb-1.5 block text-sm font-medium text-art-fg-secondary"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    ref={inputRef}
                    id={id ?? category}
                    type="text"
                    required={required}
                    value={inputValue}
                    onChange={(e) => {
                        if (readOnly) return;
                        setInputValue(e.target.value);
                        onChange(e.target.value); // Update parent/form state while typing
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => !readOnly && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    readOnly={readOnly}
                    placeholder={readOnly ? "" : `Seleccione o escriba ${label.toLowerCase()}...`}
                    className={`w-full rounded-lg border bg-art-bg-primary px-3 py-2.5 text-sm text-art-fg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20
                        ${isCreating ? "border-art-accent-gold animate-pulse" : "border-art-border focus:border-art-accent-gold"}
                        ${readOnly ? "border-transparent bg-art-bg-secondary/50 cursor-default" : "border-art-border bg-art-bg-primary"}
                    `}
                    autoComplete="off"
                />

                {/* Loading indicator inside input */}
                {(loading || isCreating) && (
                    <div className="absolute right-3 top-2.5">
                        <svg className="h-5 w-5 animate-spin text-art-accent-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}

                {/* Arrow indicator */}
                {!loading && !isCreating && !readOnly && (
                    <div
                        className="absolute right-3 top-3 cursor-pointer text-art-fg-muted hover:text-art-fg-primary"
                        onClick={() => {
                            if (isOpen) setIsOpen(false);
                            else {
                                inputRef.current?.focus();
                                setIsOpen(true);
                            }
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-art-border bg-white dark:bg-art-bg-surface shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((opt) => (
                                <li
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`cursor-pointer px-4 py-2 text-sm text-art-fg-primary hover:bg-art-bg-secondary
                                        ${opt === value ? "bg-art-accent-gold/10 text-art-accent-gold font-medium" : ""}
                                    `}
                                >
                                    {opt}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !showCreateOption && !loading && (
                            <div className="px-4 py-3 text-center text-sm text-art-fg-muted">
                                No se encontraron opciones
                            </div>
                        )
                    )}

                    {/* Create New Option */}
                    {showCreateOption && (
                        <div
                            onClick={handleCreate}
                            className="cursor-pointer border-t border-art-border bg-art-bg-secondary/30 px-4 py-3 text-sm text-art-accent-gold hover:bg-art-bg-secondary transition-colors"
                        >
                            <span className="font-semibold">+ Crear nueva opción:</span> "{inputValue}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
