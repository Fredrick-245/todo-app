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
      todos: {
        Row: {
          completed: boolean;
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
      [_ in never]: never;
    };
    Enums: {
      todo_priority: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
