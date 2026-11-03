/**
 * WorkflowSettingsView — Client component for configurable workflow engine.
 * Allows administrators to switch organization presets, fine-tune approval toggles,
 * edit organization identity, and view real-time visual flow simulation.
 */
"use client";

import { useState, useTransition } from "react";
import type { OrganizationSettings, OrganizationType } from "@/lib/supabase/types";
import { updateOrganizationSettings } from "@/modules/admin/services/organizationSettingsService";

interface WorkflowSettingsViewProps {
    initialSettings: OrganizationSettings;
}

interface PresetOption {
    type: OrganizationType;
    title: string;
    subtitle: string;
    badge: string;
    description: string;
    icon: React.ReactNode;
    toggles: {
        require_bienes_approval: boolean;
        require_chief_approval: boolean;
        require_security_checkpoint: boolean;
        allow_partial_authorization: boolean;
    };
}

const PRESETS: PresetOption[] = [
    {
        type: "public_institution",
        title: "Institución Pública",
        subtitle: "Bienes Nacionales + Jefatura + Seguridad",
        badge: "3 Niveles de Control",
        description:
            "Control estatal patrimonial estricto. Requiere verificación de Bienes Nacionales, aval formal de Jefatura e inspección en puerta por Seguridad.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M3 21h18M6 10.5h12" />
            </svg>
        ),
        toggles: {
            require_bienes_approval: true,
            require_chief_approval: true,
            require_security_checkpoint: true,
            allow_partial_authorization: true,
        },
    },
    {
        type: "museum",
        title: "Museo / Fundación",
        subtitle: "Jefatura + Control de Seguridad",
        badge: "2 Niveles Físicos",
        description:
            "Gobernanza institucional autónoma. Exime el trámite estatal de Bienes Nacionales, manteniendo aval de Dirección y control físico de Seguridad.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545a.75.75 0 0 0-.45-.693l-8.25-3.3a.75.75 0 0 0-.6 0l-8.25 3.3a.75.75 0 0 0-.45.693V21h4.5" />
            </svg>
        ),
        toggles: {
            require_bienes_approval: false,
            require_chief_approval: true,
            require_security_checkpoint: true,
            allow_partial_authorization: true,
        },
    },
    {
        type: "private_gallery",
        title: "Galería de Arte Comercial",
        subtitle: "Aval Curatorial / Dirección",
        badge: "1 Nivel Ágil",
        description:
            "Operaciones dinámicas de venta o préstamo. Desactiva Bienes y Seguridad física externa; únicamente requiere aval de Dirección o Curador.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
        ),
        toggles: {
            require_bienes_approval: false,
            require_chief_approval: true,
            require_security_checkpoint: false,
            allow_partial_authorization: true,
        },
    },
    {
        type: "collector",
        title: "Coleccionista Privado",
        subtitle: "Aprobación Directa y Trazable",
        badge: "Despacho Inmediato",
        description:
            "Máxima flexibilidad y confidencialidad de acervo propio. Sin burocracia de aprobación intermediaria; los traslados quedan autorizados y auditados al crearse.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
        ),
        toggles: {
            require_bienes_approval: false,
            require_chief_approval: false,
            require_security_checkpoint: false,
            allow_partial_authorization: false,
        },
    },
];

