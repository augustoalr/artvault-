/**
 * Activity Page — Visual audit trail for admins.
 * Shows recent changes with user names, actions, and expandable diffs.
 */
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { ActivityTimeline } from "@/modules/admin/components/ActivityTimeline";

export const metadata = {
    title: "Actividad Reciente — ArtVault",
};

export default async function ActivityPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");
    if (profile.role !== "admin") redirect("/dashboard");

    const supabase = await getSupabaseServerClient();

    // Fetch audit logs with user names
    const { data: logs } = await supabase
        .from("audit_logs")
        .select(`
            id,
            action,
            table_name,
            record_id,
            old_data,
            new_data,
            created_at,
            changed_by,
            profiles:changed_by (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    const entries = (logs ?? []).map((log) => ({
        id: log.id,
        action: log.action,
        table_name: log.table_name,
        record_id: log.record_id,
        old_data: log.old_data as Record<string, unknown> | null,
        new_data: log.new_data as Record<string, unknown> | null,
        created_at: log.created_at ?? "",
        changed_by_name: (log.profiles as unknown as { full_name: string | null })?.full_name ?? null,
    }));

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                    Actividad Reciente
                </h1>
                <p className="mt-1 text-sm text-art-fg-muted">
                    Historial de cambios realizados en el sistema.
                </p>
            </div>

            <div className="rounded-2xl border border-art-border bg-art-bg-primary p-6 shadow-art-soft">
                <ActivityTimeline entries={entries} />
            </div>
        </div>
    );
}
