/**
 * Organization Settings Constants
 * Safe institucional defaults and storage keys.
 */
import type { OrganizationSettings } from "@/lib/supabase/types";

export const SETTINGS_KEY = "organization_settings";

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
    organization_name: "Galería de Arte Nacional / Institución Pública",
    organization_type: "public_institution",
    require_bienes_approval: true,
    require_chief_approval: true,
    require_security_checkpoint: true,
    allow_partial_authorization: true,
};
