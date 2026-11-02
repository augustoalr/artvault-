/**
 * Role Service — RBAC management (Server)
 * Provides role checking and role changing functions.
 */
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole, Profile } from "@/lib/supabase/types";

export async function getCurrentUserProfile(): Promise<Profile | null> {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return data as Profile | null;
}

export async function hasRole(requiredRoles: UserRole[]): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;
    return requiredRoles.includes(profile.role);
}

export async function getAllUsers(): Promise<Profile[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data ?? []) as Profile[];
}

export async function updateUserRole(
    userId: string,
    newRole: UserRole
): Promise<void> {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) throw new Error(`Failed to update role: ${error.message}`);
}
