/**
 * BackupManager — Component for managing system backups.
 * Allows generating JSON backups and restoring them via file upload + master password.
 */
"use client";

import { useState, useRef } from "react";
import { generateBackupAction, restoreBackupAction } from "@/modules/admin/actions/backupActions";

export function BackupManager() {
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<"backup" | "restore" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleGenerateBackup() {
        setLoading(true);
        setAction("backup");
        setError(null);
        setSuccess(null);

        try {
            const result = await generateBackupAction();

            if (!result.success || !result.backup) {
                throw new Error(result.error || "No se pudo generar la copia.");
            }

            // Create blob and download
            const json = JSON.stringify(result.backup, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `artvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess("Copia de seguridad descargada correctamente.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
            setAction(null);
        }
    }

    async function handleRestore() {
        if (!restoreFile || !password) {
            setError("Seleccione un archivo JSON y escriba la contraseña maestra.");
            return;
        }

        setLoading(true);
        setAction("restore");
        setError(null);
        setSuccess(null);

        try {
            // Read file
            const text = await restoreFile.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("El archivo no es un JSON válido.");
            }

            // Validate schema roughly
            if (!data.data || !data.version) {
                throw new Error("El archivo no tiene el formato de backup de ArtVault.");
            }

            const result = await restoreBackupAction(data, password); // Passed as object

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess("Sistema restaurado correctamente. Recargue la página para ver los cambios.");
            setRestoreFile(null);
            setPassword("");
            if (fileInputRef.current) fileInputRef.current.value = "";

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error durante la restauración");
        } finally {
            setLoading(false);
            setAction(null);
        }
    }

    return (
        <div className="rounded-2xl border border-art-border bg-art-bg-primary p-6">
            <h2 className="mb-1 font-serif text-lg font-semibold text-art-fg-primary">
                Respaldo y Restauración
            </h2>
            <p className="mb-6 text-xs text-art-fg-muted">
                Genera copias de seguridad de la base de datos o restaura datos previos.
                <br />
                <span className="text-art-danger font-medium">Nota: Restaurar sobrescribirá los datos existentes si coinciden los IDs.</span>
            </p>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Export Column */}
                <div className="space-y-4 rounded-xl border border-art-border bg-art-bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-art-fg-primary">Exportar Datos</h3>
                            <p className="text-xs text-art-fg-muted">JSON comprimido</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateBackup}
                        disabled={loading}
                        className="w-full rounded-lg bg-white border border-art-border px-4 py-2 text-sm font-medium text-art-fg-secondary shadow-sm transition-all hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                    >
                        {loading && action === "backup" ? "Generando..." : "Descargar Copia de Seguridad"}
                    </button>
                </div>

                {/* Import Column */}
                <div className="space-y-4 rounded-xl border border-art-border bg-art-bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-art-fg-primary">Restaurar Datos</h3>
                            <p className="text-xs text-art-fg-muted">Requiere contraseña maestra</p>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-art-fg-muted file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {restoreFile && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña Maestra"
                                className="w-full rounded-lg border border-art-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <button
                                onClick={handleRestore}
                                disabled={loading || !password}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading && action === "restore" ? "Restaurando..." : "Confirmar Restauración"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                    ⚠ {error}
                </div>
            )}
            {success && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-100">
                    ✓ {success}
                </div>
            )}
        </div>
    );
}
