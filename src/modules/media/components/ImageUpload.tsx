/**
 * ImageUpload — Client component for uploading artwork images.
 * Features:
 * - Drag & drop + click to upload
 * - Auto-compression with progress indicator
 * - Preview with delete option
 * - Persists to media_assets table
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { uploadArtworkImage, deleteArtworkImage } from "@/modules/media/services/imageService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ImageUploadProps {
    artworkId: string;
    /** Label for the upload area */
    label?: string;
    /** Storage path suffix (e.g. "primary", "conservation_left") */
    suffix?: string;
    /** Whether this is the primary image */
    isPrimary?: boolean;
    /** Existing image URL to show as preview */
    existingUrl?: string;
    /** Existing storage path for deletion */
    existingPath?: string;
    /** Callback after successful upload */
    onUploadComplete?: (publicUrl: string, storagePath: string) => void;
    /** Callback after successful deletion */
    onDeleteComplete?: () => void;
    /** Max height of the container */
    maxHeight?: string;
    /** Callback when file is selected (for new artworks, delays upload) */
    onFileSelect?: (file: File) => void;
    /** Whether the component is read-only */
    readOnly?: boolean;
}

type UploadState = "idle" | "compressing" | "uploading" | "done" | "error";

export function ImageUpload({
    artworkId,
    label = "Fotografía",
    suffix,
    isPrimary = false,
    existingUrl,
    existingPath,
    onUploadComplete,
    onDeleteComplete,
    onFileSelect,
    maxHeight = "340px",
    readOnly = false,
}: ImageUploadProps) {
    const [state, setState] = useState<UploadState>(existingUrl ? "done" : "idle");
    const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
    const [storagePath, setStoragePath] = useState<string | null>(existingPath ?? null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        // Validate type
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Solo se permiten imágenes JPG, PNG o WebP.");
            return;
        }

        setError(null);
        setCompressionInfo(null);

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setPreview(localUrl);

        // If onFileSelect is provided, we are in "controlled" mode (creation).
        // Pass the file up and stop. The parent handles the upload later.
        if (onFileSelect) {
            onFileSelect(file);
            setState("done"); // Visually "done" selecting
            return;
        }

        // --- Immediate Upload Mode (Editing) ---

        // Compression phase
        setState("compressing");
        const originalKb = Math.round(file.size / 1024);

        // Upload (includes compression)
        setState("uploading");
        const result = await uploadArtworkImage(file, artworkId, suffix);

        if (!result.success) {
            setError(result.error ?? "Error al subir la imagen.");
            setState("error");
            return;
        }

        // Save to media_assets
        const supabase = getSupabaseBrowserClient();
        await supabase.from("media_assets").insert({
            artwork_id: artworkId,
            storage_path: result.storagePath!,
            file_type: "image/jpeg",
            size_kb: result.sizeKb,
            is_primary: isPrimary,
        });

        // Show compression info
        if (result.sizeKb && result.sizeKb < originalKb) {
            setCompressionInfo(
                `Optimizada: ${originalKb}KB → ${result.sizeKb}KB`
            );
        }

        setPreview(result.publicUrl!);
        setStoragePath(result.storagePath!);
        setState("done");
        onUploadComplete?.(result.publicUrl!, result.storagePath!);
    }, [artworkId, suffix, isPrimary, onUploadComplete, onFileSelect]);

    async function handleDelete() {
        if (!storagePath) return;

        // Delete from storage
        await deleteArtworkImage(storagePath);

        // Delete from media_assets
        const supabase = getSupabaseBrowserClient();
        await supabase
            .from("media_assets")
            .delete()
            .eq("storage_path", storagePath);

        setPreview(null);
        setStoragePath(null);
        setCompressionInfo(null);
        setState("idle");
        onDeleteComplete?.();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset so same file can be re-selected
        e.target.value = "";
    }

    // ─── States ───

    if (state === "done" && preview) {
        return (
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                    {label}
                </p>
                <div
                    className="group relative overflow-hidden rounded-xl border border-art-border"
                    style={{ maxHeight }}
                >
                    <img
                        src={preview}
                        alt={label}
                        className="h-full w-full object-cover"
                        style={{ maxHeight }}
                    />
                    {/* Overlay - Hide if readOnly */}
                    {!readOnly && (
                        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-art-fg-primary transition-all hover:bg-white"
                            >
                                Cambiar
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-600"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
                {compressionInfo && (
                    <p className="text-[10px] text-art-success">{compressionInfo}</p>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                />
            </div>
        );
    }

    const isProcessing = state === "compressing" || state === "uploading";

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-art-fg-muted">
                {label}
            </p>
            <div
                onClick={() => !isProcessing && !readOnly && inputRef.current?.click()}
                onDragOver={(e) => { if (!readOnly) { e.preventDefault(); setDragOver(true); } }}
                onDragLeave={() => setDragOver(false)}
                onDrop={readOnly ? undefined : handleDrop}
                className={`flex items-center justify-center rounded-xl border-2 border-dashed transition-all ${!readOnly ? "cursor-pointer" : "cursor-default"} ${dragOver
                    ? "border-art-accent-gold bg-art-accent-gold/5"
                    : "border-art-border bg-art-bg-secondary/50 " + (!readOnly ? "hover:border-art-accent-gold/30" : "")
                    } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
                style={{ height: maxHeight }}
            >
                <div className="space-y-2 text-center px-4">
                    {isProcessing ? (
                        <>
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-art-accent-gold border-t-transparent" />
                            <p className="text-xs font-medium text-art-accent-gold">
                                {state === "compressing" ? "Optimizando imagen…" : "Subiendo…"}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-art-bg-secondary text-art-fg-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                            </div>
                            <p className="text-xs text-art-fg-muted">
                                Arrastra o haz clic para subir
                            </p>
                            <p className="text-[10px] text-art-fg-muted/60">
                                JPG, PNG, WebP — Se optimizará automáticamente
                            </p>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <p className="text-xs text-art-danger">{error}</p>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
}
