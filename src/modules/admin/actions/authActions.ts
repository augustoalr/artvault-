/**
 * Auth Actions — Server Actions for login/signup/logout.
 * Follows Early Return pattern for error handling.
 */
"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface AuthResult {
    error?: string;
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son requeridos." };
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: error.message };
    }

    redirect("/dashboard");
}

export async function signupAction(formData: FormData): Promise<AuthResult> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son requeridos." };
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    });

    if (error) {
        return { error: error.message };
    }

    return {};
}

export async function logoutAction(): Promise<void> {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/");
}
