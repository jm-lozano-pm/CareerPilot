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
      ai_insights: {
        Row: {
          content: Json
          context_refs: Json
          generated_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          content?: Json
          context_refs?: Json
          generated_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          content?: Json
          context_refs?: Json
          generated_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string
          request_type: string
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          request_type: string
          result?: Json | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          request_type?: string
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_outcomes: {
        Row: {
          application_id: string
          created_at: string
          employer_feedback: string | null
          id: string
          notes: string | null
          outcome: string
          outcome_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          employer_feedback?: string | null
          id?: string
          notes?: string | null
          outcome: string
          outcome_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          employer_feedback?: string | null
          id?: string
          notes?: string | null
          outcome?: string
          outcome_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_outcomes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          from_status: string | null
          id: string
          to_status: string
          user_id: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          from_status?: string | null
          id?: string
          to_status: string
          user_id: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          from_status?: string | null
          id?: string
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_date: string
          created_at: string
          current_status: string
          cv_id: string | null
          id: string
          job_id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string
          created_at?: string
          current_status?: string
          cv_id?: string | null
          id?: string
          job_id: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string
          created_at?: string
          current_status?: string
          cv_id?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      career_goals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preferred_employment_types: Json
          preferred_work_modes: Json
          target_locations: Json
          target_roles: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_employment_types?: Json
          preferred_work_modes?: Json
          target_locations?: Json
          target_roles?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_employment_types?: Json
          preferred_work_modes?: Json
          target_locations?: Json
          target_roles?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_job_match_assessments: {
        Row: {
          breakdown: Json
          created_at: string
          cv_content_version: number
          cv_id: string
          explanation: Json
          id: string
          job_content_version: number
          job_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          cv_content_version: number
          cv_id: string
          explanation?: Json
          id?: string
          job_content_version: number
          job_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          cv_content_version?: number
          cv_id?: string
          explanation?: Json
          id?: string
          job_content_version?: number
          job_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_job_match_assessments_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_job_match_assessments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cvs: {
        Row: {
          content: Json
          content_version: number
          created_at: string
          id: string
          name: string
          source_cv_id: string | null
          tailored_for_job_id: string | null
          template: string
          updated_at: string
          user_id: string
          visibility: Json
        }
        Insert: {
          content?: Json
          content_version?: number
          created_at?: string
          id?: string
          name: string
          source_cv_id?: string | null
          tailored_for_job_id?: string | null
          template?: string
          updated_at?: string
          user_id: string
          visibility?: Json
        }
        Update: {
          content?: Json
          content_version?: number
          created_at?: string
          id?: string
          name?: string
          source_cv_id?: string | null
          tailored_for_job_id?: string | null
          template?: string
          updated_at?: string
          user_id?: string
          visibility?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cvs_source_cv_id_fkey"
            columns: ["source_cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cvs_tailored_for_job_id_fkey"
            columns: ["tailored_for_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          board_status: string
          company: string
          content_version: number
          created_at: string
          description: string
          employment_type: string | null
          id: string
          location: string | null
          personal_notes: string | null
          source: string | null
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_status?: string
          company: string
          content_version?: number
          created_at?: string
          description: string
          employment_type?: string | null
          id?: string
          location?: string | null
          personal_notes?: string | null
          source?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_status?: string
          company?: string
          content_version?: number
          created_at?: string
          description?: string
          employment_type?: string | null
          id?: string
          location?: string | null
          personal_notes?: string | null
          source?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          awards: Json
          certifications: Json
          contact: Json
          created_at: string
          education: Json
          experience: Json
          headline: string | null
          id: string
          languages: Json
          projects: Json
          skills: Json
          summary: string | null
          target_title: string | null
          updated_at: string
          user_id: string
          volunteering: Json
        }
        Insert: {
          awards?: Json
          certifications?: Json
          contact?: Json
          created_at?: string
          education?: Json
          experience?: Json
          headline?: string | null
          id?: string
          languages?: Json
          projects?: Json
          skills?: Json
          summary?: string | null
          target_title?: string | null
          updated_at?: string
          user_id: string
          volunteering?: Json
        }
        Update: {
          awards?: Json
          certifications?: Json
          contact?: Json
          created_at?: string
          education?: Json
          experience?: Json
          headline?: string | null
          id?: string
          languages?: Json
          projects?: Json
          skills?: Json
          summary?: string | null
          target_title?: string | null
          updated_at?: string
          user_id?: string
          volunteering?: Json
        }
        Relationships: []
      }
      recommendation_feedback: {
        Row: {
          created_at: string
          id: string
          intended_action: string | null
          notes: string | null
          rating: string
          recommendation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intended_action?: string | null
          notes?: string | null
          rating: string
          recommendation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intended_action?: string | null
          notes?: string | null
          rating?: string
          recommendation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: true
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          dismissed_at: string | null
          id: string
          insight_id: string | null
          rationale: string | null
          reviewed_at: string | null
          shown_at: string | null
          state: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          insight_id?: string | null
          rationale?: string | null
          reviewed_at?: string | null
          shown_at?: string | null
          state?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          insight_id?: string | null
          rationale?: string | null
          reviewed_at?: string | null
          shown_at?: string | null
          state?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "ai_insights"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_application: {
        Args: {
          p_application_date?: string
          p_cv_id?: string
          p_job_id: string
          p_notes?: string
        }
        Returns: {
          application_date: string
          created_at: string
          current_status: string
          cv_id: string | null
          id: string
          job_id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_application_outcome: {
        Args: {
          p_application_id: string
          p_employer_feedback?: string
          p_notes?: string
          p_outcome: string
          p_outcome_date?: string
        }
        Returns: {
          application_id: string
          created_at: string
          employer_feedback: string | null
          id: string
          notes: string | null
          outcome: string
          outcome_date: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "application_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_application_status: {
        Args: { p_application_id: string; p_to_status: string }
        Returns: {
          application_date: string
          created_at: string
          current_status: string
          cv_id: string | null
          id: string
          job_id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
