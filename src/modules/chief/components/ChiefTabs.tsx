"use client";

export type ChiefTabType = "pending" | "history";

interface ChiefTabsProps {
    activeTab: ChiefTabType;
    onTabChange: (tab: ChiefTabType) => void;
    pendingCount: number;
    historyCount: number;
}

export function ChiefTabs({
    activeTab,
    onTabChange,
    pendingCount,
    historyCount,
}: ChiefTabsProps) {
    return (
        <div className="flex items-center gap-2 border-b border-art-border">
            <button
                type="button"
                onClick={() => onTabChange("pending")}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === "pending"
                        ? "border-art-accent-gold text-art-accent-gold-dark"
                        : "border-transparent text-art-fg-secondary hover:text-art-fg-primary"
                }`}
            >
                <span>Solicitudes Pendientes</span>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        activeTab === "pending"
                            ? "bg-art-accent-gold text-white"
                            : "bg-art-bg-surface text-art-fg-secondary"
                    }`}
                >
                    {pendingCount}
                </span>
            </button>

            <button
                type="button"
                onClick={() => onTabChange("history")}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === "history"
                        ? "border-art-accent-gold text-art-accent-gold-dark"
                        : "border-transparent text-art-fg-secondary hover:text-art-fg-primary"
                }`}
            >
                <span>Historial de Aprobaciones</span>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        activeTab === "history"
                            ? "bg-art-accent-gold text-white"
                            : "bg-art-bg-surface text-art-fg-secondary"
                    }`}
                >
                    {historyCount}
                </span>
            </button>
        </div>
    );
}
