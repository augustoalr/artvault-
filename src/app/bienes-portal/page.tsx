import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getRequestsForBienes, getHistoricalRequests } from "@/modules/security/services/securityService";
import { BienesPortalView } from "@/modules/security/components/BienesPortalView";

export const metadata = {
    title: "Portal de Bienes Nacionales — ArtVault",
};

export default async function BienesPortalPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");

    // Only bienes role and admin can access
    if (profile.role !== "bienes" && profile.role !== "admin") {
        redirect("/");
    }

    const [pendingRequests, historicalRequests] = await Promise.all([
        getRequestsForBienes(),
        getHistoricalRequests(20),
    ]);

    return (
        <BienesPortalView
            requests={pendingRequests}
            historicalRequests={historicalRequests}
            userName={profile.full_name ?? "Jefe de Bienes"}
            userRole={profile.role}
        />
    );
}
