/**
 * SettingsForm — Client component for admin configuration.
 * Sections:
 * 1. Institution branding (name, document title, logo URL)
 * 2. Master password setup
 */
"use client";

import { useState, useEffect } from "react";

export function SettingsForm() {
    const [settings, setSettings] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Master password
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const { getSettingsAction } = await import(
                "@/modules/admin/actions/settingsActions"
            );
            const result = await getSettingsAction();
            if (result.success && result.settings) {
                setSettings(result.settings);
            }
            setLoading(false);
        }
        loadSettings();
    }, []);

    async function handleSaveSetting(key: string, value: string) {
        setSaving(key);
        setSuccess(null);

        const { updateSettingAction } = await import(
            "@/modules/admin/actions/settingsActions"
        );
        const result = await updateSettingAction(key, value);

        if (result.success) {
            setSettings((prev) => ({ ...prev, [key]: value }));
            setSuccess(key);
            setTimeout(() => setSuccess(null), 2000);
        }

        setSaving(null);
    }

    async function handleSetMasterPassword() {
        if (newPassword.length < 6) {
            setPasswordError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden.");
            return;
        }

        setPasswordSaving(true);
        setPasswordError(null);

        const { setMasterPasswordAction } = await import(
            "@/modules/admin/actions/settingsActions"
        );
        const result = await setMasterPasswordAction(newPassword);

        if (!result.success) {
            setPasswordError(result.error ?? "Error desconocido.");
        } else {
            setPasswordSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(false), 3000);
        }

        setPasswordSaving(false);
    }

    function SettingField({
        label,
        settingKey,
        placeholder,
        description,
    }: {
        label: string;
        settingKey: string;
        placeholder: string;
        description?: string;
    }) {
        const [localValue, setLocalValue] = useState(settings[settingKey] ?? "");

        useEffect(() => {
            setLocalValue(settings[settingKey] ?? "");
        }, [settings[settingKey]]);

        return (
            <div>
                <label className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                    {label}
                </label>
                {description && (
                    <p className="mb-2 text-xs text-art-fg-muted">{description}</p>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 rounded-lg border border-art-border bg-art-bg-primary px-3 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                    />
                    <button
                        type="button"
                        onClick={() => handleSaveSetting(settingKey, localValue)}
                        disabled={saving === settingKey || localValue === (settings[settingKey] ?? "")}
                        className="shrink-0 rounded-lg bg-art-accent-gold px-4 py-2 text-sm font-medium text-white transition-all hover:bg-art-accent-gold-dark disabled:opacity-40"
                    >
                        {saving === settingKey ? "…" : success === settingKey ? "✓" : "Guardar"}
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-art-bg-secondary" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ─── Branding Section ─── */}
            <div className="rounded-2xl border border-art-border bg-art-bg-primary p-6">
                <h2 className="mb-1 font-serif text-lg font-semibold text-art-fg-primary">
                    Identidad Institucional
                </h2>
                <p className="mb-6 text-xs text-art-fg-muted">
                    Estos datos se usarán en los encabezados de las fichas técnicas y los PDF exportados.
                </p>

                <div className="space-y-5">
                    <SettingField
                        label="Nombre de la Institución"
                        settingKey="institution_name"
                        placeholder="Ej: Dirección de Patrimonio Cultural"
                    />
                    <SettingField
                        label="Título del Documento"
                        settingKey="document_title"
                        placeholder="Ej: Ficha de registro general"
                        description="Aparecerá como título en los PDF generados."
                    />
                    <SettingField
                        label="URL del Logo"
                        settingKey="institution_logo_url"
                        placeholder="https://..."
                        description="Sube el logo a Supabase Storage o usa una URL pública. Se mostrará en el encabezado de los PDF."
                    />
                </div>
            </div>

            {/* ─── Master Password Section ─── */}
            <div className="rounded-2xl border border-art-border bg-art-bg-primary p-6">
                <h2 className="mb-1 font-serif text-lg font-semibold text-art-fg-primary">
                    Contraseña Maestra
                </h2>
                <p className="mb-6 text-xs text-art-fg-muted">
                    Se requiere para confirmar la eliminación de registros. Solo los administradores pueden configurarla.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-art-fg-secondary">
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repetir contraseña"
                            className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                        />
                    </div>

                    {passwordError && (
                        <p className="text-xs text-art-danger">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                        <p className="text-xs text-emerald-600">✓ Contraseña maestra actualizada correctamente.</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSetMasterPassword}
                        disabled={passwordSaving || !newPassword || !confirmPassword}
                        className="rounded-lg bg-art-accent-gold px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-art-accent-gold-dark disabled:opacity-50"
                    >
                        {passwordSaving ? "Guardando…" : "Establecer Contraseña Maestra"}
                    </button>
                </div>
            </div>
        </div>
    );
}
