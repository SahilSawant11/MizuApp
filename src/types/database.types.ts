export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: {
          id: number;
          title: string;
          type: 'activity' | 'expense';
          amount: number | null;
          category: string | null;
          payment_mode: string | null;
          notes: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          title: string;
          type: 'activity' | 'expense';
          amount?: number | null;
          category?: string | null;
          payment_mode?: string | null;
          notes?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          title?: string;
          type?: 'activity' | 'expense';
          amount?: number | null;
          category?: string | null;
          payment_mode?: string | null;
          notes?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}