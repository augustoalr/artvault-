"use client";

import { useState, useEffect } from "react";
import {
    getCatalogOptionsAction,
    addCatalogOptionAction,
    renameCatalogOptionAction,
    deleteCatalogOptionAction,
    type CatalogCategory,
    type CatalogOption
} from "@/modules/admin/actions/catalogManagerActions";

const TABS: { id: CatalogCategory; label: string }[] = [
    { id: "technique", label: "Técnicas" },
    { id: "category", label: "Categorías" },
    { id: "provenance", label: "Procedencia" },
    { id: "investigador", label: "Investigadores" },
    { id: "location", label: "Ubicaciones" },
];

export function CatalogManager() {
    const [activeTab, setActiveTab] = useState<CatalogCategory>("technique");
    const [options, setOptions] = useState<CatalogOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState("");
    const [editingItem, setEditingItem] = useState<CatalogOption | null>(null);
    const [editValue, setEditValue] = useState("");

    // Load data when tab changes
    useEffect(() => {
        loadOptions();
    }, [activeTab]);

    async function loadOptions() {
        setIsLoading(true);
        try {
            const data = await getCatalogOptionsAction(activeTab);
            setOptions(data);
        } catch (error) {
            console.error(error);
            alert("Error al cargar opciones");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            const res = await addCatalogOptionAction(activeTab, newItem.trim());
            if (res.message) alert(res.message);
            setNewItem("");
            loadOptions();
        } catch (error) {
            alert("Error al crear");
        }
    }

    async function handleRename() {
        if (!editingItem || !editValue.trim() || editingItem.value === editValue) return;

        if (!confirm(`¿Estás seguro? Esto cambiará "${editingItem.value}" por "${editValue}" en TODAS las obras y registros asociados.`)) {
            return;
        }

        try {
            const res = await renameCatalogOptionAction(activeTab, editingItem.value, editValue);
            if (res.success) {
                setEditingItem(null);
                loadOptions();
                alert(res.message);
            } else {
                alert("Error: " + res.error);
            }
        } catch (error) {
            alert("Error al renombrar");
        }
    }

    async function handleDelete(value: string) {
        if (!confirm(`¿Eliminar "${value}" de la lista disponible? Obras existentes mantendrán este valor.`)) return;

        try {
            const res = await deleteCatalogOptionAction(activeTab, value);
            if (res.success) {
                loadOptions();
            } else {
                alert(res.error);
            }
        } catch (error) {
            alert("Error al eliminar");
        }
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-art-border">
                <nav className="-mb-px flex space-x-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                ${activeTab === tab.id
                                    ? "border-art-accent-gold text-art-accent-gold"
                                    : "border-transparent text-art-fg-secondary hover:border-art-border-strong hover:text-art-fg-primary"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-xl border border-art-border bg-art-bg-elevated overflow-hidden">
                        <table className="min-w-full divide-y divide-art-border/50">
                            <thead className="bg-art-bg-surface">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-art-fg-muted">Nombre</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-art-fg-muted">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-art-border/50 bg-transparent">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-art-fg-muted">
                                            Cargando...
                                        </td>
                                    </tr>
                                ) : options.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-art-fg-muted">
                                            No hay opciones registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    options.map((opt, idx) => (
                                        <tr key={idx} className="group hover:bg-art-bg-surface transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-art-fg-primary">
                                                {editingItem?.value === opt.value ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="w-full rounded border border-art-accent-gold px-2 py-1 text-sm focus:outline-none"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    opt.value
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                {editingItem?.value === opt.value ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={handleRename}
                                                            className="text-art-success hover:underline"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingItem(null)}
                                                            className="text-art-fg-muted hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(opt);
                                                                setEditValue(opt.value);
                                                            }}
                                                            className="text-art-accent-gold hover:text-art-accent-gold-dark"
                                                        >
                                                            Editar / Corregir
                                                        </button>
                                                        {activeTab !== 'location' && (
                                                            <button
                                                                onClick={() => handleDelete(opt.value)}
                                                                className="text-art-danger hover:text-red-700"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add New (Sidebar) */}
                {activeTab !== 'location' && (
                    <div className="md:col-span-1">
                        <div className="sticky top-6 rounded-xl border border-art-border bg-art-bg-surface p-6">
                            <h3 className="text-lg font-serif font-medium text-art-fg-primary mb-4">
                                Agregar {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
                            </h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-art-fg-secondary mb-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        className="w-full rounded-lg border border-art-border bg-white px-3 py-2 text-sm focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold"
                                        placeholder="Ej: Oleo sobre lienzo"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newItem.trim()}
                                    className="w-full rounded-lg bg-art-fg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                                >
                                    Agregar a la lista
                                </button>
                            </form>
                            <div className="mt-6 rounded-lg bg-art-bg-secondary p-4 text-xs text-art-fg-muted">
                                <p>
                                    <strong>Nota:</strong> Los elementos que agregues aquí aparecerán disponibles en las listas desplegables al crear o editar obras.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'location' && (
                    <div className="md:col-span-1">
                        <div className="sticky top-6 rounded-xl border border-art-border bg-art-bg-secondary/30 p-6">
                            <h3 className="text-sm font-bold text-art-fg-primary mb-2">
                                Sobre las Ubicaciones
                            </h3>
                            <p className="text-sm text-art-fg-secondary mb-4">
                                Las ubicaciones se crean automáticamente cuando registras un movimiento o asignas una ubicación a una obra.
                            </p>
                            <p className="text-sm text-art-fg-secondary">
                                Utiliza la opción <strong>"Editar / Corregir"</strong> en la lista para arreglar errores ortográficos o estandarizar nombres (ej: cambiar "Sala1" por "Sala 1").
                            </p>
                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded border border-yellow-200 dark:border-yellow-800/50">
                                ⚠ Al renombrar una ubicación, se actualizarán todas las obras y su historial de movimientos.
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
