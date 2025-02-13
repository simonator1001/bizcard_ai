export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      business_cards: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          name: string
          title: string | null
          company: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          image_url: string | null
          ocr_text: string | null
          notes: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          name: string
          title?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          image_url?: string | null
          ocr_text?: string | null
          notes?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          name?: string
          title?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          image_url?: string | null
          ocr_text?: string | null
          notes?: string | null
          tags?: string[] | null
        }
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
  }
} 