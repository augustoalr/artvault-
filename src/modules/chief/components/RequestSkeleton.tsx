"use client";

export function RequestSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-24 rounded-xl border border-art-border bg-art-bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-art-bg-secondary" />
                    <div className="h-5 w-20 rounded-full bg-art-bg-secondary" />
                </div>
                <div className="h-4 w-3/4 rounded bg-art-bg-secondary" />
                <div className="flex gap-4">
                    <div className="h-3 w-20 rounded bg-art-bg-secondary" />
                    <div className="h-3 w-24 rounded bg-art-bg-secondary" />
                </div>
            </div>

            <div className="h-24 rounded-xl border border-art-border bg-art-bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-art-bg-secondary" />
                    <div className="h-5 w-20 rounded-full bg-art-bg-secondary" />
                </div>
                <div className="h-4 w-2/3 rounded bg-art-bg-secondary" />
                <div className="flex gap-4">
                    <div className="h-3 w-20 rounded bg-art-bg-secondary" />
                    <div className="h-3 w-24 rounded bg-art-bg-secondary" />
                </div>
            </div>
        </div>
    );
}
