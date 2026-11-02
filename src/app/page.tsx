/**
 * Home / Public Catalog Page
 * Server Component that fetches artworks and renders the gallery grid.
 */
import { getPublicArtworks, getDistinctTechniques } from "@/modules/catalog/services/catalogService";
import { CatalogGallery } from "@/modules/catalog/components/CatalogGallery";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    technique?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  const [artworksResult, techniques, profile] = await Promise.all([
    getPublicArtworks({
      search: params.search,
      technique: params.technique,
      page,
    }),
    getDistinctTechniques(),
    getCurrentUserProfile(),
  ]);

  return (
    <div className="min-h-screen bg-art-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-art-border bg-art-bg-primary/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-art-accent-gold">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-art-fg-primary">
              ArtVault
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            {profile ? (
              <a
                href="/dashboard"
                className="rounded-full bg-art-accent-gold px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-art-accent-gold-dark"
              >
                Ir al Dashboard
              </a>
            ) : (
              <a
                href="/login"
                className="rounded-full border border-art-border px-5 py-2 text-sm font-medium text-art-fg-secondary transition-all hover:border-art-accent-gold hover:text-art-accent-gold"
                id="login-button"
              >
                Iniciar Sesión
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-art-bg-secondary py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-art-fg-primary md:text-5xl lg:text-6xl art-heading-accent mx-auto w-fit">
            Colección de Arte
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-art-fg-secondary">
            Explora nuestra colección de más de 1,300 obras de arte.
            Pinturas, esculturas y piezas históricas curadas con excelencia.
          </p>
        </div>
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-art-bg-primary pointer-events-none" />
      </section>

      {/* Catalog Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <CatalogGallery
          artworks={artworksResult.data}
          totalCount={artworksResult.count}
          techniques={techniques}
          currentPage={page}
          currentSearch={params.search}
          currentTechnique={params.technique}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-art-border bg-art-bg-secondary py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-art-fg-muted">
          <p>© {new Date().getFullYear()} ArtVault — Sistema de Gestión de Colecciones</p>
        </div>
      </footer>
    </div>
  );
}
