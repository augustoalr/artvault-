import { CatalogManager } from "@/modules/admin/components/CatalogManager";

export const metadata = {
    title: "Gestión de Catálogo — ArtVault",
};

export default function CatalogSettingsPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                    Gestión de Catálogo
                </h1>
                <p className="mt-1 text-sm text-art-fg-muted">
                    Administra las listas desplegables, estandariza términos y corrige ubicaciones.
                </p>
            </div>

            <CatalogManager />
        </div>
    );
}
