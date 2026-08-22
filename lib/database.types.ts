export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      pokemon: {
        Row: {
          abilities: string[];
          created_at: string;
          height: number;
          id: number;
          image_url: string;
          name: string;
          stats: Json;
          types: string[];
          updated_at: string;
          weight: number;
        };
        Insert: {
          abilities: string[];
          created_at?: string;
          height: number;
          id: number;
          image_url: string;
          name: string;
          stats: Json;
          types: string[];
          updated_at?: string;
          weight: number;
        };
        Update: {
          abilities?: string[];
          created_at?: string;
          height?: number;
          id?: number;
          image_url?: string;
          name?: string;
          stats?: Json;
          types?: string[];
          updated_at?: string;
          weight?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
