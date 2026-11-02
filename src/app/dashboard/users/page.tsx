/**
 * Users Management Page — Admin only.
 * Displays user list with role management capabilities.
 */
import { redirect } from "next/navigation";
import { getCurrentUserProfile, getAllUsers } from "@/modules/admin/services/roleService";
import { UserRoleManager } from "@/modules/admin/components/UserRoleManager";

export const metadata = {
    title: "Usuarios — ArtVault",
};

export default async function UsersPage() {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "admin") {
        redirect("/dashboard");
    }

    const users = await getAllUsers();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary art-heading-accent">
                    Gestión de Usuarios
                </h1>
                <p className="mt-3 text-sm text-art-fg-muted">
                    Administra los roles y permisos de los usuarios del sistema.
                </p>
            </div>

            <UserRoleManager users={users} currentUserId={profile.id} />
        </div>
    );
}
