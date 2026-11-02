/**
 * AdvancedSearch — Client component for filtering artworks.
 * Updates URL search params.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DynamicSelect } from "@/modules/shared/components/DynamicSelect"; // Reuse style if needed, but here we just need simple select

interface AdvancedSearchProps {
    catalogOptions: Record<string, string[]>;
}

export function AdvancedSearch({ catalogOptions }: AdvancedSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for inputs
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: searchParams.get("search") || "",
        inventory_number: searchParams.get("inventory_number") || "",
        author: searchParams.get("author") || "",
        title: searchParams.get("title") || "",
        technique: searchParams.get("technique") || "",
        category: searchParams.get("category") || "",
        provenance: searchParams.get("provenance") || "",
        year_from: searchParams.get("year_from") || "",
        year_to: searchParams.get("year_to") || "",
    });

    // Update state if URL changes externally
    useEffect(() => {
        setFilters({
            search: searchParams.get("search") || "",
            inventory_number: searchParams.get("inventory_number") || "",
            author: searchParams.get("author") || "",
            title: searchParams.get("title") || "",
            technique: searchParams.get("technique") || "",
            category: searchParams.get("category") || "",
            provenance: searchParams.get("provenance") || "",
            year_from: searchParams.get("year_from") || "",
            year_to: searchParams.get("year_to") || "",
        });
    }, [searchParams]);

    function handleSearch() {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val) params.set(key, val);
        });
        // Reset page to 1
        params.delete("page");

        router.push(`?${params.toString()}`);
        setIsOpen(false); // Close panel on mobile/desktop? Maybe keep open if desktop.
    }

    function handleReset() {
        setFilters({
            search: "", inventory_number: "", author: "", title: "",
            technique: "", category: "", provenance: "",
            year_from: "", year_to: ""
        });
        router.push("?");
    }

    return (
        <div className="mb-6 space-y-4">
            {/* Search Bar + Filter Toggle */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por título, autor o N° registro…"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-4 py-2.5 pl-10 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-5 w-5 text-art-fg-muted"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${isOpen
                            ? "border-art-accent-gold bg-art-accent-gold/10 text-art-accent-gold"
                            : "border-art-border bg-art-bg-primary text-art-fg-secondary hover:border-art-fg-muted"
                        }`}
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    Filtros {Object.values(filters).filter(v => v && v !== filters.search).length > 0 && `(${Object.values(filters).filter(v => v && v !== filters.search).length})`}
                </button>
                <button
                    onClick={handleSearch}
                    className="rounded-lg bg-art-accent-gold px-6 py-2.5 text-sm font-semibold text-white hover:bg-art-accent-gold-dark"
                >
                    Buscar
                </button>
            </div>

            {/* Expanded Filters Panel */}
            {isOpen && (
                <div className="rounded-xl border border-art-border bg-art-bg-secondary/30 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Input
                            label="N° Registro"
                            value={filters.inventory_number}
                            onChange={(v) => setFilters(prev => ({ ...prev, inventory_number: v }))}
                        />
                        <Input
                            label="Título"
                            value={filters.title}
                            onChange={(v) => setFilters(prev => ({ ...prev, title: v }))}
                        />
                        <Input
                            label="Autor"
                            value={filters.author}
                            onChange={(v) => setFilters(prev => ({ ...prev, author: v }))}
                        />
                        <Select
                            label="Categoría"
                            value={filters.category}
                            options={catalogOptions.categoria || []}
                            onChange={(v) => setFilters(prev => ({ ...prev, category: v }))}
                        />
                        <Select
                            label="Técnica" // Idealmente esto sería un array enorme. Usaremos input libre o select si hay pocas.
                            // Para consistencia con form, mejor select si catálogo existe, pero técnica suele ser libre.
                            // Usaremos input libre por ahora para no complicar con selects infinitos
                            value={filters.technique}
                            options={catalogOptions.tecnica || []} // Si existe en opciones
                            onChange={(v) => setFilters(prev => ({ ...prev, technique: v }))}
                            isFreeInput
                        />
                        <Select
                            label="Procedencia"
                            value={filters.provenance}
                            options={catalogOptions.procedencia || []}
                            onChange={(v) => setFilters(prev => ({ ...prev, provenance: v }))}
                        />
                        <div className="flex gap-2">
                            <Input
                                label="Año Desde"
                                value={filters.year_from}
                                placeholder="YYYY"
                                onChange={(v) => setFilters(prev => ({ ...prev, year_from: v }))}
                            />
                            <Input
                                label="Hasta"
                                value={filters.year_to}
                                placeholder="YYYY"
                                onChange={(v) => setFilters(prev => ({ ...prev, year_to: v }))}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleReset}
                            className="text-xs font-medium text-art-fg-muted hover:text-art-danger"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none"
            />
        </div>
    );
}

function Select({ label, value, options, onChange, isFreeInput }: { label: string; value: string; options: string[]; onChange: (v: string) => void; isFreeInput?: boolean }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">{label}</label>
            {isFreeInput && options.length === 0 ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none"
                />
            ) : (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-sm text-art-fg-primary focus:border-art-accent-gold focus:outline-none"
                >
                    <option value="">Todas</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
