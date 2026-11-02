/**
 * ArtworkCard — Atomic UI Component
 * Displays an artwork thumbnail with title and author.
 * Handles Loading (skeleton), Error, and Data states.
 * Pure visual component — no business logic.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ArtworkCardProps {
    id: string;
    title: string;
    author: string | null;
    year: string | null;
    imageUrl: string | null;
    technique: string | null;
    /** Active filter context — passed to detail page for prev/next navigation */
    filterSearch?: string;
    filterTechnique?: string;
    filterPage?: number;
}

export function ArtworkCardSkeleton() {
    return (
        <div className="group flex flex-col overflow-hidden rounded-lg bg-art-bg-elevated">
            <div className="art-skeleton aspect-[3/4] w-full" />
            <div className="flex flex-col gap-2 p-4">
                <div className="art-skeleton h-5 w-3/4 rounded" />
                <div className="art-skeleton h-4 w-1/2 rounded" />
            </div>
        </div>
    );
}

export function ArtworkCard({
    id,
    title,
    author,
    year,
    imageUrl,
    technique,
    filterSearch,
    filterTechnique,
    filterPage,
}: ArtworkCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Validate URL to prevent Next.js Image crash on invalid src
    const isValidUrl = imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/"));
    const safeSrc = isValidUrl ? imageUrl! : "/placeholder-art.svg";

    // Build detail URL with filter context for prev/next navigation
    const params = new URLSearchParams();
    if (filterSearch) params.set("search", filterSearch);
    if (filterTechnique) params.set("technique", filterTechnique);
    if (filterPage && filterPage > 1) params.set("page", String(filterPage));
    const queryString = params.toString();
    const detailHref = queryString ? `/catalog/${id}?${queryString}` : `/catalog/${id}`;

    return (
        <Link
            href={detailHref}
            className="group flex flex-col overflow-hidden rounded-lg bg-art-bg-elevated transition-shadow duration-[--art-transition-base] hover:shadow-[var(--art-shadow-float)]"
            id={`artwork-card-${id}`}
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-art-bg-surface">
                {!imageLoaded && !imageError && (
                    <div className="art-skeleton absolute inset-0" />
                )}
                {imageError ? (
                    <div className="flex h-full items-center justify-center bg-art-bg-surface">
                        <svg
                            className="h-12 w-12 text-art-fg-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                ) : (
                    <Image
                        src={safeSrc}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={`object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 p-4">
                <h3 className="truncate font-serif text-base font-semibold text-art-fg-primary group-hover:text-art-accent-gold transition-colors">
                    {title}
                </h3>
                {author && (
                    <p className="truncate text-sm text-art-fg-secondary">{author}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-art-fg-muted">
                    {year && <span>{year}</span>}
                    {year && technique && <span>·</span>}
                    {technique && <span className="truncate">{technique}</span>}
                </div>
            </div>
        </Link>
    );
}
