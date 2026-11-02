"use client";

import Link from "next/link";
import { logoutAction } from "@/modules/admin/actions/authActions";

interface ChiefHeaderProps {
    userName: string;
    userRole: string;
}

export function ChiefHeader({ userName, userRole }: ChiefHeaderProps) {
    return (
        <header className="border-b border-art-border bg-art-bg-elevated px-6 py-4 shadow-art-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Branding & Title */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-art-accent-gold text-white font-serif font-bold text-lg shadow-sm">
                        AV
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-serif text-lg font-bold text-art-fg-primary tracking-wide">
                                Portal del Jefe de Dependencia
                            </h1>
                            <span className="inline-flex items-center rounded-full bg-art-accent-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-art-accent-gold-dark">
                                Custodia Patrimonial
                            </span>
                        </div>
                        <p className="text-xs text-art-fg-muted">
                            Dirección de Patrimonio Cultural · Autorización y Firma de Movimientos
                        </p>
                    </div>
                </div>

                {/* User actions */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-art-fg-primary">{userName}</p>
                        <p className="text-[11px] text-art-fg-muted capitalize">{userRole}</p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="rounded-lg border border-art-border px-3 py-1.5 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary transition-colors"
                    >
                        Panel Principal
                    </Link>

                    <button
                        type="button"
                        onClick={() => logoutAction()}
                        className="rounded-lg border border-art-color-danger/20 px-3 py-1.5 text-xs font-medium text-art-color-danger hover:bg-art-color-danger/10 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>
    );
}
