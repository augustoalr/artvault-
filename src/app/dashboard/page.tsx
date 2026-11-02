/**
 * Dashboard Home — Summary metrics page.
 * Shows key stats for admins and editors, plus live transfers panel.
 */
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveRequestsSummary } from "@/modules/security/services/securityService";
import { TransfersWidget } from "@/modules/security/components/TransfersWidget";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
    return (
        <div className="rounded-xl border border-art-border bg-art-bg-elevated p-6 shadow-[var(--art-shadow-sm)] transition-shadow hover:shadow-[var(--art-shadow-md)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-art-fg-muted">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-art-fg-primary">
                        {value}
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-art-accent-gold/10 text-art-accent-gold">
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const supabase = await getSupabaseServerClient();

    const [artworksResult, usersResult, mediaResult, transfersSummary] = await Promise.all([
        supabase
            .from("artworks")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
            .from("media_assets")
            .select("id", { count: "exact", head: true }),
        getActiveRequestsSummary(),
    ]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary art-heading-accent">
                    Resumen
                </h1>
                <p className="mt-3 text-sm text-art-fg-muted">
                    Vista general del estado de la colección.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Obras en Colección"
                    value={artworksResult.count ?? 0}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Usuarios Registrados"
                    value={usersResult.count ?? 0}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Archivos Media"
                    value={mediaResult.count ?? 0}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                        </svg>
                    }
                />
            </div>

            {/* Transfers Widget — Live Movement Requests */}
            <TransfersWidget
                pendingBienes={transfersSummary.pendingBienes}
                pendingSecurity={transfersSummary.pendingSecurity}
                authorizedToday={transfersSummary.authorizedToday}
            />

            {/* Quick Actions */}
            <div className="rounded-xl border border-art-border bg-art-bg-elevated p-6">
                <h2 className="mb-4 text-lg font-semibold text-art-fg-primary">
                    Acciones Rápidas
                </h2>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="/dashboard/artworks/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-art-accent-gold-dark"
                        id="new-artwork-button"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nueva Obra
                    </a>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg border border-art-border px-4 py-2.5 text-sm font-medium text-art-fg-secondary transition-colors hover:border-art-accent-gold hover:text-art-accent-gold"
                    >
                        Ver Catálogo Público
                    </a>
                </div>
            </div>
        </div>
    );
}
