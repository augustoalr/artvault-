/**
 * DashboardSidebar — Client Component
 * Navigation sidebar for the admin area with adaptive workflow awareness.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/modules/admin/actions/authActions";
import type { UserRole, OrganizationSettings } from "@/lib/supabase/types";
import { DEFAULT_ORGANIZATION_SETTINGS } from "@/modules/admin/constants/organizationSettings";

interface SidebarProps {
    userName: string;
    userRole: UserRole;
    organizationSettings?: OrganizationSettings;
}

interface NavItemConfig {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
    exactMatch?: boolean;
    isPortal?: boolean;
    isActiveInWorkflow?: (settings: OrganizationSettings) => boolean;
}

const MANAGEMENT_ITEMS: NavItemConfig[] = [
    {
        href: "/dashboard",
        label: "Resumen",
        exactMatch: true,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
        roles: ["admin", "editor", "conservador"],
    },
    {
        href: "/dashboard/artworks",
        label: "Obras",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
        ),
        roles: ["admin", "editor"],
    },
    {
        href: "/dashboard/users",
        label: "Usuarios",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
        roles: ["admin"],
    },
    {
        href: "/dashboard/activity",
        label: "Actividad",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        roles: ["admin"],
    },
];

const PORTAL_ITEMS: NavItemConfig[] = [
    {
        href: "/bienes-portal",
        label: "Bienes Nacionales",
        isPortal: true,
        isActiveInWorkflow: (s) => s.require_bienes_approval,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M3 21h18M6 10.5h12" />
            </svg>
        ),
        roles: ["admin", "bienes"],
    },
    {
        href: "/chief-portal",
        label: "Portal del Jefe",
        isPortal: true,
        isActiveInWorkflow: (s) => s.require_chief_approval,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        ),
        roles: ["admin", "jefe"],
    },
    {
        href: "/security-portal",
        label: "Portal Seguridad",
        isPortal: true,
        isActiveInWorkflow: (s) => s.require_security_checkpoint,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        roles: ["admin", "seguridad"],
    },
];

const SETTINGS_ITEMS: NavItemConfig[] = [
    {
        href: "/dashboard/settings/workflow",
        label: "Flujo & Organización",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        ),
        roles: ["admin"],
    },
    {
        href: "/dashboard/settings/catalog",
        label: "Gestión de Catálogo",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3h-2.153a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 .75-.75h2.153a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75Zm-5.568 0H1.847a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 .75-.75h2.153a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75Zm11.136 0h-2.153a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 .75-.75h2.153a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75Zm-5.568 0H7.414a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 .75-.75h2.153a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75ZM20.706 3h-2.153a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 .75-.75h2.153a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75ZM3 9h18v10.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5V9Zm-1.5-3.75A.75.75 0 0 1 2.25 4.5h19.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75H1.5a.75.75 0 0 1-.75-.75v-.75Z" />
            </svg>
        ),
        roles: ["admin", "editor"],
    },
    {
        href: "/dashboard/settings",
        label: "Configuración General",
        exactMatch: true,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        roles: ["admin"],
    },
];

const ROLE_LABELS: Record<UserRole, string> = {
    admin: "Administrador",
    editor: "Editor",
    conservador: "Conservador",
    visitante: "Visitante",
    seguridad: "Seguridad",
    bienes: "Bienes Nacionales",
    jefe: "Jefe de Dependencia",
};

export function DashboardSidebar({
    userName,
    userRole,
    organizationSettings = DEFAULT_ORGANIZATION_SETTINGS,
}: SidebarProps) {
    const pathname = usePathname();

    const visibleManagement = MANAGEMENT_ITEMS.filter((item) =>
        item.roles.includes(userRole)
    );

    const visiblePortals = PORTAL_ITEMS.filter((item) =>
        item.roles.includes(userRole)
    );

    const visibleSettings = SETTINGS_ITEMS.filter((item) =>
        item.roles.includes(userRole)
    );

    const renderLink = (item: NavItemConfig) => {
        const isActive = item.exactMatch
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

        const isPortalActiveInFlow = item.isActiveInWorkflow
            ? item.isActiveInWorkflow(organizationSettings)
            : true;

        const isDeactivatedPortalForAdmin =
            userRole === "admin" && item.isPortal && !isPortalActiveInFlow;

        return (
            <li key={item.href}>
                <Link
                    href={item.href}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                            ? "bg-art-accent-gold/10 text-art-accent-gold"
                            : isDeactivatedPortalForAdmin
                            ? "text-art-fg-muted hover:bg-art-bg-surface hover:text-art-fg-secondary"
                            : "text-art-fg-secondary hover:bg-art-bg-surface hover:text-art-fg-primary"
                    }`}
                >
                    <div className="flex items-center gap-3 truncate">
                        <span className={isActive ? "text-art-accent-gold" : "text-art-fg-muted group-hover:text-art-fg-primary"}>
                            {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                    </div>

                    {/* Adaptive Badge for Admins */}
                    {isDeactivatedPortalForAdmin && (
                        <span
                            title="Paso desactivado en la configuración actual de flujos"
                            className="ml-2 shrink-0 rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                        >
                            Inactivo
                        </span>
                    )}
                </Link>
            </li>
        );
    };

    return (
        <aside className="flex w-64 flex-col border-r border-art-border bg-art-bg-elevated" id="dashboard-sidebar">
            {/* Branding */}
            <div className="flex items-center gap-3 border-b border-art-border px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-art-accent-gold shadow-sm">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-sm font-bold text-art-fg-primary">
                        {organizationSettings.organization_name || "ArtVault"}
                    </p>
                    <p className="text-xs text-art-fg-muted">Dashboard</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                {/* Management Section */}
                {visibleManagement.length > 0 && (
                    <div>
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-art-fg-muted">
                            Gestión
                        </p>
                        <ul className="mt-1 space-y-1">
                            {visibleManagement.map(renderLink)}
                        </ul>
                    </div>
                )}

                {/* Portals Section (Adaptive) */}
                {visiblePortals.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-art-fg-muted">
                                Portales de Control
                            </p>
                            {userRole === "admin" && (
                                <span className="text-[10px] text-art-accent-gold" title="Visibilidad adaptativa según reglas del motor de flujo">
                                    Adaptable
                                </span>
                            )}
                        </div>
                        <ul className="mt-1 space-y-1">
                            {visiblePortals.map(renderLink)}
                        </ul>
                    </div>
                )}

                {/* Settings Section */}
                {visibleSettings.length > 0 && (
                    <div>
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-art-fg-muted">
                            Configuración
                        </p>
                        <ul className="mt-1 space-y-1">
                            {visibleSettings.map(renderLink)}
                        </ul>
                    </div>
                )}
            </nav>

            {/* Catalog Link */}
            <div className="border-t border-art-border/50 px-3 py-2">
                <a
                    href="/"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-art-fg-muted transition-colors hover:bg-art-bg-surface hover:text-art-fg-primary"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Ver Catálogo Público
                </a>
            </div>

            {/* User Info & Logout */}
            <div className="border-t border-art-border px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-art-bg-surface text-sm font-semibold text-art-fg-secondary">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-art-fg-primary">
                            {userName}
                        </p>
                        <p className="truncate text-xs text-art-accent-gold">
                            {ROLE_LABELS[userRole]}
                        </p>
                    </div>
                </div>
                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="w-full rounded-lg border border-art-border px-3 py-2 text-sm text-art-fg-muted transition-colors hover:border-art-danger hover:text-art-danger"
                        id="logout-button"
                    >
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    );
}
