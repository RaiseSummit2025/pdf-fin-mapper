export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      excel_data: {
        Row: {
          cell_value: string | null
          column_name: string | null
          created_at: string
          data_type: string | null
          id: string
          row_number: number
          sheet_name: string
          upload_id: string | null
        }
        Insert: {
          cell_value?: string | null
          column_name?: string | null
          created_at?: string
          data_type?: string | null
          id?: string
          row_number: number
          sheet_name: string
          upload_id?: string | null
        }
        Update: {
          cell_value?: string | null
          column_name?: string | null
          created_at?: string
          data_type?: string | null
          id?: string
          row_number?: number
          sheet_name?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "excel_data_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "excel_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      excel_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_size: number | null
          filename: string
          id: string
          processing_status: string | null
          sheets_count: number | null
          storage_path: string | null
          total_records_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          filename: string
          id?: string
          processing_status?: string | null
          sheets_count?: number | null
          storage_path?: string | null
          total_records_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          processing_status?: string | null
          sheets_count?: number | null
          storage_path?: string | null
          total_records_count?: number | null
        }
        Relationships: []
      }
      pdf_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          extracted_records_count: number | null
          file_size: number
          filename: string
          id: string
          processing_status: string | null
          storage_path: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          extracted_records_count?: number | null
          file_size: number
          filename: string
          id?: string
          processing_status?: string | null
          storage_path: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          extracted_records_count?: number | null
          file_size?: number
          filename?: string
          id?: string
          processing_status?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      trial_balances: {
        Row: {
          account_description: string
          account_number: string | null
          balance: number
          confidence_score: number | null
          created_at: string
          credit: number | null
          debit: number | null
          id: string
          page_number: number | null
          period: string | null
          upload_id: string | null
        }
        Insert: {
          account_description: string
          account_number?: string | null
          balance: number
          confidence_score?: number | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          id?: string
          page_number?: number | null
          period?: string | null
          upload_id?: string | null
        }
        Update: {
          account_description?: string
          account_number?: string | null
          balance?: number
          confidence_score?: number | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          id?: string
          page_number?: number | null
          period?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_balances_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "excel_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
