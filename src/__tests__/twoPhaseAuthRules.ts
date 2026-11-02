import assert from "node:assert/strict";

/**
 * Types mirroring Database entities for two-phase authorization
 */
export interface MovementRequestRecord {
    id: string;
    status: "pending_chief" | "pending_security" | "pending_bienes" | "authorized" | "rejected";
    movement_type: "internal" | "external";
    destination: string;
    purpose?: string | null;
    artwork_ids: string[];
    authorized_artwork_ids: string[] | null;
    chief_name?: string | null;
    chief_id_number?: string | null;
    chief_department?: string | null;
    chief_authorized_at?: string | null;
    chief_signature_path?: string | null;
    security_officer_name?: string | null;
    security_officer_id?: string | null;
    authorized_at?: string | null;
    authorized_by_user_id?: string | null;
}

export interface ArtworkMovementRecord {
    id: string;
    artwork_id: string;
    location: string;
    date_from: string;
    date_to: string | null;
    request_id: string | null;
    notes?: string | null;
    created_by?: string | null;
}

export interface ArtworkRecord {
    id: string;
    title: string;
    artwork_location: string;
}

export interface AuditLogRecord {
    table_name: string;
    record_id: string;
    action: string;
    new_data: unknown;
    changed_by: string;
}

/**
 * In-memory Mock Database Store
 */
export class MockDatabase {
    movementRequests: Map<string, MovementRequestRecord> = new Map();
    artworkMovements: ArtworkMovementRecord[] = [];
    artworks: Map<string, ArtworkRecord> = new Map();
    auditLogs: AuditLogRecord[] = [];
    currentUser = { id: "user-123-uuid", email: "test@artvault.gob.ve" };

    reset() {
        this.movementRequests.clear();
        this.artworkMovements = [];
        this.artworks.clear();
        this.auditLogs = [];
    }
}

/**
 * Pure Domain Rules Engine for Chief Authorization
 */
export class ChiefAuthorizationEngine {
    static authorize(
        db: MockDatabase,
        params: {
            requestId: string;
            chiefName: string;
            chiefIdNumber: string;
            chiefDepartment: string;
            authorizedArtworkIds: string[];
            signatureData?: string | null;
        }
    ): { success: boolean; error?: string; data?: unknown } {
        if (!params.requestId) {
            return { success: false, error: "ID de solicitud no proporcionado" };
        }
        if (!params.chiefName?.trim()) {
            return { success: false, error: "El nombre del jefe autorizante es obligatorio" };
        }
        if (!params.chiefIdNumber?.trim()) {
            return { success: false, error: "El documento de identidad (C.I.) es obligatorio" };
        }
        if (!params.chiefDepartment?.trim()) {
            return { success: false, error: "La dependencia o departamento es obligatorio" };
        }
        if (!params.authorizedArtworkIds || params.authorizedArtworkIds.length === 0) {
            return { success: false, error: "Debe autorizar al menos una obra de arte" };
        }

        const request = db.movementRequests.get(params.requestId);
        if (!request) {
            return { success: false, error: "Solicitud no encontrada" };
        }

        if (request.status !== "pending_chief") {
            return {
                success: false,
                error: `La solicitud no está pendiente de autorización por jefatura (estado actual: ${request.status})`,
            };
        }

        const requestedArtworks = new Set(request.artwork_ids);
        const invalidArtworks = params.authorizedArtworkIds.filter((id) => !requestedArtworks.has(id));
        if (invalidArtworks.length > 0) {
            return {
                success: false,
                error: "Se intentó autorizar obras que no forman parte de la solicitud original",
            };
        }

        // Snapshot update
        request.chief_name = params.chiefName.trim();
        request.chief_id_number = params.chiefIdNumber.trim();
        request.chief_department = params.chiefDepartment.trim();
        request.chief_authorized_at = new Date().toISOString();
        request.chief_signature_path = params.signatureData ?? null;
        request.authorized_artwork_ids = params.authorizedArtworkIds;
        request.status = "pending_security";

        db.movementRequests.set(request.id, request);

        // Audit Log
        db.auditLogs.push({
            table_name: "movement_requests",
            record_id: request.id,
            action: "CHIEF_AUTHORIZED",
            new_data: {
                chief_name: params.chiefName,
                chief_department: params.chiefDepartment,
                authorized_artworks_count: params.authorizedArtworkIds.length,
                total_requested_count: request.artwork_ids.length,
            },
            changed_by: db.currentUser.id,
        });

        return {
            success: true,
            data: {
                authorizedCount: params.authorizedArtworkIds.length,
                totalCount: request.artwork_ids.length,
            },
        };
    }
}

