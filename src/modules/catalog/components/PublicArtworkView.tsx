/**
 * PublicArtworkView — Ficha Museográfica Pública
 * Vista de solo lectura, tipo galería de museo.
 * Muestra únicamente datos técnicos aprobados para difusión pública.
 * No contiene datos de valoración, propietario ni conservación.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import type { PublicArtwork } from "@/modules/catalog/services/catalogService";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ArtworkNavigation {
    prevUrl: string | null;
    nextUrl: string | null;
    currentIndex: number;
    totalCount: number;
    catalogUrl: string;
    activeSearch: string | null;
    activeTechnique: string | null;
}

interface PublicArtworkViewProps {
    artwork: PublicArtwork;
    /** If present, shows an admin quick-access bar */
    adminDashboardLink?: string;
    /** Navigation context from the gallery filter */
    navigation?: ArtworkNavigation;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="py-3 border-b border-art-border-subtle last:border-0">
            <dt className="text-xs font-semibold uppercase tracking-wider text-art-fg-muted mb-0.5">
                {label}
            </dt>
            <dd className="text-sm text-art-fg-primary">{value}</dd>
        </div>
    );
}

// ─── Navigation Bar ────────────────────────────────────────────────────────────

function NavigationBar({ nav }: { nav: ArtworkNavigation }) {
    const hasFilters = nav.activeSearch || nav.activeTechnique;

    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-art-border bg-art-bg-elevated px-4 py-3 shadow-[var(--art-shadow-sm)]">
            {/* Filter context label */}
            <div className="flex items-center gap-2 min-w-0">
                {hasFilters ? (
                    <>
                        <svg className="h-4 w-4 shrink-0 text-art-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <div className="min-w-0">
                            <span className="text-xs font-semibold text-art-fg-primary">
                                Obra {nav.currentIndex} de {nav.totalCount}
                            </span>
                            <span className="text-xs text-art-fg-muted ml-2">
                                — filtrando por{" "}
                                {nav.activeSearch && (
                                    <span className="inline-flex items-center rounded-md bg-art-accent-gold/10 px-1.5 py-0.5 text-[11px] font-medium text-art-accent-gold border border-art-accent-gold/20">
                                        "{nav.activeSearch}"
                                    </span>
                                )}
                                {nav.activeSearch && nav.activeTechnique && " + "}
                                {nav.activeTechnique && (
                                    <span className="inline-flex items-center rounded-md bg-art-info/10 px-1.5 py-0.5 text-[11px] font-medium text-art-info border border-art-info/20">
                                        {nav.activeTechnique}
                                    </span>
                                )}
                            </span>
                        </div>
                    </>
                ) : (
                    <span className="text-xs text-art-fg-muted">
                        Obra <span className="font-semibold text-art-fg-primary">{nav.currentIndex}</span> de <span className="font-semibold text-art-fg-primary">{nav.totalCount}</span> en la colección
                    </span>
                )}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1 shrink-0">
                <a
                    href={nav.catalogUrl}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-art-fg-muted hover:bg-art-bg-surface hover:text-art-fg-primary transition-colors"
                    title="Volver al catálogo"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="hidden sm:inline">Catálogo</span>
                </a>

                <div className="h-4 w-px bg-art-border mx-1" />

                {nav.prevUrl ? (
                    <a
                        href={nav.prevUrl}
                        className="flex items-center gap-1 rounded-lg border border-art-border px-3 py-1.5 text-xs font-medium text-art-fg-secondary hover:border-art-accent-gold hover:text-art-accent-gold transition-colors"
                        title="Obra anterior"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Anterior</span>
                    </a>
                ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-art-border px-3 py-1.5 text-xs font-medium text-art-fg-muted opacity-40 cursor-not-allowed">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Anterior</span>
                    </span>
                )}

                {nav.nextUrl ? (
                    <a
                        href={nav.nextUrl}
                        className="flex items-center gap-1 rounded-lg border border-art-accent-gold bg-art-accent-gold/5 px-3 py-1.5 text-xs font-semibold text-art-accent-gold hover:bg-art-accent-gold/15 transition-colors"
                        title="Obra siguiente"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-art-border px-3 py-1.5 text-xs font-medium text-art-fg-muted opacity-40 cursor-not-allowed">
                        <span className="hidden sm:inline">Siguiente</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PublicArtworkView({ artwork, adminDashboardLink, navigation }: PublicArtworkViewProps) {
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Reset image state on every artwork change (handles soft navigation
    // where the component does NOT unmount between prev/next pages).
    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);

        // If the browser already has this image cached, onLoad may fire
        // synchronously before React attaches the handler. Detect that here.
        if (imgRef.current) {
            if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
                setImgLoaded(true);
            } else if (imgRef.current.complete && imgRef.current.naturalWidth === 0) {
                setImgError(true);
            }
        }
    }, [artwork.primary_image_url]);

    const hasImage = Boolean(artwork.primary_image_url) && !imgError;
    const catalogUrl = navigation?.catalogUrl ?? "/";

    return (
        <div className="min-h-screen bg-art-bg-primary font-sans">

            {/* ─── Admin quick-access banner ──────────────────────────── */}
            {adminDashboardLink && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-amber-800">
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Estás viendo la <strong>vista pública</strong> de esta obra como aparece para cualquier visitante.
                    </div>
                    <a
                        href={adminDashboardLink}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-white border border-amber-300 rounded-lg px-3 py-1.5 transition-colors"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar ficha completa
                    </a>
                </div>
            )}

            {/* ─── Header ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-art-border bg-art-bg-primary/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <a href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-75">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-art-accent-gold">
                            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18M9 21V9" />
                            </svg>
                        </div>
                        <span className="font-serif text-lg font-bold tracking-tight text-art-fg-primary">ArtVault</span>
                    </a>
                    <a
                        href={catalogUrl}
                        className="flex items-center gap-1 text-sm text-art-fg-muted hover:text-art-fg-primary transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {navigation?.activeSearch || navigation?.activeTechnique
                            ? "Volver a la búsqueda"
                            : "Volver a la Colección"}
                    </a>
                </div>
            </header>

            {/* ─── Breadcrumb ──────────────────────────────────────────── */}
            <div className="mx-auto max-w-6xl px-6 pt-6">
                <nav className="flex items-center gap-2 text-xs text-art-fg-muted">
                    <a href="/" className="hover:text-art-accent-gold transition-colors">Colección</a>
                    {(navigation?.activeSearch || navigation?.activeTechnique) && (
                        <>
                            <span>/</span>
                            <a href={catalogUrl} className="hover:text-art-accent-gold transition-colors">
                                {navigation.activeSearch
                                    ? `"${navigation.activeSearch}"`
                                    : navigation.activeTechnique}
                            </a>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-art-fg-secondary truncate max-w-xs">{artwork.title}</span>
                </nav>
            </div>

            {/* ─── Main Content ────────────────────────────────────────── */}
            <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">

                {/* Navigation Bar */}
                {navigation && <NavigationBar nav={navigation} />}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">

                    {/* LEFT — Image Panel */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-20 space-y-4">
                            {/* Main image */}
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-art-bg-secondary border border-art-border shadow-[var(--art-shadow-md)] relative">
                                {hasImage ? (
                                    <>
                                        {!imgLoaded && (
                                            <div className="absolute inset-0 animate-pulse bg-art-bg-surface" />
                                        )}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            ref={imgRef}
                                            src={artwork.primary_image_url!}
                                            alt={artwork.title}
                                            className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                                            onLoad={() => setImgLoaded(true)}
                                            onError={() => setImgError(true)}
                                        />
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-art-fg-muted">
                                        <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-sm">Imagen no disponible</p>
                                    </div>
                                )}
                            </div>

                            {/* Location badge */}
                            {artwork.artwork_location && (
                                <div className="flex items-center gap-2.5 rounded-xl border border-art-border bg-art-bg-elevated px-4 py-3 shadow-[var(--art-shadow-sm)]">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-art-accent-gold/10 text-art-accent-gold">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-art-fg-muted">Ubicación en Colección</p>
                                        <p className="text-sm font-semibold text-art-fg-primary">{artwork.artwork_location}</p>
                                    </div>
                                </div>
                            )}

                            {/* Quick keyboard hint */}
                            {navigation && (navigation.prevUrl || navigation.nextUrl) && (
                                <p className="text-center text-[10px] text-art-fg-muted">
                                    Usa las flechas de la barra superior para navegar entre obras
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Info Panel */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Title & Author */}
                        <div>
                            {artwork.category && (
                                <span className="inline-block mb-3 rounded-full bg-art-accent-gold/10 px-3 py-1 text-xs font-semibold text-art-accent-gold border border-art-accent-gold/20">
                                    {artwork.category}
                                </span>
                            )}
                            <h1 className="font-serif text-3xl font-bold leading-tight text-art-fg-primary lg:text-4xl">
                                {artwork.title}
                            </h1>
                            {artwork.author && (
                                <p className="mt-2 text-lg text-art-fg-secondary font-medium">{artwork.author}</p>
                            )}
                            {artwork.year && (
                                <p className="mt-1 text-sm text-art-fg-muted">{artwork.year}</p>
                            )}
                        </div>

                        {/* Technical Sheet */}
                        <div className="rounded-2xl border border-art-border bg-art-bg-elevated shadow-[var(--art-shadow-sm)] overflow-hidden">
                            <div className="flex items-center gap-2.5 border-b border-art-border px-5 py-3.5 bg-art-bg-surface">
                                <svg className="h-4 w-4 text-art-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h2 className="text-sm font-bold text-art-fg-primary uppercase tracking-wider">Ficha Técnica</h2>
                            </div>
                            <dl className="px-5 py-2">
                                <Field label="N° de Inventario" value={artwork.inventory_number} />
                                <Field label="Técnica" value={artwork.technique} />
                                <Field label="Dimensiones" value={artwork.dimensions} />
                                <Field label="Procedencia" value={artwork.provenance} />
                                <Field label="Fecha de Ingreso" value={artwork.entry_date} />
                            </dl>
                        </div>

                        {/* Author Biography */}
                        {artwork.author_biography && (
                            <div className="rounded-2xl border border-art-border bg-art-bg-elevated shadow-[var(--art-shadow-sm)] overflow-hidden">
                                <div className="flex items-center gap-2.5 border-b border-art-border px-5 py-3.5 bg-art-bg-surface">
                                    <svg className="h-4 w-4 text-art-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h2 className="text-sm font-bold text-art-fg-primary uppercase tracking-wider">Sobre el Autor</h2>
                                </div>
                                <div className="px-5 py-4">
                                    <p className="text-sm leading-relaxed text-art-fg-secondary whitespace-pre-line">
                                        {artwork.author_biography}
                                    </p>
                                    {artwork.biography_researcher && (
                                        <p className="mt-3 text-xs text-art-fg-muted italic">
                                            Investigado por: {artwork.biography_researcher}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Bottom navigation repeat for long pages */}
                {navigation && (
                    <div className="pt-4 border-t border-art-border">
                        <NavigationBar nav={navigation} />
                    </div>
                )}
            </main>

            {/* ─── Footer ─────────────────────────────────────────────── */}
            <footer className="mt-16 border-t border-art-border bg-art-bg-secondary py-8">
                <div className="mx-auto max-w-6xl px-6 text-center text-sm text-art-fg-muted">
                    <p>© {new Date().getFullYear()} ArtVault — Sistema de Gestión de Colecciones</p>
                </div>
            </footer>
        </div>
    );
}
