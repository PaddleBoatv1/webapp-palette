export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      boat_deliveries: {
        Row: {
          actual_arrival: string | null
          created_at: string | null
          delivery_status: string | null
          estimated_arrival: string | null
          id: string
          liaison_id: string | null
          pickup_time: string | null
          reservation_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_arrival?: string | null
          created_at?: string | null
          delivery_status?: string | null
          estimated_arrival?: string | null
          id?: string
          liaison_id?: string | null
          pickup_time?: string | null
          reservation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_arrival?: string | null
          created_at?: string | null
          delivery_status?: string | null
          estimated_arrival?: string | null
          id?: string
          liaison_id?: string | null
          pickup_time?: string | null
          reservation_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_deliveries_liaison_id_fkey"
            columns: ["liaison_id"]
            isOneToOne: false
            referencedRelation: "company_liaisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_deliveries_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_locations: {
        Row: {
          boat_id: string | null
          captured_at: string | null
          id: string
          lat: number
          lng: number
        }
        Insert: {
          boat_id?: string | null
          captured_at?: string | null
          id?: string
          lat: number
          lng: number
        }
        Update: {
          boat_id?: string | null
          captured_at?: string | null
          id?: string
          lat?: number
          lng?: number
        }
        Relationships: [
          {
            foreignKeyName: "boat_locations_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          boat_name: string
          created_at: string | null
          gps_device_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          boat_name: string
          created_at?: string | null
          gps_device_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          boat_name?: string
          created_at?: string | null
          gps_device_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_liaisons: {
        Row: {
          created_at: string | null
          current_job_count: number | null
          current_location: Json | null
          id: string
          is_active: boolean | null
          max_concurrent_jobs: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_job_count?: number | null
          current_location?: Json | null
          id?: string
          is_active?: boolean | null
          max_concurrent_jobs?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_job_count?: number | null
          current_location?: Json | null
          id?: string
          is_active?: boolean | null
          max_concurrent_jobs?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_liaisons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_jobs: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          job_type: string
          liaison_id: string | null
          reservation_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type: string
          liaison_id?: string | null
          reservation_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type?: string
          liaison_id?: string | null
          reservation_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_liaison_id_fkey"
            columns: ["liaison_id"]
            isOneToOne: false
            referencedRelation: "company_liaisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_jobs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          message_content: string
          notification_type: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          id?: string
          message_content: string
          notification_type: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          message_content?: string
          notification_type?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          reservation_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          reservation_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          reservation_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          boat_id: string | null
          created_at: string | null
          distance_traveled: number | null
          end_time: string | null
          end_zone_id: string | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          start_time: string | null
          start_zone_id: string | null
          status: string
          total_minutes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          boat_id?: string | null
          created_at?: string | null
          distance_traveled?: number | null
          end_time?: string | null
          end_zone_id?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          start_time?: string | null
          start_zone_id?: string | null
          status?: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          boat_id?: string | null
          created_at?: string | null
          distance_traveled?: number | null
          end_time?: string | null
          end_zone_id?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          start_time?: string | null
          start_zone_id?: string | null
          status?: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_end_zone_id_fkey"
            columns: ["end_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_start_zone_id_fkey"
            columns: ["start_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waiver_acceptances: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          signature_file_url: string | null
          user_id: string | null
          waiver_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          signature_file_url?: string | null
          user_id?: string | null
          waiver_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          signature_file_url?: string | null
          user_id?: string | null
          waiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiver_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_acceptances_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      waivers: {
        Row: {
          created_at: string | null
          id: string
          version_label: string
          waiver_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          version_label: string
          waiver_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          version_label?: string
          waiver_text?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          updated_at: string | null
          zone_name: string
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          updated_at?: string | null
          zone_name: string
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          updated_at?: string | null
          zone_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_delivery_job: {
        Args: {
          job_id: string
          assign_to_liaison_id: string
        }
        Returns: Json
      }
      exec_sql: {
        Args: {
          sql_query: string
        }
        Returns: undefined
      }
      increment_count: {
        Args: {
          row_id: string
        }
        Returns: number
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_liaison: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_delivery_job_assignment: {
        Args: {
          job_id: string
          liaison_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
