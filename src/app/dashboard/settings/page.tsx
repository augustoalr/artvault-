/**
 * Admin Settings Page — Configuration for institution branding + master password.
 * Only accessible by admin users.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { SettingsForm } from "@/modules/admin/components/SettingsForm";
import { BackupManager } from "@/modules/admin/components/BackupManager";

export const metadata = {
    title: "Configuración — ArtVault",
};

export default async function SettingsPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");
    if (profile.role !== "admin") redirect("/dashboard");

    return (
        <div>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                        Configuración General
                    </h1>
                    <p className="mt-1 text-sm text-art-fg-muted">
                        Administra la identidad institucional y la seguridad del sistema.
                    </p>
                </div>

                <Link
                    href="/dashboard/settings/workflow"
                    className="inline-flex items-center gap-2 rounded-xl border border-art-accent-gold/30 bg-art-accent-gold/10 px-4 py-2 text-sm font-medium text-art-accent-gold transition-colors hover:bg-art-accent-gold/20"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    <span>Configurar Flujos & Presets ➔</span>
                </Link>
            </div>

            <SettingsForm />

            <div className="mt-8 border-t border-art-border pt-8">
                <BackupManager />
            </div>
        </div>
    );
}
