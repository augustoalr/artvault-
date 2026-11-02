/**
 * Image Service — Client-side wrapper for image compression and upload.
 * - Auto-compresses images > 1MB to < 1MB
 * - Generates standardized filenames
 * - Uploads to Supabase Storage "artworks" bucket
 */

import imageCompression from "browser-image-compression";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ─── Constants ───
const MAX_SIZE_MB = 1;
const MAX_WIDTH_PX = 2400;
const QUALITY = 0.85;

// ─── Types ───
export interface UploadResult {
    success: boolean;
    storagePath?: string;
    publicUrl?: string;
    sizeKb?: number;
    error?: string;
}

export interface CompressionResult {
    file: File;
    originalSizeKb: number;
    compressedSizeKb: number;
    wasCompressed: boolean;
}

// ─── Compression ───

export async function compressImage(file: File): Promise<CompressionResult> {
    const originalSizeKb = Math.round(file.size / 1024);
    const originalSizeMb = file.size / (1024 * 1024);

    // If already under limit, return as-is
    if (originalSizeMb <= MAX_SIZE_MB) {
        return {
            file,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            wasCompressed: false,
        };
    }

    const compressed = await imageCompression(file, {
        maxSizeMB: MAX_SIZE_MB,
        maxWidthOrHeight: MAX_WIDTH_PX,
        useWebWorker: true,
        initialQuality: QUALITY,
        fileType: "image/jpeg",
    });

    return {
        file: compressed,
        originalSizeKb,
        compressedSizeKb: Math.round(compressed.size / 1024),
        wasCompressed: true,
    };
}

// ─── Filename Generation ───

export function generateFileName(
    artworkId: string,
    suffix?: string
): string {
    const timestamp = Date.now();
    const tag = suffix ? `_${suffix}` : "";
    return `${artworkId}/${timestamp}${tag}.jpg`;
}

// ─── Upload ───

export async function uploadArtworkImage(
    file: File,
    artworkId: string,
    suffix?: string
): Promise<UploadResult> {
    // 1. Compress
    const { file: processedFile, compressedSizeKb } = await compressImage(file);

    // 2. Generate path
    const storagePath = generateFileName(artworkId, suffix);

    // 3. Upload to Supabase Storage
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage
        .from("artworks")
        .upload(storagePath, processedFile, {
            contentType: "image/jpeg",
            upsert: false,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage
        .from("artworks")
        .getPublicUrl(storagePath);

    return {
        success: true,
        storagePath,
        publicUrl: urlData.publicUrl,
        sizeKb: compressedSizeKb,
    };
}

// ─── Delete ───

export async function deleteArtworkImage(
    storagePath: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage
        .from("artworks")
        .remove([storagePath]);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export function getImageUrl(storagePath: string | null): string {
    if (!storagePath) return "";
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.storage.from("artworks").getPublicUrl(storagePath);
    return data.publicUrl;
}
