/**
 * ArtworkForm — Formulario completo de Ficha Técnica (4 páginas).
 * Página 1: Datos Técnicos + Foto principal
 * Página 2: Historia/Movimientos + Biografía del autor
 * Página 3: Montaje + Observaciones + Valoración
 * Página 4: Conservación (solo conservador/admin)
 */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/modules/shared/components/Stepper";
import { DynamicSelect } from "@/modules/shared/components/DynamicSelect";
import { ImageUpload } from "@/modules/media/components/ImageUpload";
import { uploadArtworkImage } from "@/modules/media/services/imageService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

// ─── Types ───
interface ArtworkFormData {
    // Page 1
    inventory_number: string;
    title: string;
    author: string;
    year: string;
    category: string;
    technique: string;
    dimensions: string;
    provenance: string;
    entry_date: string;
    original_owner: string;
    owner_address: string;
    artwork_location: string;
    photo_type: string;
    photographer: string;
    // Page 2
    author_biography: string;
    biography_researcher: string;
    // Page 3
    mounting_description: string;
    general_observations: string;
    approved_by: string;
    value_bs: string;
    value_usd: string;
    appraisal_date: string;
    reviewed_by: string;
}

interface ArtworkFormProps {
    userRole: UserRole;
    userName: string;
    /** If provided, form is in edit mode */
    existingData?: Partial<ArtworkFormData> & { id?: string };
    /** Pre-loaded catalog options per category */
    catalogOptions?: Record<string, string[]>;
    /** Existing primary image URL (edit mode) */
    primaryImageUrl?: string;
    /** Existing primary image storage path (edit mode) */
    primaryImagePath?: string;
}

const STEPS = [
    { label: "Datos Técnicos", description: "Información general de la obra" },
    { label: "Historia y Biografía", description: "Movimientos y biografía del autor" },
    { label: "Montaje y Valoración", description: "Detalles técnicos y financieros" },
    { label: "Revisión", description: "Confirmar y guardar" },
];

const INITIAL_DATA: ArtworkFormData = {
    inventory_number: "",
    title: "",
    author: "",
    year: "",
    category: "",
    technique: "",
    dimensions: "",
    provenance: "",
    entry_date: "",
    original_owner: "",
    owner_address: "",
    artwork_location: "",
    photo_type: "",
    photographer: "",
    author_biography: "",
    biography_researcher: "",
    mounting_description: "",
    general_observations: "",
    approved_by: "",
    value_bs: "",
    value_usd: "",
    appraisal_date: "",
    reviewed_by: "",
};

// ─── Reusable Components (Outside main component to prevent focus loss) ───

function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    id,
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    id?: string;
    readOnly?: boolean;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                {label} {required && !readOnly && <span className="text-art-danger">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value || ""}
                onChange={(e) => !readOnly && onChange(e.target.value)}
                placeholder={readOnly ? "" : placeholder}
                required={required}
                readOnly={readOnly}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20 ${readOnly
                    ? "border-transparent bg-art-bg-secondary/50 text-art-fg-primary cursor-default"
                    : "border-art-border bg-art-bg-primary text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold"
                    }`}
            />
        </div>
    );
}

function FormTextArea({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
    id,
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    rows?: number;
    id?: string;
    readOnly?: boolean;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                {label}
            </label>
            <textarea
                id={id}
                value={value || ""}
                onChange={(e) => !readOnly && onChange(e.target.value)}
                placeholder={readOnly ? "" : placeholder}
                rows={rows}
                readOnly={readOnly}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20 ${readOnly
                    ? "border-transparent bg-art-bg-secondary/50 text-art-fg-primary cursor-default"
                    : "border-art-border bg-art-bg-primary text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold"
                    }`}
            />
        </div>
    );
}

// ─── Main Component ───

