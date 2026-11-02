/**
 * Backup Actions — Server Actions for full metadata export/import.
 * Handles extensive read/write operations for system backup.
 */
"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyMasterPasswordAction } from "@/modules/admin/actions/settingsActions";

interface BackupData {
    timestamp: string;
    version: string;
    data: {
        artworks: any[];
        movements: any[];
        valuations: any[];
        conservation: any[];
        media_assets: any[];
        catalog_options: any[];
        app_settings: any[];
    };
}

export async function generateBackupAction(): Promise<{
    success: boolean;
    backup?: BackupData;
    error?: string;
}> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado" };

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { success: false, error: "Solo administradores pueden generar copias de seguridad." };
    }

    try {
        // Fetch all tables in parallel
        // Using limit(10000) simply for safety, assuming collection isn't massive yet.
        const [
            artworks,
            movements,
            valuations,
            conservation,
            media,
            options,
            settings
        ] = await Promise.all([
            supabase.from("artworks").select("*").limit(10000),
            supabase.from("artwork_movements").select("*").limit(10000),
            supabase.from("artwork_valuations").select("*").limit(10000),
            supabase.from("artwork_conservation").select("*").limit(10000),
            supabase.from("media_assets").select("*").limit(10000),
            supabase.from("catalog_options").select("*").limit(10000),
            supabase.from("app_settings").select("*").neq("key", "master_password"), // Don't export master password
        ]);

        if (artworks.error) throw new Error(artworks.error.message);

        const backup: BackupData = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            data: {
                artworks: artworks.data ?? [],
                movements: movements.data ?? [],
                valuations: valuations.data ?? [],
                conservation: conservation.data ?? [],
                media_assets: media.data ?? [],
                catalog_options: options.data ?? [],
                app_settings: settings.data ?? [],
            },
        };

        // Log audit
        await supabase.from("audit_logs").insert({
            table_name: "system",
            record_id: user.id, // System action associated with user
            action: "BACKUP_GENERATED",
            changed_by: user.id,
        });

        return { success: true, backup };

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Error generando backup" };
    }
}

export async function restoreBackupAction(
    backupData: BackupData,
    masterPassword: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado" };

    // 1. Verify Master Password
    const verification = await verifyMasterPasswordAction(masterPassword);
    if (!verification.success) return verification;

    // 2. Perform Restore (Upsert)
    // We use upsert to merge/overwrite existing data. 
    // Ideally we might want to clear tables first, but that's destructive. Upsert is safer for "import".
    // If strict restore is needed (exact state match), we'd need to truncate.
    // Let's do Upsert for safety.

    try {
        const { data } = backupData;

        // Restore Order matters: Independent tables first, then dependent.
        // 1. Settings & Options
        if (data.app_settings?.length) await supabase.from("app_settings").upsert(data.app_settings);
        if (data.catalog_options?.length) await supabase.from("catalog_options").upsert(data.catalog_options);

        // 2. Artworks
        if (data.artworks?.length) await supabase.from("artworks").upsert(data.artworks);

        // 3. Dependent Tables
        if (data.movements?.length) await supabase.from("artwork_movements").upsert(data.movements);
        if (data.valuations?.length) await supabase.from("artwork_valuations").upsert(data.valuations);
        if (data.conservation?.length) await supabase.from("artwork_conservation").upsert(data.conservation);
        if (data.media_assets?.length) await supabase.from("media_assets").upsert(data.media_assets);

        // Log audit
        await supabase.from("audit_logs").insert({
            table_name: "system",
            record_id: user.id, // System action associated with user
            action: "BACKUP_RESTORED",
            changed_by: user.id,
            new_data: { backup_timestamp: backupData.timestamp } as any,
        });

        return { success: true };

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Error restaurando backup" };
    }
}
