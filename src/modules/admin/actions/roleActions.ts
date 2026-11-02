/**
 * Role Actions — Server Actions for admin role changes.
 */
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export async function changeUserRoleAction(
    userId: string,
    newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();

    // Verify caller is admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    const { data: callerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!callerProfile || callerProfile.role !== "admin") {
        return { success: false, error: "No autorizado." };
    }

    // Prevent self-role change
    if (userId === user.id) {
        return { success: false, error: "No puedes cambiar tu propio rol." };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Audit
    await supabase.from("audit_logs").insert({
        table_name: "profiles",
        record_id: userId,
        action: "ROLE_CHANGE",
        new_data: { role: newRole },
        changed_by: user.id,
    });

    revalidatePath("/dashboard/users");
    return { success: true };
}