export function ArtworkForm({
    userRole,
    userName,
    existingData,
    catalogOptions = {},
    primaryImageUrl,
    primaryImagePath,
}: ArtworkFormProps) {
    const router = useRouter();
    const isEditing = Boolean(existingData?.id);
    const isReadOnly = userRole === "visitante";

    const [step, setStep] = useState(0);
    const [data, setData] = useState<ArtworkFormData>({
        ...INITIAL_DATA,
        ...existingData,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Track artwork ID after first save so ImageUpload can persist
    const [savedArtworkId, setSavedArtworkId] = useState<string | null>(
        existingData?.id ?? null
    );
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    function updateField(field: keyof ArtworkFormData, value: string) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function canAdvance(): boolean {
        if (step === 0) {
            return Boolean(data.inventory_number && data.title);
        }
        return true;
    }

    async function handleSubmit() {
        setSubmitting(true);
        setError(null);

        try {
            const { createArtworkAction, updateArtworkAction } = await import(
                "@/modules/inventory/actions/inventoryActions"
            );

            const artworkPayload = {
                inventory_number: data.inventory_number,
                title: data.title,
                author: data.author || null,
                year: data.year || null,
                category: data.category || null,
                technique: data.technique || null,
                dimensions: data.dimensions || null,
                provenance: data.provenance || null,
                entry_date: data.entry_date || null,
                original_owner: data.original_owner || null,
                owner_address: data.owner_address || null,
                artwork_location: data.artwork_location || null,
                photo_type: data.photo_type || null,
                photographer: data.photographer || null,
                author_biography: data.author_biography || null,
                biography_researcher: data.biography_researcher || null,
                mounting_description: data.mounting_description || null,
                general_observations: data.general_observations || null,
                reviewed_by: data.reviewed_by || null,
                completion_percentage: completionPercentage,
            };

            let result;
            if (isEditing && existingData?.id) {
                result = await updateArtworkAction(existingData.id, artworkPayload);
            } else {
                result = await createArtworkAction(artworkPayload);
            }

            if (!result.success) {
                setError(result.error ?? "Error desconocido");
                setSubmitting(false);
                return;
            }

            const artworkId = isEditing ? existingData!.id! : result.id!;
            setSavedArtworkId(artworkId);

            // Save valuation data if provided
            if (data.value_bs || data.value_usd || data.approved_by) {
                const { saveValuationAction } = await import(
                    "@/modules/inventory/actions/inventoryActions"
                );
                await saveValuationAction(artworkId, {
                    value_bs: data.value_bs ? parseFloat(data.value_bs) : undefined,
                    value_usd: data.value_usd ? parseFloat(data.value_usd) : undefined,
                    appraisal_date: data.appraisal_date || undefined,
                    approved_by: data.approved_by || undefined,
                    reviewed_by: data.reviewed_by || undefined,
                });
            }

            // Upload initial image if selected
            if (!isEditing && selectedImage && artworkId) {
                const uploadResult = await uploadArtworkImage(selectedImage, artworkId, "primary");
                if (uploadResult.success) {
                    const supabase = getSupabaseBrowserClient();
                    await supabase.from("media_assets").insert({
                        artwork_id: artworkId,
                        storage_path: uploadResult.storagePath!,
                        file_type: "image/jpeg",
                        size_kb: uploadResult.sizeKb,
                        is_primary: true,
                    });
                } else {
                    console.error("Error uploading initial image:", uploadResult.error);
                }
            }

            // If creating, redirect to the edit page to allow image upload
            // If editing, go back to list (or stay, depending on preference, but list is standard)
            if (isEditing) {
                router.push("/dashboard/artworks");
            } else {
                // Redirect to the detail page of the new artwork
                router.push(`/dashboard/artworks/${artworkId}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado");
            setSubmitting(false);
        }
    }

    // ────────────────────────────────────────────────────────
    // Page 1: Datos Técnicos
    // ────────────────────────────────────────────────────────
    function renderPage1() {
        return (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[1fr_280px]">
                {/* Left: Form fields */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="N° de Registro" value={data.inventory_number} onChange={(v) => updateField("inventory_number", v)} placeholder="Ej: 48536" required id="inventory_number" readOnly={isReadOnly} />
                        <FormInput label="Título" value={data.title} onChange={(v) => updateField("title", v)} placeholder="Nombre de la obra" required id="title" readOnly={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="Autor" value={data.author} onChange={(v) => updateField("author", v)} placeholder="Nombre del artista" id="author" readOnly={isReadOnly} />
                        <FormInput label="Fecha" value={data.year} onChange={(v) => updateField("year", v)} placeholder="Año o período" id="year" readOnly={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DynamicSelect
                            category="category"
                            label="Categoría"
                            value={data.category}
                            onChange={(v) => updateField("category", v)}
                            initialOptions={catalogOptions.category}
                            readOnly={isReadOnly}
                        />
                        <DynamicSelect
                            category="technique"
                            label="Técnica / Materiales"
                            value={data.technique}
                            onChange={(v) => updateField("technique", v)}
                            initialOptions={catalogOptions.technique}
                            readOnly={isReadOnly}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="Medidas" value={data.dimensions} onChange={(v) => updateField("dimensions", v)} placeholder="Ej: 120 x 80 cm" id="dimensions" readOnly={isReadOnly} />
                        <DynamicSelect
                            category="provenance"
                            label="Procedencia"
                            value={data.provenance}
                            onChange={(v) => updateField("provenance", v)}
                            initialOptions={catalogOptions.provenance}
                            readOnly={isReadOnly}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="Fecha de Ingreso" value={data.entry_date} onChange={(v) => updateField("entry_date", v)} type="date" id="entry_date" readOnly={isReadOnly} />
                        <FormInput label="Propietario Original" value={data.original_owner} onChange={(v) => updateField("original_owner", v)} placeholder="Nombre" id="original_owner" readOnly={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="Dirección" value={data.owner_address} onChange={(v) => updateField("owner_address", v)} placeholder="Dirección del propietario" id="owner_address" readOnly={isReadOnly} />
                        <DynamicSelect
                            category="location"
                            label="Localización de la Obra"
                            value={data.artwork_location}
                            onChange={(v) => updateField("artwork_location", v)}
                            initialOptions={catalogOptions.location}
                            id="artwork_location"
                            readOnly={isReadOnly}
                        />
                    </div>

                    <div className="border-t border-art-border pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                            Registro Fotográfico
                        </p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DynamicSelect
                                category="tipo_fotografico"
                                label="Tipo de Registro"
                                value={data.photo_type}
                                onChange={(v) => updateField("photo_type", v)}
                                initialOptions={catalogOptions.tipo_fotografico}
                                readOnly={isReadOnly}
                            />
                            <FormInput label="Fotógrafo" value={data.photographer} onChange={(v) => updateField("photographer", v)} placeholder="Nombre del fotógrafo" id="photographer" readOnly={isReadOnly} />
                        </div>
                    </div>
                </div>

                {/* Right: Photo upload */}
                <div className="flex flex-col">
                    <ImageUpload
                        artworkId={savedArtworkId ?? "new"}
                        label="Fotografía Principal"
                        suffix="primary"
                        isPrimary
                        existingUrl={primaryImageUrl}
                        existingPath={primaryImagePath}
                        onFileSelect={!savedArtworkId ? setSelectedImage : undefined}
                        readOnly={isReadOnly}
                    />
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────
    // Page 2: Historia y Biografía
    // ────────────────────────────────────────────────────────
    function renderPage2() {
        return (
            <div className="space-y-6">
                {/* Author biography */}
                <div className="space-y-4">
                    <FormTextArea
                        label="Biografía del Autor"
                        value={data.author_biography}
                        onChange={(v) => updateField("author_biography", v)}
                        placeholder="Biografía del artista…"
                        rows={8}
                        id="author_biography"
                        readOnly={isReadOnly}
                    />
                    <DynamicSelect
                        category="investigador"
                        label="Investigación realizada por"
                        value={data.biography_researcher}
                        onChange={(v) => updateField("biography_researcher", v)}
                        initialOptions={catalogOptions.investigador}
                        readOnly={isReadOnly}
                    />
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────
    // Page 3: Montaje y Valoración
    // ────────────────────────────────────────────────────────
    function renderPage3() {
        return (
            <div className="space-y-6">
                <FormTextArea
                    label="Descripción del Montaje"
                    value={data.mounting_description}
                    onChange={(v) => updateField("mounting_description", v)}
                    placeholder="Características técnicas, montaje y descripción de los materiales…"
                    rows={5}
                    id="mounting_description"
                    readOnly={isReadOnly}
                />
                <FormTextArea
                    label="Observaciones Generales"
                    value={data.general_observations}
                    onChange={(v) => updateField("general_observations", v)}
                    placeholder="Observaciones adicionales…"
                    rows={4}
                    id="general_observations"
                    readOnly={isReadOnly}
                />

                <div className="border-t border-art-border pt-5">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                        Información Financiera y Aprobación
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput label="Ingreso aprobado por" value={data.approved_by} onChange={(v) => updateField("approved_by", v)} placeholder="Nombre" id="approved_by" readOnly={isReadOnly} />
                        <FormInput label="Valor inicial Bs" value={data.value_bs} onChange={(v) => updateField("value_bs", v)} placeholder="0.00" type="number" id="value_bs" readOnly={isReadOnly} />
                        <FormInput label="Valor USD" value={data.value_usd} onChange={(v) => updateField("value_usd", v)} placeholder="0.00" type="number" id="value_usd" readOnly={isReadOnly} />
                        <FormInput label="Fecha de Avalúo" value={data.appraisal_date} onChange={(v) => updateField("appraisal_date", v)} type="date" id="appraisal_date" readOnly={isReadOnly} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Auto field */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                                Registro realizado por
                            </label>
                            <div className="rounded-lg border border-art-border bg-art-bg-secondary px-3 py-2.5 text-sm text-art-fg-muted">
                                {userName}
                            </div>
                        </div>
                        <FormInput label="Registro revisado por" value={data.reviewed_by} onChange={(v) => updateField("reviewed_by", v)} placeholder="Nombre del revisor" id="reviewed_by" readOnly={isReadOnly} />
                    </div>
                    {/* Auto field */}
                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                            Fecha de realización
                        </label>
                        <div className="rounded-lg border border-art-border bg-art-bg-secondary px-3 py-2.5 text-sm text-art-fg-muted">
                            {new Date().toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────
    // Page 4 (Review)
    // ────────────────────────────────────────────────────────
    function renderReview() {
        const sections = [
            {
                title: "Datos Técnicos",
                fields: [
                    ["N° de Registro", data.inventory_number],
                    ["Título", data.title],
                    ["Autor", data.author],
                    ["Fecha", data.year],
                    ["Categoría", data.category],
                    ["Técnica", data.technique],
                    ["Medidas", data.dimensions],
                    ["Procedencia", data.provenance],
                    ["Fecha de Ingreso", data.entry_date],
                    ["Propietario Original", data.original_owner],
                    ["Localización", data.artwork_location],
                    ["Tipo Foto", data.photo_type],
                    ["Fotógrafo", data.photographer],
                ],
            },
            {
                title: "Historia y Biografía",
                fields: [
                    ["Biografía del Autor", data.author_biography ? "✓ Completada" : "—"],
                    ["Investigador", data.biography_researcher],
                ],
            },
            {
                title: "Montaje y Valoración",
                fields: [
                    ["Descripción del Montaje", data.mounting_description ? "✓ Completada" : "—"],
                    ["Observaciones", data.general_observations ? "✓ Completada" : "—"],
                    ["Aprobado por", data.approved_by],
                    ["Valor Bs", data.value_bs],
                    ["Valor USD", data.value_usd],
                    ["Fecha Avalúo", data.appraisal_date],
                    ["Revisado por", data.reviewed_by],
                    ["Registrado por", userName],
                ],
            },
        ];

        return (
            <div className="space-y-6">
                <p className="text-sm text-art-fg-secondary">
                    Revisa los datos antes de {isEditing ? "actualizar" : "guardar"} la ficha.
                </p>
                {sections.map((section) => (
                    <div key={section.title} className="rounded-xl border border-art-border overflow-hidden">
                        <div className="bg-art-bg-secondary px-4 py-2.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                                {section.title}
                            </h4>
                        </div>
                        <div className="divide-y divide-art-border/50">
                            {section.fields
                                .filter(([, val]) => val)
                                .map(([label, val]) => (
                                    <div key={label} className="flex justify-between px-4 py-2">
                                        <span className="text-xs text-art-fg-muted">{label}</span>
                                        <span className="text-xs font-medium text-art-fg-primary text-right max-w-[60%] truncate">
                                            {val}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {/* Conservación notice */}
                {(userRole === "conservador" || userRole === "admin") && (
                    <div className="rounded-xl border border-art-accent-gold/20 bg-art-accent-gold/5 p-4">
                        <p className="text-xs text-art-accent-gold font-medium">
                            📋 La sección de Conservación estará disponible después de guardar la ficha.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ─── Progress Logic ───
    const completionPercentage = useMemo(() => {
        const totalFields = Object.keys(INITIAL_DATA).length;
        // Only count fields that exist in our form definition (prevent counting id, created_at, completion_percentage, etc.)
        const filledFields = Object.keys(INITIAL_DATA).filter((key) => {
            const val = data[key as keyof ArtworkFormData];
            if (typeof val === "string") return val.trim().length > 0;
            return val !== null && val !== undefined;
        }).length;

        return Math.round((filledFields / totalFields) * 100);
    }, [data]);

    // ─── Render ───
    const pages = [renderPage1, renderPage2, renderPage3, renderReview];

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Stepper
                    steps={STEPS}
                    currentStep={step}
                    onStepClick={(i) => {
                        // Allow navigating if we have basic required data
                        if (canAdvance() || i < step) setStep(i);
                    }}
                />

                {/* Progress Bar */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-2 flex-1 rounded-full bg-art-bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full bg-art-accent-gold transition-all duration-500 ease-out"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-art-fg-muted whitespace-nowrap">
                        {completionPercentage}% Completado
                    </span>
                </div>
            </div>

            {/* Page content */}
            <div className="rounded-2xl border border-art-border bg-art-bg-primary p-6 shadow-art-soft">
                {/* Page header */}
                <div className="mb-6 border-b border-art-border pb-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-art-accent-gold/10 text-xs font-bold text-art-accent-gold">
                            {step + 1}
                        </span>
                        <div>
                            <h3 className="font-serif text-lg font-semibold text-art-fg-primary">
                                {STEPS[step].label}
                            </h3>
                            <p className="text-xs text-art-fg-muted">{STEPS[step].description}</p>
                        </div>
                    </div>
                </div>

                {pages[step]()}

                {/* Error */}
                {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-art-danger">
                        {error}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">

                {/* Left: Previous */}
                <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className={`rounded-lg border border-art-border px-5 py-2.5 text-sm font-medium text-art-fg-secondary transition-all hover:border-art-fg-muted disabled:opacity-0 ${step === 0 ? "invisible" : ""}`}
                >
                    ← Anterior
                </button>

                {/* Right: Actions */}
                <div className="flex gap-3">
                    {/* Flexible Save Button (Visible if basic requirements are met) */}
                    {!isReadOnly && canAdvance() && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="hidden sm:inline-flex rounded-lg border border-art-accent-gold text-art-accent-gold px-5 py-2.5 text-sm font-semibold transition-all hover:bg-art-accent-gold/5 disabled:opacity-50"
                        >
                            {submitting ? "Guardando..." : "Guardar Avance"}
                        </button>
                    )}

                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                            disabled={!canAdvance()}
                            className="rounded-lg bg-art-accent-gold px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-art-accent-gold-dark disabled:opacity-50"
                        >
                            Siguiente →
                        </button>
                    ) : !isReadOnly ? (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-lg bg-art-accent-gold px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-art-accent-gold-dark disabled:opacity-50"
                        >
                            {submitting
                                ? "Guardando..."
                                : isEditing
                                    ? "Actualizar Ficha"
                                    : "Finalizar"}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
