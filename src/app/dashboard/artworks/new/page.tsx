/**
 * New Artwork Page — Server Component that loads user context
 * and catalog options, then renders the ArtworkForm.
 */
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/modules/admin/services/roleService";
import { ArtworkForm } from "@/modules/inventory/components/ArtworkForm";

export const metadata = {
    title: "Nueva Ficha — ArtVault",
};

export default async function NewArtworkPage() {
    const profile = await getCurrentUserProfile();

    if (!profile) redirect("/login");
    if (profile.role === "visitante" || profile.role === "conservador") {
        redirect("/dashboard");
    }

    // Pre-load catalog options for the DynamicSelect dropdowns
    const supabase = await getSupabaseServerClient();
    const { data: options } = await supabase
        .from("catalog_options")
        .select("category, value")
        .eq("is_active", true)
        .order("value");

    const catalogOptions: Record<string, string[]> = {};
    if (options) {
        for (const opt of options) {
            if (!catalogOptions[opt.category]) {
                catalogOptions[opt.category] = [];
            }
            catalogOptions[opt.category].push(opt.value);
        }
    }

    // Fetch dynamic locations (from artworks usage)
    const { getCatalogOptionsAction } = await import("@/modules/admin/actions/catalogManagerActions");
    const locationOptions = await getCatalogOptionsAction("location");
    if (locationOptions) {
        catalogOptions["location"] = locationOptions.map(l => l.value);
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                    Nueva Ficha Técnica
                </h1>
                <p className="mt-1 text-sm text-art-fg-muted">
                    Complete los datos de la obra paso a paso.
                </p>
            </div>

            <ArtworkForm
                userRole={profile.role}
                userName={profile.full_name ?? "Usuario"}
                catalogOptions={catalogOptions}
            />
        </div>
    );
}
