export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_members: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      daily_score_items: {
        Row: {
          daily_score_id: string;
          id: string;
          label: string;
          points: number;
          priority: Database["public"]["Enums"]["todo_priority"] | null;
          title: string;
          todo_id: string | null;
        };
        Insert: {
          daily_score_id: string;
          id?: string;
          label: string;
          points: number;
          priority?: Database["public"]["Enums"]["todo_priority"] | null;
          title: string;
          todo_id?: string | null;
        };
        Update: {
          daily_score_id?: string;
          id?: string;
          label?: string;
          points?: number;
          priority?: Database["public"]["Enums"]["todo_priority"] | null;
          title?: string;
          todo_id?: string | null;
        };
        Relationships: [];
      };
      daily_scores: {
        Row: {
          created_at: string;
          id: string;
          score_date: string;
          tasks_completed: number;
          total_points: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          score_date: string;
          tasks_completed?: number;
          total_points?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          score_date?: string;
          tasks_completed?: number;
          total_points?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          image_path: string | null;
          label: string;
          priority: Database["public"]["Enums"]["todo_priority"] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_path?: string | null;
          label: string;
          priority?: Database["public"]["Enums"]["todo_priority"] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_path?: string | null;
          label?: string;
          priority?: Database["public"]["Enums"]["todo_priority"] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      process_daily_scores: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      todo_priority: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
