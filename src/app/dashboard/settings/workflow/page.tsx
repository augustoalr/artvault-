/**
 * Workflow Settings Page — Configurable Workflow Engine
 * Allows administrators to customize authorization chains and organization archetypes.
 */
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getOrganizationSettings } from "@/modules/admin/services/organizationSettingsService";
import { WorkflowSettingsView } from "@/modules/admin/components/WorkflowSettingsView";

export const metadata = {
    title: "Motor de Flujos & Organización — ArtVault",
    description: "Configuración de puertas de aprobación y reglas de trazabilidad patrimonial.",
};

export default async function WorkflowSettingsPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) {
        redirect("/login");
    }

    if (profile.role !== "admin") {
        redirect("/dashboard");
    }

    const organizationSettings = await getOrganizationSettings();

    return <WorkflowSettingsView initialSettings={organizationSettings} />;
}
