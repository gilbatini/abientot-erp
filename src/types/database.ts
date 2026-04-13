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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assistant_conversations: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          created_at: string | null
          id: string
          interface: string
          messages: Json
          pdf_url: string | null
          quote_data: Json | null
          status: string
          updated_at: string | null
          wa_phone: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string | null
          id?: string
          interface?: string
          messages?: Json
          pdf_url?: string | null
          quote_data?: Json | null
          status?: string
          updated_at?: string | null
          wa_phone?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string | null
          id?: string
          interface?: string
          messages?: Json
          pdf_url?: string | null
          quote_data?: Json | null
          status?: string
          updated_at?: string | null
          wa_phone?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          currency: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number | null
          travel_date: string | null
          traveller_name: string | null
          type: string | null
          unit_price: number
        }
        Insert: {
          currency?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Update: {
          currency?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          agent_id: string | null
          created_at: string | null
          currency: string
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_rate: number
          terms: string | null
          total: number
          traveller_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      proforma_items: {
        Row: {
          currency: string
          description: string
          id: string
          proforma_id: string
          quantity: number
          sort_order: number | null
          travel_date: string | null
          traveller_name: string | null
          type: string | null
          unit_price: number
        }
        Insert: {
          currency?: string
          description: string
          id?: string
          proforma_id: string
          quantity?: number
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Update: {
          currency?: string
          description?: string
          id?: string
          proforma_id?: string
          quantity?: number
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proforma_items_proforma_id_fkey"
            columns: ["proforma_id"]
            isOneToOne: false
            referencedRelation: "proformas"
            referencedColumns: ["id"]
          },
        ]
      }
      proformas: {
        Row: {
          agent_id: string | null
          converted_to: string | null
          created_at: string | null
          currency: string
          discount: number
          expiry_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          status: string
          subtotal: number
          tax_rate: number
          terms: string | null
          total: number
          traveller_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          converted_to?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          converted_to?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proformas_converted_to_fkey"
            columns: ["converted_to"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proformas_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          currency: string
          description: string
          id: string
          quantity: number
          quotation_id: string
          sort_order: number | null
          travel_date: string | null
          traveller_name: string | null
          type: string | null
          unit_price: number
        }
        Insert: {
          currency?: string
          description: string
          id?: string
          quantity?: number
          quotation_id: string
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Update: {
          currency?: string
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string
          sort_order?: number | null
          travel_date?: string | null
          traveller_name?: string | null
          type?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          agent_id: string | null
          converted_to: string | null
          created_at: string | null
          currency: string
          discount: number
          expiry_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          status: string
          subtotal: number
          tax_rate: number
          terms: string | null
          total: number
          traveller_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          converted_to?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          converted_to?: string | null
          created_at?: string | null
          currency?: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          traveller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_to_fkey"
            columns: ["converted_to"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          agent_id: string | null
          amount_paid: number
          created_at: string | null
          currency: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          receipt_number: string
          reference_number: string | null
          traveller_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          amount_paid: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number: string
          reference_number?: string | null
          traveller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          amount_paid?: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string
          reference_number?: string | null
          traveller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          key: string
          last: number
          year: number
        }
        Insert: {
          key: string
          last?: number
          year: number
        }
        Update: {
          key?: string
          last?: number
          year?: number
        }
        Relationships: []
      }
      team_phone_numbers: {
        Row: {
          active: boolean
          agent_name: string
          created_at: string | null
          id: string
          phone: string
          role: string
        }
        Insert: {
          active?: boolean
          agent_name: string
          created_at?: string | null
          id?: string
          phone: string
          role?: string
        }
        Update: {
          active?: boolean
          agent_name?: string
          created_at?: string | null
          id?: string
          phone?: string
          role?: string
        }
        Relationships: []
      }
      travellers: {
        Row: {
          country: string | null
          created_at: string | null
          created_by: string | null
          dob: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          passport: string | null
          passport_img: string | null
          phone_code: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          dob?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          passport?: string | null
          passport_img?: string | null
          phone_code?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          passport?: string | null
          passport_img?: string | null
          phone_code?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
      next_doc_number: { Args: { doc_key: string }; Returns: string }
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
