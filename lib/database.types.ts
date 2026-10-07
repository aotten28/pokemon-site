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
      favorites: {
        Row: {
          created_at: string;
          pokemon_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          pokemon_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          pokemon_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_pokemon_id_fkey';
            columns: ['pokemon_id'];
            isOneToOne: false;
            referencedRelation: 'pokemon';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          handle: string;
          id: string;
          partner_pokemon_id: number | null;
          trainer_ball: string;
        };
        Insert: {
          created_at?: string;
          handle: string;
          id: string;
          partner_pokemon_id?: number | null;
          trainer_ball?: string;
        };
        Update: {
          created_at?: string;
          handle?: string;
          id?: string;
          partner_pokemon_id?: number | null;
          trainer_ball?: string;
        };
        Relationships: [];
      };
      user_cards: {
        Row: {
          card_id: string;
          card_number: string;
          created_at: string;
          image_large: string;
          image_small: string;
          list_status: 'have' | 'want';
          market_price: number | null;
          market_price_label: string | null;
          name: string;
          rarity: string | null;
          release_date: string | null;
          release_year: string | null;
          set_name: string;
          set_series: string;
          subtypes: string[];
          user_id: string;
        };
        Insert: {
          card_id: string;
          card_number: string;
          created_at?: string;
          image_large: string;
          image_small: string;
          list_status: 'have' | 'want';
          market_price?: number | null;
          market_price_label?: string | null;
          name: string;
          rarity?: string | null;
          release_date?: string | null;
          release_year?: string | null;
          set_name: string;
          set_series: string;
          subtypes?: string[];
          user_id: string;
        };
        Update: {
          card_id?: string;
          card_number?: string;
          created_at?: string;
          image_large?: string;
          image_small?: string;
          list_status?: 'have' | 'want';
          market_price?: number | null;
          market_price_label?: string | null;
          name?: string;
          rarity?: string | null;
          release_date?: string | null;
          release_year?: string | null;
          set_name?: string;
          set_series?: string;
          subtypes?: string[];
          user_id?: string;
        };
        Relationships: [];
      };
      pokemon: {
        Row: {
          abilities: string[];
          created_at: string;
          height: number;
          id: number;
          image_url: string;
          mega_forms: Json;
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
          mega_forms?: Json;
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
          mega_forms?: Json;
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
