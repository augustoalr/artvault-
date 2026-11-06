/**
 * UserRoleManager — Client Component
 * Table of users with inline role editing, confirmation, and user creation.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { changeUserRoleAction } from "@/modules/admin/actions/roleActions";
import { CreateUserModal } from "@/modules/admin/components/CreateUserModal";

interface UserRoleManagerProps {
    users: Profile[];
    currentUserId: string;
}

interface RoleOption {
    value: UserRole;
    label: string;
    badgeStyle: string;
    description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: "admin",
        label: "Administrador",
        badgeStyle: "bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800",
        description: "Control absoluto",
    },
    {
        value: "jefe",
        label: "Jefe / Director",
        badgeStyle: "bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800",
        description: "Aval y firma institucional",
    },
    {
        value: "bienes",
        label: "Bienes Nacionales",
        badgeStyle: "bg-amber-500/10 text-amber-700 border border-amber-200 dark:border-amber-800",
        description: "Control patrimonial",
    },
    {
        value: "conservador",
        label: "Conservador",
        badgeStyle: "bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:border-emerald-800",
        description: "Diagnósticos e intervención",
    },
    {
        value: "seguridad",
        label: "Seguridad",
        badgeStyle: "bg-purple-500/10 text-purple-700 border border-purple-200 dark:border-purple-800",
        description: "Verificación y actas de garita",
    },
    {
        value: "editor",
        label: "Editor",
        badgeStyle: "bg-sky-500/10 text-sky-700 border border-sky-200 dark:border-sky-800",
        description: "Registro de obras y metadatos",
    },
    {
        value: "visitante",
        label: "Visitante",
        badgeStyle: "bg-zinc-500/10 text-zinc-600 border border-zinc-200 dark:border-zinc-700",
        description: "Solo consulta pública",
    },
];

export function UserRoleManager({ users, currentUserId }: UserRoleManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [changingId, setChangingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification((prev) => (prev?.message === message ? null : prev));
        }, 4000);
    };

    const handleRoleChange = (userId: string, newRole: UserRole, userName: string) => {
        const roleLabel = ROLE_OPTIONS.find((r) => r.value === newRole)?.label || newRole;
        const confirmChange = window.confirm(
            `¿Confirmas el cambio de rol para "${userName}" a ${roleLabel}?`
        );

        if (!confirmChange) return;

        setChangingId(userId);
        startTransition(async () => {
            const result = await changeUserRoleAction(userId, newRole);
            setChangingId(null);

            if (result.success) {
                showNotification("success", `Rol de "${userName}" actualizado a ${roleLabel}.`);
                router.refresh();
            } else {
                showNotification("error", result.error || "No se pudo actualizar el rol del usuario.");
            }
        });
    };

    const filteredUsers = users.filter((u) => {
        const matchesName = (u.full_name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
        return matchesName && matchesRole;
    });

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-art-bg-elevated p-4 rounded-xl border border-art-border shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-art-fg-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full rounded-lg border border-art-border bg-art-bg-primary pl-9 pr-3 py-2 text-xs text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold transition-colors"
                        />
                    </div>

                    {/* Filter by role */}
                    <select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold transition-colors"
                    >
                        <option value="all">Todos los roles ({users.length})</option>
                        {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Primary Button: Nuevo Usuario */}
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    id="btn-new-user"
                    className="flex items-center justify-center gap-2 rounded-lg bg-art-accent-gold px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 transition-all cursor-pointer shrink-0"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Notification Banner */}
            {notification && (
                <div
                    className={`flex items-center justify-between rounded-lg p-3 text-xs border transition-all ${
                        notification.type === "success"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notification.type === "success" ? (
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                            </svg>
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-art-border bg-art-bg-elevated shadow-[var(--art-shadow-sm)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" id="users-table">
                        <thead>
                            <tr className="border-b border-art-border bg-art-bg-surface">
                                <th className="px-4 py-3 text-left font-medium text-art-fg-muted">
                                    Colaborador
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-art-fg-muted">
                                    Rol Actual
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-art-fg-muted">
                                    Cambiar Rol
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-art-fg-muted">
                                    Registrado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-art-border-subtle">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-xs text-art-fg-muted">
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const currentRoleOption = ROLE_OPTIONS.find(
                                        (r) => r.value === user.role
                                    ) || ROLE_OPTIONS[6];
                                    const isSelf = user.id === currentUserId;
                                    const isChanging = changingId === user.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-art-bg-surface/50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-art-accent-gold/15 text-xs font-bold text-art-accent-gold border border-art-accent-gold/20">
                                                        {(user.full_name ?? "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-art-fg-primary text-xs sm:text-sm">
                                                                {user.full_name ?? "Sin nombre"}
                                                            </span>
                                                            {isSelf && (
                                                                <span className="rounded bg-art-accent-gold/10 px-1.5 py-0.5 text-[10px] font-semibold text-art-accent-gold">
                                                                    Tú
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-mono text-art-fg-muted block truncate max-w-[180px] sm:max-w-none">
                                                            ID: {user.id.slice(0, 8)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${currentRoleOption.badgeStyle}`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {currentRoleOption.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isSelf ? (
                                                    <span className="text-xs text-art-fg-muted italic">
                                                        (Protegido)
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={user.role}
                                                            disabled={isChanging || isPending}
                                                            onChange={(e) =>
                                                                handleRoleChange(
                                                                    user.id,
                                                                    e.target.value as UserRole,
                                                                    user.full_name ?? "Usuario"
                                                                )
                                                            }
                                                            className="rounded-lg border border-art-border bg-art-bg-primary px-3 py-1.5 text-xs text-art-fg-primary transition-colors focus:border-art-accent-gold focus:outline-none disabled:opacity-50"
                                                        >
                                                            {ROLE_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isChanging && (
                                                            <svg className="h-4 w-4 animate-spin text-art-accent-gold" viewBox="0 0 24 24" fill="none">
                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                                                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-art-fg-muted font-mono">
                                                {user.created_at
                                                    ? new Date(user.created_at).toLocaleDateString("es-ES", {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserCreated={() => {
                    router.refresh();
                }}
            />
        </div>
    );
}
