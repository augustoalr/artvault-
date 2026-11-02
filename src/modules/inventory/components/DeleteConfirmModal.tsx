/**
 * DeleteConfirmModal — Modal that requires master password to confirm deletion.
 * The modal verifies the password server-side before executing the delete.
 */
"use client";

import { useState, useEffect, useRef } from "react";

interface DeleteConfirmModalProps {
    /** Whether the modal is visible */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Artwork title for display */
    artworkTitle: string;
    /** Artwork ID to delete */
    artworkId: string;
    /** Callback after successful deletion */
    onDeleted: () => void;
}

export function DeleteConfirmModal({
    isOpen,
    onClose,
    artworkTitle,
    artworkId,
    onDeleted,
}: DeleteConfirmModalProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setPassword("");
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && isOpen) onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    async function handleConfirm() {
        if (!password.trim()) {
            setError("Ingrese la contraseña maestra.");
            return;
        }

        setDeleting(true);
        setError(null);

        const { deleteWithMasterPasswordAction } = await import(
            "@/modules/admin/actions/settingsActions"
        );

        const result = await deleteWithMasterPasswordAction(artworkId, password);

        if (!result.success) {
            setError(result.error ?? "Error desconocido.");
            setDeleting(false);
            return;
        }

        setDeleting(false);
        onDeleted();
        onClose();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleConfirm();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative mx-4 w-full max-w-md rounded-2xl border border-art-border bg-art-bg-primary p-6 shadow-2xl">
                {/* Warning icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-500"
                    >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" x2="12" y1="9" y2="13" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                    </svg>
                </div>

                <h3 className="text-center font-serif text-lg font-bold text-art-fg-primary">
                    Confirmar Eliminación
                </h3>
                <p className="mt-2 text-center text-sm text-art-fg-secondary">
                    Estás a punto de eliminar la obra:
                </p>
                <p className="mt-1 text-center font-serif text-base font-semibold text-art-fg-primary">
                    &ldquo;{artworkTitle}&rdquo;
                </p>

                <div className="mt-5">
                    <label
                        htmlFor="master-password"
                        className="mb-1.5 block text-sm font-medium text-art-fg-secondary"
                    >
                        Contraseña Maestra
                    </label>
                    <input
                        ref={inputRef}
                        id="master-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ingrese la contraseña maestra…"
                        disabled={deleting}
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    {error && (
                        <p className="mt-2 text-xs text-art-danger">{error}</p>
                    )}
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 rounded-lg border border-art-border px-4 py-2.5 text-sm font-medium text-art-fg-secondary transition-all hover:border-art-fg-muted"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={deleting || !password.trim()}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
                    >
                        {deleting ? "Eliminando…" : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
