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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          budget_range: string
          contact_type: string
          created_at: string
          email: string
          full_name: string
          id: string
          num_travelers: string
          preferences: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range: string
          contact_type?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          num_travelers: string
          preferences?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string
          contact_type?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          num_travelers?: string
          preferences?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      buddy_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_buddy_id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["buddy_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_buddy_id: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["buddy_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_buddy_id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["buddy_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_requests_receiver_buddy_id_fkey"
            columns: ["receiver_buddy_id"]
            isOneToOne: false
            referencedRelation: "travel_buddies"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_proofs: {
        Row: {
          created_at: string
          experience: string
          id: string
          image_url: string | null
          location: string
          rating: number | null
          title: string
          updated_at: string
          user_id: string
          visited_on: string | null
        }
        Insert: {
          created_at?: string
          experience: string
          id?: string
          image_url?: string | null
          location: string
          rating?: number | null
          title: string
          updated_at?: string
          user_id: string
          visited_on?: string | null
        }
        Update: {
          created_at?: string
          experience?: string
          id?: string
          image_url?: string | null
          location?: string
          rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          visited_on?: string | null
        }
        Relationships: []
      }
      flights: {
        Row: {
          airline: string
          arrival_city: string
          arrival_date: string
          class: string
          created_at: string
          departure_city: string
          departure_date: string
          flight_number: string
          id: string
          price: number
          status: string
          user_id: string
        }
        Insert: {
          airline: string
          arrival_city: string
          arrival_date: string
          class?: string
          created_at?: string
          departure_city: string
          departure_date: string
          flight_number: string
          id?: string
          price: number
          status?: string
          user_id: string
        }
        Update: {
          airline?: string
          arrival_city?: string
          arrival_date?: string
          class?: string
          created_at?: string
          departure_city?: string
          departure_date?: string
          flight_number?: string
          id?: string
          price?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          check_in: string
          check_out: string
          city: string
          created_at: string
          hotel_name: string
          id: string
          image_url: string | null
          price_per_night: number
          room_type: string
          status: string
          total_price: number
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          city: string
          created_at?: string
          hotel_name: string
          id?: string
          image_url?: string | null
          price_per_night: number
          room_type?: string
          status?: string
          total_price: number
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          city?: string
          created_at?: string
          hotel_name?: string
          id?: string
          image_url?: string | null
          price_per_night?: number
          room_type?: string
          status?: string
          total_price?: number
          user_id?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          created_at: string
          destination: string
          duration: string
          id: string
          plan: Json
          quiz_result_id: string | null
          shared_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          duration: string
          id?: string
          plan?: Json
          quiz_result_id?: string | null
          shared_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          duration?: string
          id?: string
          plan?: Json
          quiz_result_id?: string | null
          shared_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_quiz_result_id_fkey"
            columns: ["quiz_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      local_secrets: {
        Row: {
          category: Database["public"]["Enums"]["local_secret_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          location: string
          title: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["local_secret_category"]
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          location: string
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["local_secret_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          location?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          budget: string
          created_at: string
          id: string
          travel_companions: string
          travel_style: string
          trip_duration: string
          user_id: string
        }
        Insert: {
          budget: string
          created_at?: string
          id?: string
          travel_companions: string
          travel_style: string
          trip_duration: string
          user_id: string
        }
        Update: {
          budget?: string
          created_at?: string
          id?: string
          travel_companions?: string
          travel_style?: string
          trip_duration?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_buddies: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          destination: string
          display_name: string
          id: string
          interests: string[]
          is_active: boolean
          travel_end: string
          travel_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          destination: string
          display_name: string
          id?: string
          interests?: string[]
          is_active?: boolean
          travel_end: string
          travel_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          destination?: string
          display_name?: string
          id?: string
          interests?: string[]
          is_active?: boolean
          travel_end?: string
          travel_start?: string
          updated_at?: string
          user_id?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      buddy_request_status: "pending" | "accepted" | "declined"
      local_secret_category:
        | "hidden_place"
        | "food_spot"
        | "local_tip"
        | "less_crowded"
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
      app_role: ["admin", "moderator", "user"],
      buddy_request_status: ["pending", "accepted", "declined"],
      local_secret_category: [
        "hidden_place",
        "food_spot",
        "local_tip",
        "less_crowded",
      ],
    },
  },
} as const
