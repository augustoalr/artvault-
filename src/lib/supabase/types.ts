/**
 * Supabase Database Types — Auto-generated from the schema.
 * Re-exported convenience aliases for use across the codebase.
 */
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            app_settings: {
                Row: {
                    id: string
                    key: string
                    updated_at: string | null
                    updated_by: string | null
                    value: string | null
                }
                Insert: {
                    id?: string
                    key: string
                    updated_at?: string | null
                    updated_by?: string | null
                    value?: string | null
                }
                Update: {
                    id?: string
                    key?: string
                    updated_at?: string | null
                    updated_by?: string | null
                    value?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "app_settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            artwork_conservation: {
                Row: {
                    artwork_id: string
                    conservator_id: string | null
                    created_at: string | null
                    diagnosis: string | null
                    id: string
                    photo_left_path: string | null
                    photo_right_path: string | null
                    recommendations: string | null
                    updated_at: string | null
                }
                Insert: {
                    artwork_id: string
                    conservator_id?: string | null
                    created_at?: string | null
                    diagnosis?: string | null
                    id?: string
                    photo_left_path?: string | null
                    photo_right_path?: string | null
                    recommendations?: string | null
                    updated_at?: string | null
                }
                Update: {
                    artwork_id?: string
                    conservator_id?: string | null
                    created_at?: string | null
                    diagnosis?: string | null
                    id?: string
                    photo_left_path?: string | null
                    photo_right_path?: string | null
                    recommendations?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "artwork_conservation_artwork_id_fkey"
                        columns: ["artwork_id"]
                        isOneToOne: false
                        referencedRelation: "artworks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artwork_conservation_conservator_id_fkey"
                        columns: ["conservator_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            artwork_movements: {
                Row: {
                    artwork_id: string
                    created_at: string | null
                    created_by: string | null
                    date_from: string
                    date_to: string | null
                    id: string
                    location: string
                    notes: string | null
                    request_id: string | null
                }
                Insert: {
                    artwork_id: string
                    created_at?: string | null
                    created_by?: string | null
                    date_from: string
                    date_to?: string | null
                    id?: string
                    location: string
                    notes?: string | null
                    request_id?: string | null
                }
                Update: {
                    artwork_id?: string
                    created_at?: string | null
                    created_by?: string | null
                    date_from?: string
                    date_to?: string | null
                    id?: string
                    location?: string
                    notes?: string | null
                    request_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "artwork_movements_artwork_id_fkey"
                        columns: ["artwork_id"]
                        isOneToOne: false
                        referencedRelation: "artworks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artwork_movements_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artwork_movements_request_id_fkey"
                        columns: ["request_id"]
                        isOneToOne: false
                        referencedRelation: "movement_requests"
                        referencedColumns: ["id"]
                    },
                ]
            }
            artwork_valuations: {
                Row: {
                    appraisal_date: string | null
                    approved_by: string | null
                    artwork_id: string
                    created_at: string | null
                    id: string
                    registered_by: string | null
                    reviewed_by: string | null
                    value_bs: number | null
                    value_usd: number | null
                }
                Insert: {
                    appraisal_date?: string | null
                    approved_by?: string | null
                    artwork_id: string
                    created_at?: string | null
                    id?: string
                    registered_by?: string | null
                    reviewed_by?: string | null
                    value_bs?: number | null
                    value_usd?: number | null
                }
                Update: {
                    appraisal_date?: string | null
                    approved_by?: string | null
                    artwork_id?: string
                    created_at?: string | null
                    id?: string
                    registered_by?: string | null
                    reviewed_by?: string | null
                    value_bs?: number | null
                    value_usd?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "artwork_valuations_artwork_id_fkey"
                        columns: ["artwork_id"]
                        isOneToOne: false
                        referencedRelation: "artworks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artwork_valuations_registered_by_fkey"
                        columns: ["registered_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            artworks: {
                Row: {
                    artwork_location: string | null
                    author: string | null
                    author_biography: string | null
                    biography_researcher: string | null
                    category: string | null
                    created_at: string | null
                    created_by: string | null
                    deleted_at: string | null
                    description: string | null
                    dimensions: string | null
                    entry_date: string | null
                    general_observations: string | null
                    id: string
                    inventory_number: string
                    mounting_description: string | null
                    original_owner: string | null
                    owner_address: string | null
                    photo_type: string | null
                    photographer: string | null
                    provenance: string | null
                    registered_by: string | null
                    reviewed_by: string | null
                    status: string | null
                    tags: string[] | null
                    technique: string | null
                    title: string
                    updated_at: string | null
                    year: string | null
                }
                Insert: {
                    artwork_location?: string | null
                    author?: string | null
                    author_biography?: string | null
                    biography_researcher?: string | null
                    category?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    deleted_at?: string | null
                    description?: string | null
                    dimensions?: string | null
                    entry_date?: string | null
                    general_observations?: string | null
                    id?: string
                    inventory_number: string
                    mounting_description?: string | null
                    original_owner?: string | null
                    owner_address?: string | null
                    photo_type?: string | null
                    photographer?: string | null
                    provenance?: string | null
                    registered_by?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    tags?: string[] | null
                    technique?: string | null
                    title: string
                    updated_at?: string | null
                    year?: string | null
                }
                Update: {
                    artwork_location?: string | null
                    author?: string | null
                    author_biography?: string | null
                    biography_researcher?: string | null
                    category?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    deleted_at?: string | null
                    description?: string | null
                    dimensions?: string | null
                    entry_date?: string | null
                    general_observations?: string | null
                    id?: string
                    inventory_number?: string
                    mounting_description?: string | null
                    original_owner?: string | null
                    owner_address?: string | null
                    photo_type?: string | null
                    photographer?: string | null
                    provenance?: string | null
                    registered_by?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    tags?: string[] | null
                    technique?: string | null
                    title?: string
                    updated_at?: string | null
                    year?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "artworks_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artworks_registered_by_fkey"
                        columns: ["registered_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    changed_by: string | null
                    created_at: string | null
                    id: string
                    new_data: Json | null
                    old_data: Json | null
                    record_id: string
                    table_name: string
                }
                Insert: {
                    action: string
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id: string
                    table_name: string
                }
                Update: {
                    action?: string
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id?: string
                    table_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            catalog_options: {
                Row: {
                    category: string
                    created_at: string | null
                    created_by: string | null
                    id: string
                    is_active: boolean | null
                    value: string
                }
                Insert: {
                    category: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    is_active?: boolean | null
                    value: string
                }
                Update: {
                    category?: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    is_active?: boolean | null
                    value?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "catalog_options_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            media_assets: {
                Row: {
                    artwork_id: string | null
                    created_at: string | null
                    file_type: string | null
                    id: string
                    is_primary: boolean | null
                    size_kb: number | null
                    storage_path: string
                }
                Insert: {
                    artwork_id?: string | null
                    created_at?: string | null
                    file_type?: string | null
                    id?: string
                    is_primary?: boolean | null
                    size_kb?: number | null
                    storage_path: string
                }
                Update: {
                    artwork_id?: string | null
                    created_at?: string | null
                    file_type?: string | null
                    id?: string
                    is_primary?: boolean | null
                    size_kb?: number | null
                    storage_path?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "media_assets_artwork_id_fkey"
                        columns: ["artwork_id"]
                        isOneToOne: false
                        referencedRelation: "artworks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    full_name: string | null
                    id: string
                    role: Database["public"]["Enums"]["user_role"]
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    full_name?: string | null
                    id: string
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    full_name?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Relationships: []
            }
            movement_requests: {
                Row: {
                    authorized_at: string | null
                    authorized_by_user_id: string | null
                    bienes_approved_at: string | null
                    bienes_officer_id: string | null
                    bienes_officer_name: string | null
                    created_at: string | null
                    created_by: string | null
                    destination: string
                    id: string
                    movement_type: Database["public"]["Enums"]["movement_request_type"]
                    purpose: string | null
                    request_number: number
                    responsible_id_number: string | null
                    responsible_name: string | null
                    security_officer_id: string | null
                    security_officer_name: string | null
                    status: Database["public"]["Enums"]["movement_request_status"] | null
                    artwork_ids: string[] | null
                }
                Insert: {
                    authorized_at?: string | null
                    authorized_by_user_id?: string | null
                    bienes_approved_at?: string | null
                    bienes_officer_id?: string | null
                    bienes_officer_name?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    destination: string
                    id?: string
                    movement_type: Database["public"]["Enums"]["movement_request_type"]
                    purpose?: string | null
                    request_number?: number
                    responsible_id_number?: string | null
                    responsible_name?: string | null
                    security_officer_id?: string | null
                    security_officer_name?: string | null
                    status?: Database["public"]["Enums"]["movement_request_status"] | null
                    artwork_ids?: string[] | null
                }
                Update: {
                    authorized_at?: string | null
                    authorized_by_user_id?: string | null
                    bienes_approved_at?: string | null
                    bienes_officer_id?: string | null
                    bienes_officer_name?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    destination?: string
                    id?: string
                    movement_type?: Database["public"]["Enums"]["movement_request_type"]
                    purpose?: string | null
                    request_number?: number
                    responsible_id_number?: string | null
                    responsible_name?: string | null
                    security_officer_id?: string | null
                    security_officer_name?: string | null
                    status?: Database["public"]["Enums"]["movement_request_status"] | null
                    artwork_ids?: string[] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "movement_requests_authorized_by_user_id_fkey"
                        columns: ["authorized_by_user_id"]
                        isOneToOne: false
                        referencedRelation: "users" // referencing auth.users technically, but profiles usually used
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "movement_requests_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_role: {
                Args: never
                Returns: Database["public"]["Enums"]["user_role"]
            }
        }
        Enums: {
            user_role: "admin" | "editor" | "conservador" | "visitante" | "seguridad" | "bienes"
            movement_request_type: "internal" | "external"
            movement_request_status: "pending_bienes" | "pending_security" | "authorized" | "rejected"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// ─── Convenience Aliases ────────────────────────────────────────
export type UserRole = Database["public"]["Enums"]["user_role"];
export type Profile = Tables<"profiles">;
export type Artwork = Tables<"artworks">;
export type MediaAsset = Tables<"media_assets">;
export type AuditLog = Tables<"audit_logs">;
export type CatalogOption = Tables<"catalog_options">;
export type ArtworkMovement = Tables<"artwork_movements">;
export type ArtworkConservation = Tables<"artwork_conservation">;
export type ArtworkValuation = Tables<"artwork_valuations">;
export type AppSetting = Tables<"app_settings">;
export type MovementRequest = Tables<"movement_requests">;
