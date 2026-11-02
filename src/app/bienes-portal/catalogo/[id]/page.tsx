/**
 * Bienes Artwork Detail Page
 * Shows only Page 1 data (Datos Técnicos) + Movement History (read-only).
 * Confidential data (history, valuation, conservation) is hidden.
 */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getArtworkMovements } from "@/modules/inventory/services/movementService";
import { MovementTimeline } from "@/modules/inventory/components/MovementTimeline";

interface PageProps {
    params: Promise<{ id: string }>;
}

// ─── Read-only field display ──────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">No registrado</span>}</p>
        </div>
    );
}

export default async function BienesArtworkDetailPage({ params }: PageProps) {
    const { id } = await params;
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");
    if (profile.role !== "bienes" && profile.role !== "admin") redirect("/");

    const supabase = await getSupabaseServerClient();

    // Fetch only Page 1 fields — no valuation, no biography, no conservation
    const { data: artwork, error } = await supabase
        .from("artworks")
        .select(
            `id, inventory_number, title, author, year, category, technique,
             dimensions, provenance, entry_date, original_owner, artwork_location,
             photo_type, photographer, deleted_at`
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (error || !artwork) return notFound();

    // Fetch primary media
    const { data: mediaAsset } = await supabase
        .from("media_assets")
        .select("storage_path, is_primary")
        .eq("artwork_id", id)
        .eq("is_primary", true)
        .maybeSingle();

    const imageUrl = mediaAsset
        ? supabase.storage.from("artworks").getPublicUrl(mediaAsset.storage_path).data.publicUrl
        : null;

    // Fetch movement history
    const movements = await getArtworkMovements(id);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top navigation bar */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href="/bienes-portal/catalogo"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-700 transition-colors"
                    >
                        ← Volver al catálogo
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-400 font-mono">{artwork.inventory_number}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Vista limitada — Solo datos técnicos
                    </span>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* ─── Main card: Datos Técnicos (Página 1) ─────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 px-6 py-4">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 font-serif leading-tight">{artwork.title}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{artwork.author ?? "Autor desconocido"}{artwork.year ? ` · ${artwork.year}` : ""}</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left: Image */}
                            <div className="md:col-span-1">
                                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                    {imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={imageUrl}
                                            alt={artwork.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs">Sin imagen</p>
                                        </div>
                                    )}
                                </div>

                                {/* Location badge */}
                                {artwork.artwork_location && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                                        <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Ubicación actual</p>
                                            <p className="text-xs font-medium text-blue-800">{artwork.artwork_location}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Fields */}
                            <div className="md:col-span-2 space-y-6">

                                {/* Row 1 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ReadField label="N° de Inventario" value={artwork.inventory_number} />
                                    <ReadField label="Categoría" value={artwork.category} />
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Row 2 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ReadField label="Técnica" value={artwork.technique} />
                                    <ReadField label="Dimensiones" value={artwork.dimensions} />
                                </div>

                                {/* Row 3 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ReadField label="Procedencia" value={artwork.provenance} />
                                    <ReadField label="Fecha de Ingreso" value={artwork.entry_date} />
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Row 4: Owner */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ReadField label="Propietario Original" value={artwork.original_owner} />
                                    <ReadField label="Tipo de Foto" value={artwork.photo_type} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <ReadField label="Fotógrafo" value={artwork.photographer} />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Movement History (read-only) ────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Historial de Movimientos</h2>
                            <p className="text-xs text-gray-500">{movements.length} registro{movements.length !== 1 ? "s" : ""} de traslado</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {movements.length === 0 ? (
                            <div className="py-8 text-center text-gray-400">
                                <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-sm">Sin movimientos registrados</p>
                            </div>
                        ) : (
                            <MovementTimeline movements={movements} />
                        )}
                    </div>
                </div>

                {/* Confidential notice */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex gap-3">
                    <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Acceso restringido</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            La información de autoría biográfica, valoración económica y diagnóstico de conservación es confidencial y no está disponible para este perfil.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
