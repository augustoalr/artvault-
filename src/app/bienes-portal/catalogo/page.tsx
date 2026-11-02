/**
 * Bienes Catalog Page — Catálogo de obras para el rol Bienes Nacionales.
 * Acceso limitado: búsqueda + listado. Solo muestra datos de Página 1.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Catálogo — Portal Bienes Nacionales",
};

interface PageProps {
    searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function BienesCatalogPage({ searchParams }: PageProps) {
    const profile = await getCurrentUserProfile();
    if (!profile) redirect("/login");
    if (profile.role !== "bienes" && profile.role !== "admin") redirect("/");

    const params = await searchParams;
    const search = params.search?.trim() ?? "";
    const page = Number(params.page) || 1;
    const pageSize = 24;

    const supabase = await getSupabaseServerClient();

    // Fetch artworks — only public-safe fields (Page 1 data)
    let query = supabase
        .from("artworks")
        .select(
            `id, inventory_number, title, author, year, category, technique,
             dimensions, artwork_location,
             media_assets!inner(storage_path, is_primary)`,
            { count: "exact" }
        )
        .is("deleted_at", null)
        .order("inventory_number", { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
        query = query.or(
            `title.ilike.%${search}%,author.ilike.%${search}%,inventory_number.ilike.%${search}%,technique.ilike.%${search}%`
        );
    }

    const { data: artworks, count } = await query;
    const totalPages = Math.ceil((count ?? 0) / pageSize);

    // Helper: build public image URL
    const getImageUrl = (path: string) => {
        const { data } = supabase.storage.from("artworks").getPublicUrl(path);
        return data.publicUrl;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Catálogo de Obras</h1>
                        <p className="text-xs text-gray-500">Vista limitada — Bienes Nacionales</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/bienes-portal"
                        className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                        ← Volver al Portal
                    </Link>
                </div>
            </header>

            {/* Search Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 shrink-0">
                <form method="GET" action="/bienes-portal/catalogo">
                    <div className="relative max-w-xl">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Buscar por título, autor, N° inventario, técnica..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        />
                        {search && (
                            <Link
                                href="/bienes-portal/catalogo"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                                ✕ Limpiar
                            </Link>
                        )}
                    </div>
                </form>
                <p className="mt-1.5 text-xs text-gray-400">
                    {count ?? 0} obras encontradas
                    {search && <span> para "<strong>{search}</strong>"</span>}
                </p>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {!artworks || artworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">No se encontraron obras</p>
                        {search && <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {artworks.map((artwork: any) => {
                            const primaryMedia = artwork.media_assets?.find((m: any) => m.is_primary) ?? artwork.media_assets?.[0];
                            const imgUrl = primaryMedia ? getImageUrl(primaryMedia.storage_path) : null;

                            return (
                                <Link
                                    key={artwork.id}
                                    href={`/bienes-portal/catalogo/${artwork.id}`}
                                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                                        {imgUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={imgUrl}
                                                alt={artwork.title}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        {artwork.artwork_location && (
                                            <div className="absolute bottom-1 left-1 right-1">
                                                <span className="inline-block w-full truncate bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded text-center">
                                                    📍 {artwork.artwork_location}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-2.5">
                                        <p className="text-[10px] font-mono text-gray-400 mb-0.5">{artwork.inventory_number}</p>
                                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight" title={artwork.title}>
                                            {artwork.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{artwork.author ?? "—"}</p>
                                        {artwork.year && (
                                            <p className="text-[10px] text-gray-400">{artwork.year}</p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {page > 1 && (
                            <Link href={`/bienes-portal/catalogo?search=${search}&page=${page - 1}`} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                                ← Anterior
                            </Link>
                        )}
                        <span className="px-3 py-1.5 text-xs text-gray-500">
                            Página {page} de {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link href={`/bienes-portal/catalogo?search=${search}&page=${page + 1}`} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                                Siguiente →
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
