/**
 * Role Service — RBAC management (Server)
 * Provides role checking, role changing, and user creation functions.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole, Profile, Database } from "@/lib/supabase/types";

export interface CreateUserParams {
    email: string;
    fullName: string;
    role: UserRole;
    temporaryPassword?: string;
}

export interface CreateUserResult {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        email: string;
        fullName: string;
        role: UserRole;
        temporaryPassword?: string;
    };
}

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

/**
 * Server Action: createUserAction
 * Creates a new user in Supabase Auth and sets their full_name and role in profiles.
 * Accessible only by administrators.
 */
export async function createUserAction(
    params: CreateUserParams
): Promise<CreateUserResult> {
    const { email, fullName, role, temporaryPassword } = params;

    if (!email || !email.includes("@")) {
        return { success: false, error: "Correo electrónico inválido." };
    }
    if (!fullName || fullName.trim().length === 0) {
        return { success: false, error: "El nombre completo es requerido." };
    }

    const effectivePassword = temporaryPassword?.trim() || "ArtVault2026!";
    if (effectivePassword.length < 6) {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const currentSupabase = await getSupabaseServerClient();
    const {
        data: { user: currentUser },
    } = await currentSupabase.auth.getUser();

    if (!currentUser) {
        return { success: false, error: "No autenticado. Inicie sesión para continuar." };
    }

    const { data: callerProfile } = await currentSupabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (!callerProfile || callerProfile.role !== "admin") {
        return { success: false, error: "No autorizado. Solo los administradores pueden crear usuarios." };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { success: false, error: "Configuración del servidor incompleta (URL faltante)." };
    }

    let createdUserId: string | null = null;

    if (serviceRoleKey) {
        // Admin API path with auto-confirm
        const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data: adminData, error: adminError } = await adminSupabase.auth.admin.createUser({
            email,
            password: effectivePassword,
            email_confirm: true,
            user_metadata: {
                full_name: fullName.trim(),
            },
        });

        if (adminError) {
            return { success: false, error: adminError.message };
        }

        createdUserId = adminData.user.id;
    } else {
        // Standalone anon client to avoid overriding current admin's session cookie
        if (!anonKey) {
            return { success: false, error: "Clave de acceso Supabase no configurada." };
        }

        const registrationClient = createClient<Database>(supabaseUrl, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        const { data: signUpData, error: signUpError } = await registrationClient.auth.signUp({
            email,
            password: effectivePassword,
            options: {
                data: {
                    full_name: fullName.trim(),
                },
            },
        });

        if (signUpError) {
            return { success: false, error: signUpError.message };
        }

        createdUserId = signUpData.user?.id ?? null;
    }

    if (!createdUserId) {
        return { success: false, error: "No se pudo obtener el identificador del usuario creado." };
    }

    // Upsert or update profile to ensure role and name are explicitly set
    const { error: profileError } = await currentSupabase
        .from("profiles")
        .upsert({
            id: createdUserId,
            full_name: fullName.trim(),
            role,
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        // If upsert failed due to auth reference timing, try update
        const { error: updateError } = await currentSupabase
            .from("profiles")
            .update({
                full_name: fullName.trim(),
                role,
            })
            .eq("id", createdUserId);

        if (updateError) {
            return {
                success: false,
                error: `Usuario creado en Auth, pero ocurrió un error asignando el rol: ${updateError.message}`,
            };
        }
    }

    // Register audit log
    await currentSupabase.from("audit_logs").insert({
        table_name: "profiles",
        record_id: createdUserId,
        action: "CREATE_USER",
        new_data: {
            email,
            full_name: fullName.trim(),
            role,
        },
        changed_by: currentUser.id,
    });

    revalidatePath("/dashboard/users");

    return {
        success: true,
        user: {
            id: createdUserId,
            email,
            fullName: fullName.trim(),
            role,
            temporaryPassword: effectivePassword,
        },
    };
}
