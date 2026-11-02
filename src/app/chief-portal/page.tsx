import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import {
    getPendingChiefRequests,
    getHistoricalChiefRequests,
} from "@/modules/chief/services/chiefService";
import { ChiefPortalView } from "@/modules/chief/components/ChiefPortalView";

export const metadata = {
    title: "Portal del Jefe de Dependencia / Custodio — ArtVault",
    description: "Autorización de traslados y firma institucional de movimientos patrimoniales.",
};

export default async function ChiefPortalPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) {
        redirect("/login");
    }

    // Role-Based Access Control: Allowed for 'jefe' and 'admin' (and 'editor' during development/staging)
    const isAllowedRole =
        profile.role === "jefe" ||
        profile.role === "admin" ||
        (process.env.NODE_ENV === "development" && (profile.role === "editor" || profile.role === "visitante"));

    if (!isAllowedRole) {
        redirect("/dashboard");
    }

    const [pendingRequests, historicalRequests] = await Promise.all([
        getPendingChiefRequests(),
        getHistoricalChiefRequests(30),
    ]);

    return (
        <ChiefPortalView
            requests={pendingRequests}
            historicalRequests={historicalRequests}
            userProfile={profile}
        />
    );
}
