/**
 * Dashboard Layout — Protected area for Admin/Editor/Conservador.
 * Server Component that validates role before rendering.
 */
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getOrganizationSettings } from "@/modules/admin/services/organizationSettingsService";
import { DashboardSidebar } from "@/modules/admin/components/DashboardSidebar";

import { MovementBasketProvider } from "@/modules/inventory/context/MovementBasketContext";
import { FloatingBasketBar } from "@/modules/inventory/components/FloatingBasketBar";

export const metadata = {
    title: "Dashboard — ArtVault",
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getCurrentUserProfile();

    if (!profile) {
        redirect("/login");
    }

    // Security officers must use the dedicated portal
    if (profile.role === "seguridad") {
        redirect("/security-portal");
    }

    // Bienes Nacionales must use their dedicated portal
    if (profile.role === "bienes") {
        redirect("/bienes-portal");
    }

    // Visitantes cannot access the dashboard
    if (profile.role === "visitante") {
        redirect("/");
    }

    const organizationSettings = await getOrganizationSettings();

    return (
        <MovementBasketProvider>
            <div className="flex min-h-screen bg-art-bg-secondary">
                {/* Sidebar */}
                <DashboardSidebar
                    userName={profile.full_name ?? "Usuario"}
                    userRole={profile.role}
                    organizationSettings={organizationSettings}
                />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
                </main>

                <FloatingBasketBar />
            </div>
        </MovementBasketProvider>
    );
}
