/**
 * Admin Settings Page — Configuration for institution branding + master password.
 * Only accessible by admin users.
 */
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { SettingsForm } from "@/modules/admin/components/SettingsForm";

export const metadata = {
    title: "Configuración — ArtVault",
};

export default async function SettingsPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");
    if (profile.role !== "admin") redirect("/dashboard");

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                    Configuración
                </h1>
                <p className="mt-1 text-sm text-art-fg-muted">
                    Administra la identidad institucional y la seguridad del sistema.
                </p>
            </div>

            <SettingsForm />

            <div className="mt-8 border-t border-art-border pt-8">
                <BackupManager />
            </div>
        </div>
    );
}

import { BackupManager } from "@/modules/admin/components/BackupManager";
