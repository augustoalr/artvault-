/**
 * CreateUserModal — Client Component
 * Interactive modal to create new users with immediate role assignment.
 */
"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/supabase/types";
import { createUserAction } from "@/modules/admin/services/roleService";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

interface RoleMetadata {
    value: UserRole;
    label: string;
    badgeColor: string;
    description: string;
}

const ROLES_CATALOG: RoleMetadata[] = [
    {
        value: "admin",
        label: "Administrador",
        badgeColor: "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
        description: "Acceso total a la configuración del sistema, catálogo, trazabilidad y gestión de usuarios.",
    },
    {
        value: "jefe",
        label: "Jefe / Director",
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
        description: "Aprobación institucional de movimientos, aval de traslados y firma digital/token de órdenes.",
    },
    {
        value: "bienes",
        label: "Bienes Nacionales",
        badgeColor: "bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
        description: "Control patrimonial, validación de inventario institucional y aprobación preliminar de salidas.",
    },
    {
        value: "conservador",
        label: "Conservador",
        badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
        description: "Diagnósticos de estado, fichas técnicas de conservación e informes de intervención física.",
    },
    {
        value: "seguridad",
        label: "Oficial de Seguridad",
        badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
        description: "Control de acceso en garita, verificación física de obras, validación de precintos y emisión de actas.",
    },
    {
        value: "editor",
        label: "Editor de Catálogo",
        badgeColor: "bg-sky-500/10 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
        description: "Registro de obras de arte, carga fotográfica y actualización de metadatos del acervo.",
    },
    {
        value: "visitante",
        label: "Visitante / Consulta",
        badgeColor: "bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
        description: "Acceso de solo lectura a obras públicas autorizadas en el catálogo general.",
    },
];

export function CreateUserModal({
    isOpen,
    onClose,
    onUserCreated,
}: CreateUserModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>("editor");
    const [password, setPassword] = useState("ArtVault2026!");
    const [error, setError] = useState<string | null>(null);
    const [createdCredentials, setCreatedCredentials] = useState<{
        email: string;
        password: string;
        role: UserRole;
        fullName: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const generateRandomPassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
        let generated = "AV-";
        for (let i = 0; i < 9; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(generated);
    };

    const handleCopy = async () => {
        if (!createdCredentials) return;
        const text = `Credenciales de acceso a ArtVault:\nUsuario / Correo: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.password}\nRol asignado: ${createdCredentials.role}\nNombre: ${createdCredentials.fullName}\nEnlace: ${window.location.origin}/login`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // Fallback
        }
    };

    const handleResetAndClose = () => {
        setFullName("");
        setEmail("");
        setRole("editor");
        setPassword("ArtVault2026!");
        setError(null);
        setCreatedCredentials(null);
        setCopied(false);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await createUserAction({
                email,
                fullName,
                role,
                temporaryPassword: password,
            });

            if (!result.success) {
                setError(result.error ?? "Ocurrió un error inesperado al crear el usuario.");
            } else {
                setCreatedCredentials({
                    email,
                    password: result.user?.temporaryPassword || password,
                    role,
                    fullName,
                });
                onUserCreated();
            }
        });
    };

    const selectedRoleMeta = ROLES_CATALOG.find((r) => r.value === role) || ROLES_CATALOG[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleResetAndClose}
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-art-border bg-art-bg-elevated p-6 shadow-2xl transition-all sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-art-border">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-art-accent-gold/15 text-art-accent-gold">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-art-fg-primary">
                                Añadir Nuevo Usuario
                            </h2>
                            <p className="text-xs text-art-fg-muted mt-0.5">
                                Registra un colaborador y asigna sus credenciales de acceso inicial.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleResetAndClose}
                        type="button"
                        className="rounded-lg p-1.5 text-art-fg-muted hover:bg-art-bg-surface hover:text-art-fg-primary transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Success View with Credentials */}
                {createdCredentials ? (
                    <div className="mt-6 space-y-5">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                        ¡Usuario creado exitosamente!
                                    </h3>
                                    <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                                        Copia las credenciales a continuación y compártelas con el nuevo usuario de forma segura.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 rounded-lg bg-art-bg-primary p-4 border border-art-border text-xs font-mono">
                                <div className="flex justify-between items-center py-1 border-b border-art-border/50">
                                    <span className="text-art-fg-muted font-sans font-medium">Nombre:</span>
                                    <span className="text-art-fg-primary font-semibold">{createdCredentials.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-art-border/50">
                                    <span className="text-art-fg-muted font-sans font-medium">Correo Electrónico:</span>
                                    <span className="text-art-fg-primary select-all">{createdCredentials.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-art-border/50">
                                    <span className="text-art-fg-muted font-sans font-medium">Contraseña Temporal:</span>
                                    <span className="text-art-accent-gold font-bold select-all bg-art-accent-gold/10 px-2 py-0.5 rounded">
                                        {createdCredentials.password}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-art-fg-muted font-sans font-medium">Rol Asignado:</span>
                                    <span className="text-art-fg-primary font-sans font-medium uppercase tracking-wider text-[11px]">
                                        {createdCredentials.role}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-art-fg-primary px-4 py-2.5 text-xs font-medium text-art-fg-inverse hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    {copied ? (
                                        <>
                                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>¡Copiado al Portapapeles!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                            </svg>
                                            <span>Copiar Credenciales Completas</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetAndClose}
                                    className="rounded-lg border border-art-border bg-art-bg-surface px-4 py-2.5 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-primary transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* User Creation Form */
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Nombre Completo <span className="text-art-danger">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ej. Dra. Elena Rostova"
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3.5 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-art-fg-secondary">
                                Correo Electrónico <span className="text-art-danger">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="elena.rostova@museo.gob.ve"
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3.5 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold"
                            />
                        </div>

                        {/* Role Selector with Rich Visual Badges */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-art-fg-secondary">
                                    Rol en el Sistema <span className="text-art-danger">*</span>
                                </label>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${selectedRoleMeta.badgeColor}`}>
                                    {selectedRoleMeta.label}
                                </span>
                            </div>

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3.5 py-2.5 text-sm text-art-fg-primary transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold"
                            >
                                {ROLES_CATALOG.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label} — {item.description.slice(0, 45)}...
                                    </option>
                                ))}
                            </select>

                            {/* Role description banner */}
                            <div className="mt-1.5 rounded-lg border border-art-border/60 bg-art-bg-surface/50 p-2.5 text-xs text-art-fg-secondary">
                                <span className="font-semibold text-art-fg-primary">{selectedRoleMeta.label}:</span>{" "}
                                {selectedRoleMeta.description}
                            </div>
                        </div>

                        {/* Temporary Password with Generator */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-art-fg-secondary">
                                    Contraseña Temporal <span className="text-art-danger">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generateRandomPassword}
                                    className="flex items-center gap-1 text-[11px] font-medium text-art-accent-gold hover:text-art-accent-gold-dark transition-colors"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Generar aleatoria
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="ArtVault2026!"
                                    className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3.5 py-2.5 font-mono text-sm text-art-fg-primary transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-1 focus:ring-art-accent-gold"
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-art-fg-muted">
                                El usuario podrá cambiar su contraseña tras su primer inicio de sesión.
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-art-border">
                            <button
                                type="button"
                                onClick={handleResetAndClose}
                                disabled={isPending}
                                className="rounded-lg border border-art-border bg-art-bg-surface px-4 py-2.5 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-primary transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex items-center gap-2 rounded-lg bg-art-accent-gold px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Creando usuario...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Crear Usuario</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
