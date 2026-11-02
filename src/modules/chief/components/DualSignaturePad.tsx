"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

export interface SignaturePayload {
    blob: Blob;
    dataUrl: string;
    file?: File;
    method: "canvas" | "upload";
}

interface DualSignaturePadProps {
    onSignatureChange?: (payload: SignaturePayload | null) => void;
    initialDataUrl?: string | null;
    width?: number;
    height?: number;
}

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
}

type TabMode = "canvas" | "upload";

export function DualSignaturePad({
    onSignatureChange,
    initialDataUrl = null,
    width = 540,
    height = 220,
}: DualSignaturePadProps) {
    const [activeTab, setActiveTab] = useState<TabMode>("canvas");

    // Canvas drawing states
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [hasDrawnContent, setHasDrawnContent] = useState(false);

    // Upload states
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedPreview, setUploadedPreview] = useState<string | null>(initialDataUrl);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ─── Canvas Redraw Engine ────────────────────────────────────────────────

    const redrawCanvas = useCallback(
        (strokesToDraw: Stroke[]) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Clear full canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw all strokes
            strokesToDraw.forEach((stroke) => {
                if (stroke.points.length === 0) return;
                ctx.beginPath();
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                if (stroke.points.length === 1) {
                    ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
                    ctx.fillStyle = stroke.color;
                    ctx.fill();
                    return;
                }

                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    const p1 = stroke.points[i - 1];
                    const p2 = stroke.points[i];
                    // Quadratic curve for smoother stroke
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                }
                const lastPoint = stroke.points[stroke.points.length - 1];
                ctx.lineTo(lastPoint.x, lastPoint.y);
                ctx.stroke();
            });
        },
        []
    );

    // Synchronize canvas export to parent
    const exportCanvasSignature = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || strokes.length === 0) {
            onSignatureChange?.(null);
            return;
        }

        canvas.toBlob((blob) => {
            if (!blob) return;
            const dataUrl = canvas.toDataURL("image/png");
            onSignatureChange?.({
                blob,
                dataUrl,
                method: "canvas",
            });
        }, "image/png");
    }, [strokes, onSignatureChange]);

    // Handle initial canvas setup and DPI scaling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        redrawCanvas(strokes);
    }, [width, height, redrawCanvas, strokes]);

    // Coordinate resolution for mouse and touch
    const getCanvasCoordinates = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ("touches" in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    // ─── Drawing Event Handlers ──────────────────────────────────────────────

    const handleStartDrawing = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        e.preventDefault();
        const point = getCanvasCoordinates(e);
        if (!point) return;

        setIsDrawing(true);
        const newStroke: Stroke = {
            points: [point],
            color: "#0F172A", // Deep Museum Ink
            width: 2.5,
        };
        setCurrentStroke(newStroke);
    };

    const handleContinueDrawing = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        if (!isDrawing || !currentStroke) return;
        e.preventDefault();

        const point = getCanvasCoordinates(e);
        if (!point) return;

        const updatedPoints = [...currentStroke.points, point];
        const updatedStroke = { ...currentStroke, points: updatedPoints };
        setCurrentStroke(updatedStroke);

        redrawCanvas([...strokes, updatedStroke]);
    };

    const handleEndDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStroke) return;
        if (e) e.preventDefault();

        setIsDrawing(false);
        const updatedStrokes = [...strokes, currentStroke];
        setStrokes(updatedStrokes);
        setCurrentStroke(null);
        setHasDrawnContent(true);

        // Export current signature
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const dataUrl = canvas.toDataURL("image/png");
                        onSignatureChange?.({
                            blob,
                            dataUrl,
                            method: "canvas",
                        });
                    }
                }, "image/png");
            }
        }, 10);
    };

    // Undo action
    const handleUndo = () => {
        if (strokes.length === 0) return;
        const newStrokes = strokes.slice(0, -1);
        setStrokes(newStrokes);
        redrawCanvas(newStrokes);

        if (newStrokes.length === 0) {
            setHasDrawnContent(false);
            onSignatureChange?.(null);
        } else {
            setTimeout(exportCanvasSignature, 10);
        }
    };

    // Clear canvas action
    const handleClearCanvas = () => {
        setStrokes([]);
        setCurrentStroke(null);
        setHasDrawnContent(false);
        redrawCanvas([]);
        onSignatureChange?.(null);
    };

    // ─── File Upload Handlers ────────────────────────────────────────────────

    const processUploadedFile = (file: File) => {
        setUploadError(null);

        // Validate type
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setUploadError("Formato de imagen inválido. Solo se admiten archivos PNG, JPG o WEBP.");
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("El archivo excede el tamaño máximo permitido (5 MB).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedFile(file);
            setUploadedPreview(result);

            onSignatureChange?.({
                blob: file,
                dataUrl: result,
                file: file,
                method: "upload",
            });
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
    };

    const handleRemoveUploaded = () => {
        setUploadedFile(null);
        setUploadedPreview(null);
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSignatureChange?.(null);
    };

    return (
        <div className="w-full space-y-4">
            {/* Tab Selection */}
            <div className="flex items-center gap-2 border-b border-art-border pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab("canvas")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === "canvas"
                            ? "bg-art-accent-gold text-white shadow-sm"
                            : "text-art-fg-secondary hover:bg-art-bg-secondary"
                    }`}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Trazar Firma (Canvas)
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === "upload"
                            ? "bg-art-accent-gold text-white shadow-sm"
                            : "text-art-fg-secondary hover:bg-art-bg-secondary"
                    }`}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Cargar Imagen / Sello
                </button>
            </div>

            {/* Tab 1: Interactive Canvas */}
            {activeTab === "canvas" && (
                <div className="space-y-3">
                    <div className="relative rounded-lg border-2 border-dashed border-art-border bg-white p-2 shadow-inner overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleStartDrawing}
                            onMouseMove={handleContinueDrawing}
                            onMouseUp={handleEndDrawing}
                            onMouseLeave={handleEndDrawing}
                            onTouchStart={handleStartDrawing}
                            onTouchMove={handleContinueDrawing}
                            onTouchEnd={handleEndDrawing}
                            onTouchCancel={handleEndDrawing}
                            className="cursor-crosshair touch-none mx-auto block rounded bg-transparent"
                            style={{ width: `${width}px`, height: `${height}px` }}
                        />

                        {/* Baseline Signature Guide */}
                        <div className="pointer-events-none absolute bottom-8 left-12 right-12 flex items-center gap-2 text-art-fg-muted/40">
                            <span className="font-serif font-bold text-sm select-none">X</span>
                            <div className="h-px flex-1 bg-art-border select-none" />
                        </div>

                        {!hasDrawnContent && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-art-fg-muted select-none">
                                Toca o haz clic y arrastra para dibujar tu firma institucional
                            </div>
                        )}
                    </div>

                    {/* Canvas Controls */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-art-fg-muted">
                            {hasDrawnContent ? "✓ Trazo registrado" : "Pendiente de trazo"}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={strokes.length === 0}
                                className="inline-flex items-center gap-1 rounded border border-art-border px-2.5 py-1 text-xs font-medium text-art-fg-secondary hover:bg-art-bg-secondary disabled:opacity-40 transition-colors"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Deshacer
                            </button>

                            <button
                                type="button"
                                onClick={handleClearCanvas}
                                disabled={strokes.length === 0}
                                className="inline-flex items-center gap-1 rounded border border-art-color-danger/30 px-2.5 py-1 text-xs font-medium text-art-color-danger hover:bg-art-color-danger/10 disabled:opacity-40 transition-colors"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Upload File / Stamp */}
            {activeTab === "upload" && (
                <div className="space-y-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {!uploadedPreview ? (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                                isDragging
                                    ? "border-art-accent-gold bg-art-accent-gold/5"
                                    : "border-art-border hover:border-art-accent-gold/70 bg-art-bg-secondary/40"
                            }`}
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-art-accent-gold/10 text-art-accent-gold mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-art-fg-primary">
                                Haz clic para examinar o arrastra la imagen o sello
                            </p>
                            <p className="text-[11px] text-art-fg-muted mt-1">
                                Admite PNG transparente, JPG o WEBP (máx. 5 MB)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative rounded-lg border border-art-border bg-neutral-100 p-4 flex items-center justify-center min-h-[160px] overflow-hidden">
                                {/* Transparency checkerboard pattern background */}
                                <div
                                    className="absolute inset-0 opacity-15"
                                    style={{
                                        backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                        backgroundSize: `16px 16px`,
                                        backgroundPosition: `0 0, 0 8px, 8px -8px, -8px 0px`,
                                    }}
                                />

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={uploadedPreview}
                                    alt="Firma / Sello Cargado"
                                    className="relative max-h-36 max-w-full object-contain filter drop-shadow-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-art-fg-muted truncate max-w-xs">
                                    {uploadedFile ? uploadedFile.name : "Sello institucional cargado"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-art-accent-gold hover:underline font-medium"
                                    >
                                        Reemplazar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveUploaded}
                                        className="text-art-color-danger hover:underline font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {uploadError && (
                        <p className="text-xs text-art-color-danger font-medium mt-1">
                            {uploadError}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