/**
 * Pure Domain Rules Engine for Security Authorization
 */
export class SecurityAuthorizationEngine {
    static authorize(
        db: MockDatabase,
        params: {
            requestId: string;
            officerName: string;
            officerId: string;
            verifiedArtworkIds?: string[];
        }
    ): { success: boolean; error?: string; data?: unknown } {
        const request = db.movementRequests.get(params.requestId);
        if (!request || request.status !== "pending_security") {
            return { success: false, error: "Solicitud no encontrada o ya procesada" };
        }

        const allArtworkIds = request.artwork_ids ?? [];
        if (!allArtworkIds.length) {
            return { success: false, error: "Solicitud sin obras" };
        }

        let artworkIdsToMove = allArtworkIds;

        // Security Barrier Rule:
        // For external requests with chief authorization, ONLY authorized artworks can be processed
        if (
            request.movement_type === "external" &&
            request.authorized_artwork_ids &&
            request.authorized_artwork_ids.length > 0
        ) {
            const authorizedSet = new Set(request.authorized_artwork_ids);

            if (params.verifiedArtworkIds && params.verifiedArtworkIds.length > 0) {
                const unauthorized = params.verifiedArtworkIds.filter((id) => !authorizedSet.has(id));
                if (unauthorized.length > 0) {
                    return {
                        success: false,
                        error: "Bloqueo de seguridad: Se intentó autorizar obras no avaladas previamente por la Jefatura.",
                    };
                }
                artworkIdsToMove = params.verifiedArtworkIds.filter((id) => authorizedSet.has(id));
            } else {
                artworkIdsToMove = request.authorized_artwork_ids;
            }
        }

        if (!artworkIdsToMove.length) {
            return { success: false, error: "No existen obras avaladas para autorizar en esta solicitud." };
        }

        // Close open movements
        const now = new Date().toISOString();
        for (const m of db.artworkMovements) {
            if (artworkIdsToMove.includes(m.artwork_id) && m.date_to === null) {
                m.date_to = now;
            }
        }

        // Create new movements
        for (const artworkId of artworkIdsToMove) {
            db.artworkMovements.push({
                id: `mov-${Date.now()}-${artworkId}`,
                artwork_id: artworkId,
                location: request.destination,
                date_from: now,
                date_to: null,
                request_id: request.id,
                created_by: db.currentUser.id,
            });

            // Sync artwork location
            const art = db.artworks.get(artworkId);
            if (art) {
                art.artwork_location = request.destination;
            }
        }

        // Update request status to authorized
        request.status = "authorized";
        request.authorized_at = now;
        request.security_officer_name = params.officerName;
        request.security_officer_id = params.officerId;
        request.authorized_by_user_id = db.currentUser.id;

        db.movementRequests.set(request.id, request);

        // Audit Log
        db.auditLogs.push({
            table_name: "movement_requests",
            record_id: request.id,
            action: "AUTHORIZED",
            new_data: {
                officer_name: params.officerName,
                officer_id: params.officerId,
                artworks_moved: artworkIdsToMove.length,
            },
            changed_by: db.currentUser.id,
        });

        return { success: true };
    }
}
