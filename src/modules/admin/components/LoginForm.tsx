/**
 * LoginForm — Client Component
 * Handles login AND signup via Server Actions.
 * Togglable between "login" and "register" modes.
 */
"use client";

import { useState } from "react";
import { loginAction, signupAction } from "@/modules/admin/actions/authActions";

type Mode = "login" | "register";

export function LoginForm() {
    const [mode, setMode] = useState<Mode>("login");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (mode === "login") {
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
                setLoading(false);
            }
        } else {
            const result = await signupAction(formData);
            if (result?.error) {
                setError(result.error);
                setLoading(false);
            } else {
                setSuccess(
                    "¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta."
                );
                setLoading(false);
            }
        }
    }

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setError(null);
        setSuccess(null);
    };

    return (
        <form action={handleSubmit} className="space-y-5">
            <h2 className="text-center font-serif text-lg font-semibold text-art-fg-primary">
                {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>

            {/* Full Name — only in register mode */}
            {mode === "register" && (
                <div>
                    <label
                        htmlFor="full_name"
                        className="mb-1.5 block text-sm font-medium text-art-fg-secondary"
                    >
                        Nombre completo
                    </label>
                    <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-4 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                        placeholder="Tu nombre completo"
                    />
                </div>
            )}

            <div>
                <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-art-fg-secondary"
                >
                    Correo electrónico
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-art-border bg-art-bg-primary px-4 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                    placeholder="tu@correo.com"
                />
            </div>

            <div>
                <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-art-fg-secondary"
                >
                    Contraseña
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={6}
                    className="w-full rounded-lg border border-art-border bg-art-bg-primary px-4 py-2.5 text-sm text-art-fg-primary placeholder:text-art-fg-muted transition-colors focus:border-art-accent-gold focus:outline-none focus:ring-2 focus:ring-art-accent-gold/20"
                    placeholder="••••••••"
                />
                {mode === "register" && (
                    <p className="mt-1 text-xs text-art-fg-muted">
                        Mínimo 6 caracteres
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div
                    className="rounded-lg bg-red-50 px-4 py-3 text-sm text-art-danger"
                    id="auth-error"
                >
                    {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div
                    className="rounded-lg bg-green-50 px-4 py-3 text-sm text-art-success"
                    id="auth-success"
                >
                    {success}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-art-accent-gold px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-art-accent-gold-dark focus:outline-none focus:ring-2 focus:ring-art-accent-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                id="auth-submit"
            >
                {loading ? (
                    <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                        />
                        <path
                            fill="currentColor"
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                ) : mode === "login" ? (
                    "Iniciar Sesión"
                ) : (
                    "Registrarse"
                )}
            </button>

            {/* Toggle mode */}
            <div className="text-center">
                <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-art-fg-muted transition-colors hover:text-art-accent-gold"
                    id="toggle-auth-mode"
                >
                    {mode === "login"
                        ? "¿No tienes cuenta? Regístrate"
                        : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
            </div>
        </form>
    );
}
