"use client";

interface RequestEmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function RequestEmptyState({
    title,
    description,
    actionLabel,
    onAction,
}: RequestEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-art-border bg-art-bg-surface/30 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-art-accent-gold/10 text-art-accent-gold mb-4">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <h3 className="font-serif text-base font-bold text-art-fg-primary">{title}</h3>
            <p className="mt-1 text-xs text-art-fg-muted max-w-sm">{description}</p>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 rounded-lg bg-art-accent-gold px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-art-accent-gold-dark transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
