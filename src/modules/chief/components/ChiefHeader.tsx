"use client";

import Link from "next/link";
import { logoutAction } from "@/modules/admin/actions/authActions";

interface ChiefHeaderProps {
    userName: string;
    userRole: string;
}

export function ChiefHeader({ userName, userRole }: ChiefHeaderProps) {
    const isAdmin = userRole === "admin";

    return (
        <header className="border-b border-art-border bg-art-bg-elevated px-4 sm:px-6 py-3.5 shadow-art-sm shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                {/* Left: Navigation Back & Institutional Identity */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Back to Dashboard Button */}
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg border border-art-border bg-art-bg-primary px-3 py-1.5 text-xs font-medium text-art-fg-primary shadow-xs hover:border-art-accent-gold/60 hover:bg-art-bg-surface hover:text-art-accent-gold transition-all duration-150 group"
                        title="Regresar al Dashboard Principal"
                    >
                        <svg
                            className="h-4 w-4 text-art-fg-muted group-hover:text-art-accent-gold transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Volver al Dashboard</span>
                    </Link>

                    <div className="h-4 w-px bg-art-border hidden sm:block" />

                    {/* Branding */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-art-accent-gold text-white font-serif font-bold text-base shadow-xs">
                            AV
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="font-serif text-base sm:text-lg font-bold text-art-fg-primary tracking-wide">
                                    Portal del Jefe de Dependencia
                                </h1>
                                <span className="inline-flex items-center rounded-full bg-art-accent-gold/15 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-art-accent-gold-dark">
                                    Custodia Patrimonial
                                </span>
                            </div>
                            <p className="text-[11px] text-art-fg-muted hidden sm:block">
                                Dirección de Patrimonio Cultural · Autorización y Firma de Movimientos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Supervisor Badge & User Actions */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    {/* Admin Supervisor Mode Badge */}
                    {isAdmin && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                            </span>
                            <svg className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Modo Supervisor (Admin)
                        </span>
                    )}

                    <Link
                        href="/"
                        className="hidden md:inline-flex items-center gap-1 rounded-lg border border-art-border px-2.5 py-1.5 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary transition-colors"
                        title="Ver Galería Pública"
                    >
                        <span>Galería</span>
                    </Link>

                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-art-fg-primary leading-tight">{userName}</p>
                        <p className="text-[10px] text-art-fg-muted capitalize">{userRole}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => logoutAction()}
                        className="rounded-lg border border-art-color-danger/20 px-3 py-1.5 text-xs font-medium text-art-color-danger hover:bg-art-color-danger/10 transition-colors"
                        title="Cerrar Sesión"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>
    );
}
