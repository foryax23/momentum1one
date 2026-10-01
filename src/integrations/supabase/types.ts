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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admission_documents: {
        Row: {
          created_at: string
          document_type: string
          file_size: number
          id: string
          lead_id: string
          mime_type: string
          original_filename: string | null
          received_at: string
          replacement_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_size: number
          id?: string
          lead_id: string
          mime_type: string
          original_filename?: string | null
          received_at?: string
          replacement_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_size?: number
          id?: string
          lead_id?: string
          mime_type?: string
          original_filename?: string | null
          received_at?: string
          replacement_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_documents_whatsapp_message_id_fkey"
            columns: ["whatsapp_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign: string | null
          city: string
          consent: boolean
          created_at: string
          distance_miles: number | null
          email: string
          full_name: string
          id: string
          intake: string | null
          interest: string | null
          nearest_campus: string | null
          notes: string | null
          offer_email_sent_at: string | null
          offer_email_status: string
          offer_expires_at: string | null
          offer_token_hash: string | null
          page: string | null
          phone: string
          ref_code: string
          selected_course: string | null
          source: string | null
          status: string
          study_route: string | null
          whatsapp: boolean
          whatsapp_status: string
        }
        Insert: {
          campaign?: string | null
          city: string
          consent?: boolean
          created_at?: string
          distance_miles?: number | null
          email: string
          full_name: string
          id?: string
          intake?: string | null
          interest?: string | null
          nearest_campus?: string | null
          notes?: string | null
          offer_email_sent_at?: string | null
          offer_email_status?: string
          offer_expires_at?: string | null
          offer_token_hash?: string | null
          page?: string | null
          phone: string
          ref_code?: string
          selected_course?: string | null
          source?: string | null
          status?: string
          study_route?: string | null
          whatsapp?: boolean
          whatsapp_status?: string
        }
        Update: {
          campaign?: string | null
          city?: string
          consent?: boolean
          created_at?: string
          distance_miles?: number | null
          email?: string
          full_name?: string
          id?: string
          intake?: string | null
          interest?: string | null
          nearest_campus?: string | null
          notes?: string | null
          offer_email_sent_at?: string | null
          offer_email_status?: string
          offer_expires_at?: string | null
          offer_token_hash?: string | null
          page?: string | null
          phone?: string
          ref_code?: string
          selected_course?: string | null
          source?: string | null
          status?: string
          study_route?: string | null
          whatsapp?: boolean
          whatsapp_status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          activated_via: string | null
          admissions_step: string
          bot_enabled: boolean
          created_at: string
          detected_language: string | null
          id: string
          last_inbound_at: string | null
          last_outbound_at: string | null
          lead_id: string | null
          opted_out_at: string | null
          profile: Json
          queued_at: string | null
          reminders: Json
          status: string
          summary: string | null
          updated_at: string
          wa_phone: string
        }
        Insert: {
          activated_via?: string | null
          admissions_step?: string
          bot_enabled?: boolean
          created_at?: string
          detected_language?: string | null
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          lead_id?: string | null
          opted_out_at?: string | null
          profile?: Json
          queued_at?: string | null
          reminders?: Json
          status?: string
          summary?: string | null
          updated_at?: string
          wa_phone: string
        }
        Update: {
          activated_via?: string | null
          admissions_step?: string
          bot_enabled?: boolean
          created_at?: string
          detected_language?: string | null
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          lead_id?: string | null
          opted_out_at?: string | null
          profile?: Json
          queued_at?: string | null
          reminders?: Json
          status?: string
          summary?: string | null
          updated_at?: string
          wa_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          error: string | null
          id: string
          media_attempts: number
          media_error: string | null
          media_filename: string | null
          media_id: string | null
          media_mime_type: string | null
          media_next_attempt_at: string | null
          media_sha256: string | null
          media_size: number | null
          media_status: string | null
          media_type: string | null
          reply_attempts: number
          reply_next_attempt_at: string | null
          reply_started_at: string | null
          reply_status: string | null
          status: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          direction: string
          error?: string | null
          id?: string
          media_attempts?: number
          media_error?: string | null
          media_filename?: string | null
          media_id?: string | null
          media_mime_type?: string | null
          media_next_attempt_at?: string | null
          media_sha256?: string | null
          media_size?: number | null
          media_status?: string | null
          media_type?: string | null
          reply_attempts?: number
          reply_next_attempt_at?: string | null
          reply_started_at?: string | null
          reply_status?: string | null
          status?: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          media_attempts?: number
          media_error?: string | null
          media_filename?: string | null
          media_id?: string | null
          media_mime_type?: string | null
          media_next_attempt_at?: string | null
          media_sha256?: string | null
          media_size?: number | null
          media_status?: string | null
          media_type?: string | null
          reply_attempts?: number
          reply_next_attempt_at?: string | null
          reply_started_at?: string | null
          reply_status?: string | null
          status?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          attempts: number
          delivery_id: string
          event: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          received_at: string
        }
        Insert: {
          attempts?: number
          delivery_id: string
          event: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
        }
        Update: {
          attempts?: number
          delivery_id?: string
          event?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
