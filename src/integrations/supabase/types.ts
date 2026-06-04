export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agreement_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      partner_agreements: {
        Row: {
          admin_notes: string | null
          commission_pct: number
          created_at: string
          custom_body: string | null
          custom_title: string | null
          deposit_pct: number
          id: string
          partner_id: string
          pdf_path: string | null
          signature_image: string | null
          signed_at: string | null
          signed_ip: string | null
          signed_name: string | null
          source: string
          status: string
          template_id: string | null
          template_version: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          commission_pct?: number
          created_at?: string
          custom_body?: string | null
          custom_title?: string | null
          deposit_pct?: number
          id?: string
          partner_id: string
          pdf_path?: string | null
          signature_image?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_name?: string | null
          source?: string
          status?: string
          template_id?: string | null
          template_version?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          commission_pct?: number
          created_at?: string
          custom_body?: string | null
          custom_title?: string | null
          deposit_pct?: number
          id?: string
          partner_id?: string
          pdf_path?: string | null
          signature_image?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_name?: string | null
          source?: string
          status?: string
          template_id?: string | null
          template_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_bookings: {
        Row: {
          amount: number | null
          booking_date: string | null
          booking_time: string | null
          commission_pct: number | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          customer_user_id: string | null
          deposit_amount: number
          deposit_pct: number | null
          id: string
          notes: string | null
          offer_id: string | null
          offer_title: string | null
          order_group_id: string | null
          partner_id: string | null
          payment_method: string | null
          payment_status: string
          qty: number
          remaining_amount: number
          status: string
          unit_price: number
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount?: number | null
          booking_date?: string | null
          booking_time?: string | null
          commission_pct?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          customer_user_id?: string | null
          deposit_amount?: number
          deposit_pct?: number | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          offer_title?: string | null
          order_group_id?: string | null
          partner_id?: string | null
          payment_method?: string | null
          payment_status?: string
          qty?: number
          remaining_amount?: number
          status?: string
          unit_price?: number
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number | null
          booking_date?: string | null
          booking_time?: string | null
          commission_pct?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          customer_user_id?: string | null
          deposit_amount?: number
          deposit_pct?: number | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          offer_title?: string | null
          order_group_id?: string | null
          partner_id?: string | null
          payment_method?: string | null
          payment_status?: string
          qty?: number
          remaining_amount?: number
          status?: string
          unit_price?: number
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "partner_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commission_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_commission_pct: number | null
          current_deposit_pct: number | null
          id: string
          partner_id: string
          reason: string | null
          requested_commission_pct: number
          requested_deposit_pct: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_commission_pct?: number | null
          current_deposit_pct?: number | null
          id?: string
          partner_id: string
          reason?: string | null
          requested_commission_pct: number
          requested_deposit_pct: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_commission_pct?: number | null
          current_deposit_pct?: number | null
          id?: string
          partner_id?: string
          reason?: string | null
          requested_commission_pct?: number
          requested_deposit_pct?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_offers: {
        Row: {
          category: string | null
          commission_pct_override: number | null
          created_at: string
          description: string | null
          discount_percent: number | null
          duration_minutes: number | null
          featured_rank: number | null
          id: string
          image_url: string | null
          image_urls: Json
          original_price: number | null
          overview_bullets: Json
          partner_id: string
          price: number
          status: string
          terms: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          commission_pct_override?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          duration_minutes?: number | null
          featured_rank?: number | null
          id?: string
          image_url?: string | null
          image_urls?: Json
          original_price?: number | null
          overview_bullets?: Json
          partner_id: string
          price?: number
          status?: string
          terms?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          commission_pct_override?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          duration_minutes?: number | null
          featured_rank?: number | null
          id?: string
          image_url?: string | null
          image_urls?: Json
          original_price?: number | null
          overview_bullets?: Json
          partner_id?: string
          price?: number
          status?: string
          terms?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          about: string | null
          address: string | null
          agreement_accepted_at: string | null
          agreement_signature: string | null
          agreement_version: string | null
          category: string
          city: string
          commercial_number: string | null
          commission_pct: number
          cover_url: string | null
          created_at: string
          deposit_pct: number
          email: string | null
          id: string
          logo_url: string | null
          maps_url: string | null
          notes: string | null
          owner_name: string
          phone: string
          status: string
          updated_at: string
          user_id: string
          vendor_name: string
          working_hours: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          agreement_accepted_at?: string | null
          agreement_signature?: string | null
          agreement_version?: string | null
          category: string
          city: string
          commercial_number?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          deposit_pct?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          maps_url?: string | null
          notes?: string | null
          owner_name: string
          phone: string
          status?: string
          updated_at?: string
          user_id: string
          vendor_name: string
          working_hours?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          agreement_accepted_at?: string | null
          agreement_signature?: string | null
          agreement_version?: string | null
          category?: string
          city?: string
          commercial_number?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          deposit_pct?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          maps_url?: string | null
          notes?: string | null
          owner_name?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string
          working_hours?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          area: number | null
          budget: string | null
          city: string | null
          created_at: string
          expected_delivery: string | null
          files: Json
          id: string
          name: string
          notes: string | null
          phone: string
          project_name: string | null
          project_type: string | null
          start_date: string | null
          status: string
          tracking_code: string | null
        }
        Insert: {
          area?: number | null
          budget?: string | null
          city?: string | null
          created_at?: string
          expected_delivery?: string | null
          files?: Json
          id?: string
          name: string
          notes?: string | null
          phone: string
          project_name?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string
          tracking_code?: string | null
        }
        Update: {
          area?: number | null
          budget?: string | null
          city?: string | null
          created_at?: string
          expected_delivery?: string | null
          files?: Json
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          project_name?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string
          tracking_code?: string | null
        }
        Relationships: []
      }
      sponsored_ads: {
        Row: {
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          offer_id: string | null
          slide_index: number | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          offer_id?: string | null
          slide_index?: number | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          offer_id?: string | null
          slide_index?: number | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_quote_status: {
        Args: { _code: string; _phone: string }
        Returns: {
          created_at: string
          expected_delivery: string
          project_name: string
          project_type: string
          status: string
          tracking_code: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "customer"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "partner", "customer"],
    },
  },
} as const