export function WorkflowSettingsView({ initialSettings }: WorkflowSettingsViewProps) {
    const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
    const [savedSettings, setSavedSettings] = useState<OrganizationSettings>(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [notification, setNotification] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const hasChanges =
        settings.organization_name !== savedSettings.organization_name ||
        settings.organization_type !== savedSettings.organization_type ||
        settings.require_bienes_approval !== savedSettings.require_bienes_approval ||
        settings.require_chief_approval !== savedSettings.require_chief_approval ||
        settings.require_security_checkpoint !== savedSettings.require_security_checkpoint ||
        settings.allow_partial_authorization !== savedSettings.allow_partial_authorization;

    // Apply preset
    const handleApplyPreset = (preset: PresetOption) => {
        setSettings((prev) => ({
            ...prev,
            organization_type: preset.type,
            ...preset.toggles,
        }));
        setNotification(null);
    };

    // Toggle specific setting
    const handleToggle = (key: keyof Pick<
        OrganizationSettings,
        | "require_bienes_approval"
        | "require_chief_approval"
        | "require_security_checkpoint"
        | "allow_partial_authorization"
    >) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        setNotification(null);
    };

    // Reset to saved
    const handleReset = () => {
        setSettings(savedSettings);
        setNotification(null);
    };

    // Save changes
    const handleSave = () => {
        if (!settings.organization_name.trim()) {
            setNotification({
                type: "error",
                message: "El nombre de la organización no puede estar vacío.",
            });
            return;
        }

        startTransition(async () => {
            setNotification(null);
            try {
                const res = await updateOrganizationSettings(settings);
                if (res.success && res.data) {
                    setSavedSettings(res.data);
                    setSettings(res.data);
                    setNotification({
                        type: "success",
                        message: "Configuración del motor de flujos guardada y aplicada exitosamente.",
                    });
                } else {
                    setNotification({
                        type: "error",
                        message: res.error || "Ocurrió un error al guardar la configuración.",
                    });
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor.";
                setNotification({
                    type: "error",
                    message,
                });
            }
        });
    };

    // Count active flow gates
    const activeApprovalCount =
        (settings.require_bienes_approval ? 1 : 0) +
        (settings.require_chief_approval ? 1 : 0) +
        (settings.require_security_checkpoint ? 1 : 0);

    return (
        <div className="space-y-10" id="workflow-settings-container">
            {/* Header info */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 items-center rounded-full bg-art-accent-gold/15 px-3 text-xs font-semibold uppercase tracking-wider text-art-accent-gold">
                            Fase 2: Motor Configurable
                        </span>
                        {hasChanges && (
                            <span className="flex h-7 items-center rounded-full bg-amber-500/10 px-3 text-xs font-medium text-amber-700 dark:text-amber-400">
                                Cambios pendientes de guardar
                            </span>
                        )}
                    </div>
                    <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-art-fg-primary sm:text-3xl">
                        Flujo & Políticas de Aprobación
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-art-fg-muted">
                        Personaliza la cadena de custodia y los puntos de control requeridos para la salida física de obras de arte.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isPending}
                            className="rounded-lg border border-art-border bg-art-bg-surface px-4 py-2 text-sm font-medium text-art-fg-secondary transition-colors hover:bg-art-bg-primary hover:text-art-fg-primary disabled:opacity-50"
                        >
                            Descartar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-lg bg-art-accent-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-art-accent-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                        id="save-workflow-settings-btn"
                    >
                        {isPending ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span>Guardar Cambios</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {notification && (
                <div
                    className={`flex items-start justify-between rounded-xl border p-4 transition-all ${
                        notification.type === "success"
                            ? "border-emerald-500/20 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-red-500/20 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200"
                    }`}
                    role="alert"
                >
                    <div className="flex items-center gap-3">
                        {notification.type === "success" ? (
                            <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        )}
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        className="text-xs font-semibold opacity-70 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Section 1: Real-Time Flow Visualizer */}
            <div className="rounded-2xl border border-art-border bg-art-bg-elevated p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-art-accent-gold" />
                            <h3 className="font-serif text-lg font-bold text-art-fg-primary">
                                Simulación de Ruta en Tiempo Real
                            </h3>
                        </div>
                        <p className="text-xs text-art-fg-muted">
                            Ruta secuencial que seguirá cada solicitud de salida patrimonial con la configuración actual.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg bg-art-bg-surface px-3 py-1.5 text-xs font-medium text-art-fg-secondary">
                        <span>Puntos de validación previos al despacho:</span>
                        <span className="rounded-md bg-art-accent-gold/20 px-2 py-0.5 font-bold text-art-accent-gold">
                            {activeApprovalCount === 0 ? "Aprobación Directa (0)" : `${activeApprovalCount} ${activeApprovalCount === 1 ? "Nivel" : "Niveles"}`}
                        </span>
                    </div>
                </div>

                {/* Flow Diagram */}
                <div className="mt-8 overflow-x-auto pb-4">
                    <div className="flex min-w-[760px] items-center justify-between gap-2">
                        {/* Step 1: Request Registration */}
                        <div className="flex flex-1 flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-art-bg-surface text-art-fg-primary ring-2 ring-art-border">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <span className="mt-2.5 text-xs font-bold text-art-fg-primary">1. Solicitud</span>
                            <span className="text-[11px] text-art-fg-muted">Conservador / Editor</span>
                            <span className="mt-1 rounded-full bg-neutral-200/60 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                Origen
                            </span>
                        </div>

                        {/* Connector 1 */}
                        <div className="flex flex-col items-center">
                            <div className={`h-0.5 w-10 sm:w-16 transition-colors ${settings.require_bienes_approval ? "bg-art-accent-gold" : "border-t border-dashed border-neutral-300 dark:border-neutral-700"}`} />
                            <span className="text-xs text-art-accent-gold">➜</span>
                        </div>

                        {/* Step 2: Bienes Nacionales */}
                        <div className={`flex flex-1 flex-col items-center text-center transition-all ${!settings.require_bienes_approval ? "opacity-35" : ""}`}>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                                    settings.require_bienes_approval
                                        ? "bg-art-accent-gold/15 text-art-accent-gold ring-2 ring-art-accent-gold shadow-sm"
                                        : "bg-art-bg-surface text-art-fg-muted ring-1 ring-art-border"
                                }`}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M3 21h18M6 10.5h12" />
                                </svg>
                            </div>
                            <span className="mt-2.5 text-xs font-bold text-art-fg-primary">Bienes Nacionales</span>
                            <span className="text-[11px] text-art-fg-muted">Custodio Estatal</span>
                            <span
                                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    settings.require_bienes_approval
                                        ? "bg-art-accent-gold/20 text-art-accent-gold font-semibold"
                                        : "bg-neutral-200/50 text-neutral-400 line-through dark:bg-neutral-800"
                                }`}
                            >
                                {settings.require_bienes_approval ? "Fase 1: Jurídico" : "Omitido"}
                            </span>
                        </div>

                        {/* Connector 2 */}
                        <div className="flex flex-col items-center">
                            <div className={`h-0.5 w-10 sm:w-16 transition-colors ${settings.require_chief_approval ? "bg-art-accent-gold" : "border-t border-dashed border-neutral-300 dark:border-neutral-700"}`} />
                            <span className="text-xs text-art-accent-gold">➜</span>
                        </div>

                        {/* Step 3: Jefatura */}
                        <div className={`flex flex-1 flex-col items-center text-center transition-all ${!settings.require_chief_approval ? "opacity-35" : ""}`}>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                                    settings.require_chief_approval
                                        ? "bg-art-accent-gold/15 text-art-accent-gold ring-2 ring-art-accent-gold shadow-sm"
                                        : "bg-art-bg-surface text-art-fg-muted ring-1 ring-art-border"
                                }`}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                            <span className="mt-2.5 text-xs font-bold text-art-fg-primary">Jefatura / Dirección</span>
                            <span className="text-[11px] text-art-fg-muted">Firma & Aval</span>
                            <span
                                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    settings.require_chief_approval
                                        ? "bg-art-accent-gold/20 text-art-accent-gold font-semibold"
                                        : "bg-neutral-200/50 text-neutral-400 line-through dark:bg-neutral-800"
                                }`}
                            >
                                {settings.require_chief_approval ? "Fase 2: Institucional" : "Omitido"}
                            </span>
                        </div>

                        {/* Connector 3 */}
                        <div className="flex flex-col items-center">
                            <div className={`h-0.5 w-10 sm:w-16 transition-colors ${settings.require_security_checkpoint ? "bg-art-accent-gold" : "border-t border-dashed border-neutral-300 dark:border-neutral-700"}`} />
                            <span className="text-xs text-art-accent-gold">➜</span>
                        </div>

                        {/* Step 4: Security Checkpoint */}
                        <div className={`flex flex-1 flex-col items-center text-center transition-all ${!settings.require_security_checkpoint ? "opacity-35" : ""}`}>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                                    settings.require_security_checkpoint
                                        ? "bg-art-accent-gold/15 text-art-accent-gold ring-2 ring-art-accent-gold shadow-sm"
                                        : "bg-art-bg-surface text-art-fg-muted ring-1 ring-art-border"
                                }`}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <span className="mt-2.5 text-xs font-bold text-art-fg-primary">Checkpoint Seguridad</span>
                            <span className="text-[11px] text-art-fg-muted">Verificación Física / QR</span>
                            <span
                                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    settings.require_security_checkpoint
                                        ? "bg-art-accent-gold/20 text-art-accent-gold font-semibold"
                                        : "bg-neutral-200/50 text-neutral-400 line-through dark:bg-neutral-800"
                                }`}
                            >
                                {settings.require_security_checkpoint ? "Fase 3: Puerta" : "Omitido"}
                            </span>
                        </div>

                        {/* Connector 4 */}
                        <div className="flex flex-col items-center">
                            <div className="h-0.5 w-10 sm:w-16 bg-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">➜</span>
                        </div>

                        {/* Step 5: Final Authorized Dispatch */}
                        <div className="flex flex-1 flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500 shadow-sm dark:text-emerald-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 3.75v10.5" />
                                </svg>
                            </div>
                            <span className="mt-2.5 text-xs font-bold text-art-fg-primary">Salida Autorizada</span>
                            <span className="text-[11px] text-art-fg-muted">Custodia en Tránsito</span>
                            <span className="mt-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                Despacho
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub-indicator: Partial Authorization */}
                <div className="mt-5 flex items-center justify-between border-t border-art-border pt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${settings.allow_partial_authorization ? "bg-emerald-500" : "bg-neutral-400"}`} />
                        <span className="text-art-fg-secondary">
                            Modalidad de Autorización de Obras:
                        </span>
                        <strong className="text-art-fg-primary">
                            {settings.allow_partial_authorization
                                ? "Fraccionada / Parcial (se autorizan obras individuales de un lote)"
                                : "Lote Completo (requiere autorización de todas las piezas o rechazo total)"}
                        </strong>
                    </div>

                    <span className="text-art-fg-muted">
                        Tipo actual: <strong className="uppercase text-art-accent-gold">{settings.organization_type}</strong>
                    </span>
                </div>
            </div>

            {/* Section 2: Organization Name */}
            <div className="rounded-2xl border border-art-border bg-art-bg-elevated p-6 shadow-sm">
                <div className="max-w-xl">
                    <label htmlFor="organization-name" className="block font-serif text-base font-bold text-art-fg-primary">
                        Nombre de la Organización / Institución
                    </label>
                    <p className="mt-1 text-xs text-art-fg-muted">
                        Identificador oficial reflejado en actas de entrega, guías de traslado y documentos de salida patrimonial.
                    </p>
                    <div className="mt-3">
                        <input
                            id="organization-name"
                            type="text"
                            value={settings.organization_name}
                            onChange={(e) => {
                                setSettings((prev) => ({
                                    ...prev,
                                    organization_name: e.target.value,
                                }));
                                setNotification(null);
                            }}
                            placeholder="Ej: Galería de Arte Nacional, Museo Histórico..."
                            className="w-full rounded-xl border border-art-border bg-art-bg-surface px-4 py-2.5 text-sm font-medium text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: 1-Click Preset Archetypes */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-serif text-lg font-bold text-art-fg-primary">
                        Presets de Organización (Configuración en 1 Clic)
                    </h3>
                    <p className="text-xs text-art-fg-muted">
                        Selecciona el perfil institucional que mejor se adapte al marco regulatorio de tu entidad.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {PRESETS.map((preset) => {
                        const isSelected = settings.organization_type === preset.type;

                        return (
                            <button
                                key={preset.type}
                                type="button"
                                onClick={() => handleApplyPreset(preset)}
                                className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all hover:border-art-accent-gold hover:shadow-md ${
                                    isSelected
                                        ? "border-art-accent-gold bg-art-accent-gold/5 ring-1 ring-art-accent-gold"
                                        : "border-art-border bg-art-bg-elevated"
                                }`}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                                isSelected
                                                    ? "bg-art-accent-gold text-white"
                                                    : "bg-art-bg-surface text-art-fg-secondary"
                                            }`}
                                        >
                                            {preset.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-serif text-sm font-bold text-art-fg-primary">
                                                {preset.title}
                                            </h4>
                                            <p className="text-xs text-art-accent-gold">
                                                {preset.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            isSelected
                                                ? "bg-art-accent-gold text-white"
                                                : "bg-art-bg-surface text-art-fg-muted"
                                        }`}
                                    >
                                        {preset.badge}
                                    </span>
                                </div>

                                <p className="mt-3 text-xs leading-relaxed text-art-fg-muted">
                                    {preset.description}
                                </p>

                                <div className="mt-4 flex w-full items-center justify-between border-t border-art-border/60 pt-3 text-[11px]">
                                    <span className="text-art-fg-secondary">
                                        Bienes: {preset.toggles.require_bienes_approval ? "✓" : "✗"} · Jefe: {preset.toggles.require_chief_approval ? "✓" : "✗"} · Seguridad: {preset.toggles.require_security_checkpoint ? "✓" : "✗"}
                                    </span>
                                    {isSelected ? (
                                        <span className="font-semibold text-art-accent-gold">
                                            ● Seleccionado
                                        </span>
                                    ) : (
                                        <span className="font-medium text-art-fg-muted">
                                            Aplicar preset ➔
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Section 4: Individual Policy Toggles */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-serif text-lg font-bold text-art-fg-primary">
                        Puntos de Control & Moduladores Específicos
                    </h3>
                    <p className="text-xs text-art-fg-muted">
                        Ajusta de forma granular las puertas de autorización sin alterar la integridad de los registros.
                    </p>
                </div>

                <div className="divide-y divide-art-border rounded-2xl border border-art-border bg-art-bg-elevated shadow-sm">
                    {/* Toggle 1: Bienes Nacionales */}
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-art-fg-primary">
                                    Aprobación previa por Bienes Nacionales
                                </span>
                                <span className="rounded-md bg-art-bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-art-fg-muted">
                                    require_bienes_approval
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-art-fg-muted">
                                Exige que la solicitud sea dictaminada y aprobada por los custodios de Bienes Nacionales antes de llegar a la Jefatura.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.require_bienes_approval}
                            onClick={() => handleToggle("require_bienes_approval")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 ${
                                settings.require_bienes_approval ? "bg-art-accent-gold" : "bg-neutral-300 dark:bg-neutral-700"
                            }`}
                            id="toggle-bienes-approval"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.require_bienes_approval ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Toggle 2: Chief Approval */}
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-art-fg-primary">
                                    Aval obligatorio por Jefatura / Dirección
                                </span>
                                <span className="rounded-md bg-art-bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-art-fg-muted">
                                    require_chief_approval
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-art-fg-muted">
                                Requiere la firma digital institucional y el visto bueno del Jefe de Dependencia o Director General para formalizar el movimiento.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.require_chief_approval}
                            onClick={() => handleToggle("require_chief_approval")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 ${
                                settings.require_chief_approval ? "bg-art-accent-gold" : "bg-neutral-300 dark:bg-neutral-700"
                            }`}
                            id="toggle-chief-approval"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.require_chief_approval ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Toggle 3: Security Checkpoint */}
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-art-fg-primary">
                                    Punto de control e inspección por Seguridad
                                </span>
                                <span className="rounded-md bg-art-bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-art-fg-muted">
                                    require_security_checkpoint
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-art-fg-muted">
                                Obliga a que los oficiales de seguridad física verifiquen la obra, embalaje y precinto en puerta antes de habilitar la salida.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.require_security_checkpoint}
                            onClick={() => handleToggle("require_security_checkpoint")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 ${
                                settings.require_security_checkpoint ? "bg-art-accent-gold" : "bg-neutral-300 dark:bg-neutral-700"
                            }`}
                            id="toggle-security-checkpoint"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.require_security_checkpoint ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Toggle 4: Allow Partial Authorization */}
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-art-fg-primary">
                                    Permitir autorización parcial de obras
                                </span>
                                <span className="rounded-md bg-art-bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-art-fg-muted">
                                    allow_partial_authorization
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-art-fg-muted">
                                Habilita que el aprobador autorice solo un subconjunto de obras de una solicitud múltiple, separando las no autorizadas.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.allow_partial_authorization}
                            onClick={() => handleToggle("allow_partial_authorization")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-art-accent-gold/40 ${
                                settings.allow_partial_authorization ? "bg-art-accent-gold" : "bg-neutral-300 dark:bg-neutral-700"
                            }`}
                            id="toggle-partial-authorization"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.allow_partial_authorization ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
