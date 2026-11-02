
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getPendingRequests, getHistoricalRequests } from "@/modules/security/services/securityService";
import { SecurityPortalView } from "@/modules/security/components/SecurityPortalView";

export const metadata = {
    title: "Portal de Seguridad — ArtVault",
};

export default async function SecurityPortalPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");

    // Only Security and Admin can access
    if (profile.role !== "seguridad" && profile.role !== "admin") {
        redirect("/");
    }

    const [pendingRequests, historicalRequests] = await Promise.all([
        getPendingRequests(),
        getHistoricalRequests(20),
    ]);

    return (
        <SecurityPortalView
            requests={pendingRequests}
            historicalRequests={historicalRequests}
            userName={profile.full_name ?? "Oficial"}
        />
    );
}
