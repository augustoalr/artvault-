"use client";

import { SignaturePayload } from "./DualSignaturePad";

interface ChiefSnapshotFormProps {
    chiefName: string;
    onChiefNameChange: (val: string) => void;
    chiefIdNumber: string;
    onChiefIdNumberChange: (val: string) => void;
    chiefDepartment: string;
    onChiefDepartmentChange: (val: string) => void;
    signature: SignaturePayload | null;
    onOpenSignatureModal: () => void;
}

export function ChiefSnapshotForm({
    chiefName,
    onChiefNameChange,
    chiefIdNumber,
    onChiefIdNumberChange,
    chiefDepartment,
    onChiefDepartmentChange,
    signature,
    onOpenSignatureModal,
}: ChiefSnapshotFormProps) {
    return (
        <div className="rounded-xl border border-art-border bg-art-bg-elevated p-5 shadow-art-sm space-y-4">
            <div className="flex items-center justify-between border-b border-art-border pb-3">
                <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-art-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="font-serif text-sm font-bold text-art-fg-primary">
                        Datos del Jefe Autorizante (Snapshot Oficial)
                    </h3>
                </div>
                <span className="text-[11px] text-art-fg-muted">
                    Quedarán registrados en el acta de traslado
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre */}
                <div>
                    <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                        Nombre y Apellido <span className="text-art-color-danger">*</span>
                    </label>
                    <input
                        type="text"
                        value={chiefName}
                        onChange={(e) => onChiefNameChange(e.target.value)}
                        placeholder="Ej. Dra. María González"
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none transition-colors"
                        required
                    />
                </div>

                {/* Cédula / Documento de Identidad */}
                <div>
                    <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                        Cédula de Identidad / DNI <span className="text-art-color-danger">*</span>
                    </label>
                    <input
                        type="text"
                        value={chiefIdNumber}
                        onChange={(e) => onChiefIdNumberChange(e.target.value)}
                        placeholder="Ej. V-12.345.678"
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none transition-colors"
                        required
                    />
                </div>

                {/* Dependencia / Departamento */}
                <div>
                    <label className="block text-xs font-semibold text-art-fg-secondary mb-1">
                        Dependencia / Dirección <span className="text-art-color-danger">*</span>
                    </label>
                    <input
                        type="text"
                        value={chiefDepartment}
                        onChange={(e) => onChiefDepartmentChange(e.target.value)}
                        placeholder="Ej. Dirección de Patrimonio Cultural"
                        className="w-full rounded-lg border border-art-border bg-art-bg-primary px-3 py-2 text-xs text-art-fg-primary focus:border-art-accent-gold focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            {/* Signature Box */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-art-border/80 bg-art-bg-surface/40 p-4">
                <div className="flex items-center gap-4">
                    {signature?.dataUrl ? (
                        <div className="h-16 w-36 rounded border border-art-border bg-white p-1 flex items-center justify-center overflow-hidden shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={signature.dataUrl}
                                alt="Firma digital"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-36 items-center justify-center rounded border border-dashed border-art-border bg-art-bg-surface text-center p-2">
                            <span className="text-[10px] text-art-fg-muted">Sin firma capturada</span>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    signature
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                }`}
                            >
                                {signature ? "✓ Firma Lista" : "Pendiente de firma"}
                            </span>
                            {signature && (
                                <span className="text-[11px] text-art-fg-muted capitalize">
                                    ({signature.method === "canvas" ? "Trazada en pantalla" : "Sello adjunto"})
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-art-fg-secondary mt-1">
                            {signature
                                ? "La firma se estampará digitalmente en el Acta Oficial PDF."
                                : "Debes registrar tu rúbrica o sello institucional para autorizar la solicitud."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenSignatureModal}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-art-accent-gold px-3.5 py-2 text-xs font-semibold text-art-accent-gold-dark hover:bg-art-accent-gold/10 transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {signature ? "Modificar Firma" : "Gestionar Firma Digital"}
                </button>
            </div>
        </div>
    );
}
