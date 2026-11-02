/**
 * Settings Actions — Server Actions for app configuration.
 * Handles master password setup and verification.
 */
"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

// ─── Simple hash (using Web Crypto API available in Edge/Node) ───
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Set Master Password (Admin only) ───
export async function setMasterPasswordAction(
    password: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { success: false, error: "Solo administradores pueden configurar la contraseña maestra." };
    }

    const hashedPassword = await hashPassword(password);

    const { error } = await supabase
        .from("app_settings")
        .update({ value: hashedPassword, updated_by: user.id })
        .eq("key", "master_password");

    if (error) return { success: false, error: error.message };

    // Audit log
    await supabase.from("audit_logs").insert({
        table_name: "app_settings",
        record_id: user.id,
        action: "SET_MASTER_PASSWORD",
        changed_by: user.id,
    });

    return { success: true };
}

// ─── Verify Master Password (for delete confirmation) ───
export async function verifyMasterPasswordAction(
    password: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "master_password")
        .single();

    if (!setting?.value) {
        return { success: false, error: "No se ha configurado una contraseña maestra. Contacte al administrador." };
    }

    const hashedInput = await hashPassword(password);

    if (hashedInput !== setting.value) {
        // Log failed attempt
        await supabase.from("audit_logs").insert({
            table_name: "app_settings",
            record_id: user.id,
            action: "FAILED_MASTER_PASSWORD",
            new_data: { attempted_by: user.id } as unknown as Json,
            changed_by: user.id,
        });

        return { success: false, error: "Contraseña maestra incorrecta." };
    }

    return { success: true };
}

// ─── Delete with Master Password ───
export async function deleteWithMasterPasswordAction(
    artworkId: string,
    masterPassword: string
): Promise<{ success: boolean; error?: string }> {
    // 1. Verify password
    const verification = await verifyMasterPasswordAction(masterPassword);
    if (!verification.success) return verification;

    // 2. Perform soft-delete
    const { softDeleteArtworkAction } = await import(
        "@/modules/inventory/actions/inventoryActions"
    );

    return softDeleteArtworkAction(artworkId);
}

// ─── Update App Setting (Admin only) ───
export async function updateSettingAction(
    key: string,
    value: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado." };

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { success: false, error: "Solo administradores." };
    }

    // Don't allow setting master_password through this generic action
    if (key === "master_password") {
        return { success: false, error: "Use la función dedicada para la contraseña maestra." };
    }

    const { error } = await supabase
        .from("app_settings")
        .update({ value, updated_by: user.id })
        .eq("key", key);

    if (error) return { success: false, error: error.message };

    return { success: true };
}

// ─── Get All Settings (Non-sensitive) ───
export async function getSettingsAction(): Promise<{
    success: boolean;
    settings?: Record<string, string | null>;
    error?: string;
}> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .neq("key", "master_password");

    if (error) return { success: false, error: error.message };

    const settings: Record<string, string | null> = {};
    for (const row of data ?? []) {
        settings[row.key] = row.value;
    }

    return { success: true, settings };
}
