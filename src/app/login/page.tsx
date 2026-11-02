/**
 * Login Page — Server Component with client-side form.
 */
import { LoginForm } from "@/modules/admin/components/LoginForm";

export const metadata = {
    title: "Iniciar Sesión — ArtVault",
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-art-bg-secondary px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-art-accent-gold shadow-lg">
                        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                        </svg>
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-art-fg-primary">
                        ArtVault
                    </h1>
                    <p className="mt-1 text-sm text-art-fg-muted">
                        Sistema de Gestión de Colecciones
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-xl border border-art-border bg-art-bg-elevated p-8 shadow-[var(--art-shadow-lg)]">
                    <LoginForm />
                </div>

                {/* Back to catalog */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-sm text-art-fg-muted transition-colors hover:text-art-accent-gold"
                    >
                        ← Volver al catálogo
                    </a>
                </div>
            </div>
        </div>
    );
}
