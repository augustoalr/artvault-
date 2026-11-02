/**
 * UserRoleManager — Client Component
 * Table of users with inline role editing.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { changeUserRoleAction } from "@/modules/admin/actions/roleActions";

interface UserRoleManagerProps {
    users: Profile[];
    currentUserId: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
    { value: "admin", label: "Admin", color: "bg-art-danger/10 text-art-danger" },
    { value: "jefe", label: "Jefe / Director", color: "bg-blue-100 text-blue-800" },
    { value: "bienes", label: "Bienes Nacionales", color: "bg-amber-100 text-amber-800" },
    { value: "editor", label: "Editor", color: "bg-art-info/10 text-art-info" },
    { value: "conservador", label: "Conservador", color: "bg-art-success/10 text-art-success" },
    { value: "seguridad", label: "Seguridad", color: "bg-purple-100 text-purple-700" },
    { value: "visitante", label: "Visitante", color: "bg-art-bg-surface text-art-fg-muted" },
];

export function UserRoleManager({ users, currentUserId }: UserRoleManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [changingId, setChangingId] = useState<string | null>(null);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setChangingId(userId);
        startTransition(async () => {
            await changeUserRoleAction(userId, newRole);
            setChangingId(null);
            router.refresh();
        });
    };

    return (
        <div className="overflow-hidden rounded-xl border border-art-border bg-art-bg-elevated shadow-[var(--art-shadow-sm)]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm" id="users-table">
                    <thead>
                        <tr className="border-b border-art-border bg-art-bg-surface">
                            <th className="px-4 py-3 text-left font-medium text-art-fg-muted">
                                Nombre
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
                        {users.map((user) => {
                            const currentRoleOption = ROLE_OPTIONS.find(
                                (r) => r.value === user.role
                            );
                            const isSelf = user.id === currentUserId;
                            const isChanging = changingId === user.id;

                            return (
                                <tr
                                    key={user.id}
                                    className="transition-colors hover:bg-art-bg-surface"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-art-bg-surface text-xs font-semibold text-art-fg-secondary">
                                                {(user.full_name ?? "U").charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-art-fg-primary">
                                                {user.full_name ?? "Sin nombre"}
                                                {isSelf && (
                                                    <span className="ml-2 text-xs text-art-fg-muted">(tú)</span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${currentRoleOption?.color}`}
                                        >
                                            {currentRoleOption?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isSelf ? (
                                            <span className="text-xs text-art-fg-muted">—</span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                disabled={isChanging || isPending}
                                                onChange={(e) =>
                                                    handleRoleChange(user.id, e.target.value as UserRole)
                                                }
                                                className="rounded-lg border border-art-border bg-art-bg-primary px-3 py-1.5 text-xs text-art-fg-primary transition-colors focus:border-art-accent-gold focus:outline-none disabled:opacity-50"
                                            >
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-art-fg-muted">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES") : "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
