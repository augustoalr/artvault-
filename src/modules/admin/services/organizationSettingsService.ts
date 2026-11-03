/**
 * Organization Settings Service — Manages organization profile and workflow configuration.
 * Provides fallback to safe institutional defaults if database entries are missing.
 */
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OrganizationSettings, Json } from "@/lib/supabase/types";
import {
    SETTINGS_KEY,
    DEFAULT_ORGANIZATION_SETTINGS,
} from "@/modules/admin/constants/organizationSettings";

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * Fetches the current organization settings.
 * Returns safe institutional defaults if table, key or records do not exist.
 */
export async function getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", SETTINGS_KEY)
            .maybeSingle();

        if (error || !data?.value) {
            return DEFAULT_ORGANIZATION_SETTINGS;
        }

        const parsed = JSON.parse(data.value);
        return {
            ...DEFAULT_ORGANIZATION_SETTINGS,
            ...parsed,
        };
    } catch (err) {
        console.warn("Could not load organization settings, falling back to defaults:", err);
        return DEFAULT_ORGANIZATION_SETTINGS;
    }
}

/**
 * Updates organization settings partially or fully.
 */
export async function updateOrganizationSettings(
    settings: Partial<OrganizationSettings>
): Promise<ActionResult<OrganizationSettings>> {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "No autenticado." };
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role !== "admin") {
            return {
                success: false,
                error: "Solo administradores pueden modificar las configuraciones de la organización.",
            };
        }

        // Get existing settings to merge
        const currentSettings = await getOrganizationSettings();
        const updatedSettings: OrganizationSettings = {
            ...currentSettings,
            ...settings,
        };

        const serialized = JSON.stringify(updatedSettings);

        // Check if row exists in app_settings
        const { data: existingRow } = await supabase
            .from("app_settings")
            .select("id")
            .eq("key", SETTINGS_KEY)
            .maybeSingle();

        if (existingRow) {
            const { error: updateError } = await supabase
                .from("app_settings")
                .update({
                    value: serialized,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                })
                .eq("key", SETTINGS_KEY);

            if (updateError) {
                return { success: false, error: updateError.message };
            }
        } else {
            const { error: insertError } = await supabase
                .from("app_settings")
                .insert({
                    key: SETTINGS_KEY,
                    value: serialized,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                });

            if (insertError) {
                return { success: false, error: insertError.message };
            }
        }

        // Register Audit Log
        try {
            await supabase.from("audit_logs").insert({
                table_name: "app_settings",
                record_id: SETTINGS_KEY,
                action: "UPDATE_ORGANIZATION_SETTINGS",
                new_data: updatedSettings as unknown as Json,
                changed_by: user.id,
            });
        } catch (auditErr) {
            console.warn("Failed to write audit log for organization settings:", auditErr);
        }

        // Revalidate portals and admin views
        revalidatePath("/admin");
        revalidatePath("/dashboard");
        revalidatePath("/chief-portal");
        revalidatePath("/bienes-portal");
        revalidatePath("/security-portal");

        return { success: true, data: updatedSettings };
    } catch (err: unknown) {
        console.error("Error updating organization settings:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: message };
    }
}
