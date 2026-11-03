/**
 * Workflow Resolver — Pure domain engine for configurable movement workflows.
 * Calculates state transitions without side-effects according to organization settings.
 */

import type { MovementStatus, OrganizationSettings } from "@/lib/supabase/types";

export type WorkflowAction =
    | "create"
    | "bienes_approve"
    | "chief_approve"
    | "security_approve";

export interface ResolveNextStatusParams {
    currentStatus?: MovementStatus | null;
    movementType: "internal" | "external";
    settings: OrganizationSettings;
    action: WorkflowAction;
}

/**
 * Resolves the next MovementStatus based on movement type, current state,
 * organization settings, and the action triggered.
 *
 * Rules:
 * - Internal movements:
 *     - 'create': Starts at 'pending_bienes' if Bienes approval is required;
 *                 otherwise 'pending_security' if security checkpoint is required;
 *                 otherwise directly 'authorized'.
 *     - 'bienes_approve': Transitions to 'pending_security' if security checkpoint is required;
 *                         otherwise directly 'authorized'.
 *     - 'security_approve': Transitions directly to 'authorized'.
 *
 * - External movements:
 *     - 'create': Starts at 'pending_chief' if Chief approval is required;
 *                 otherwise 'pending_bienes' if Bienes approval is required;
 *                 otherwise 'pending_security' if security checkpoint is required;
 *                 otherwise directly 'authorized'.
 *     - 'chief_approve': Transitions to 'pending_security' if security checkpoint is required;
 *                        otherwise directly 'authorized'.
 *     - 'bienes_approve': Advances to Chief if required, then Security if required, or 'authorized'.
 *     - 'security_approve': Transitions directly to 'authorized'.
 */
export function resolveNextStatus({
    currentStatus,
    movementType,
    settings,
    action,
}: ResolveNextStatusParams): MovementStatus {
    // If request was already rejected, it stays rejected unless re-created
    if (currentStatus === "rejected" && action !== "create") {
        return "rejected";
    }

    if (movementType === "internal") {
        switch (action) {
            case "create":
                if (settings.require_bienes_approval) {
                    return "pending_bienes";
                }
                if (settings.require_security_checkpoint) {
                    return "pending_security";
                }
                return "authorized";

            case "bienes_approve":
                if (settings.require_security_checkpoint) {
                    return "pending_security";
                }
                return "authorized";

            case "security_approve":
            case "chief_approve":
                return "authorized";

            default:
                return "authorized";
        }
    }

    // External movement
    switch (action) {
        case "create":
            if (settings.require_chief_approval) {
                return "pending_chief";
            }
            if (settings.require_bienes_approval) {
                return "pending_bienes";
            }
            if (settings.require_security_checkpoint) {
                return "pending_security";
            }
            return "authorized";

        case "bienes_approve":
            if (settings.require_chief_approval && currentStatus !== "pending_chief") {
                return "pending_chief";
            }
            if (settings.require_security_checkpoint) {
                return "pending_security";
            }
            return "authorized";

        case "chief_approve":
            if (settings.require_security_checkpoint) {
                return "pending_security";
            }
            return "authorized";

        case "security_approve":
            return "authorized";

        default:
            return "authorized";
    }
}

/**
 * Convenience helper to determine initial movement status at creation time.
 */
export function getInitialMovementStatus(
    movementType: "internal" | "external",
    settings: OrganizationSettings
): MovementStatus {
    return resolveNextStatus({
        movementType,
        settings,
        action: "create",
    });
}
