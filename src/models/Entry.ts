export type EntryType = 'activity' | 'expense';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other';

export type Category = 
  | 'Food & Drinks'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Bills & Utilities'
  | 'Education'
  | 'Other';

export interface Entry {
  id?: number;
  title: string;
  type: EntryType;
  amount?: number | null;
  category?: Category | null;
  payment_mode?: PaymentMode | null;
  notes?: string | null;
  date: string; // ISO format: YYYY-MM-DD
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CreateEntryDTO {
  title: string;
  type: EntryType;
  amount?: number;
  category?: Category;
  payment_mode?: PaymentMode;
  notes?: string;
  date?: string; // Defaults to today if not provided
}

export interface UpdateEntryDTO extends Partial<CreateEntryDTO> {
  id: number;
}

// Helper to create a new entry with defaults
export const createEntry = (dto: CreateEntryDTO): Entry => {
  const now = new Date().toISOString();
  return {
    title: dto.title,
    type: dto.type,
    amount: dto.amount || null,
    category: dto.category || null,
    payment_mode: dto.payment_mode || null,
    notes: dto.notes || null,
    date: dto.date || new Date().toISOString().split('T')[0],
    created_at: now,
    updated_at: now,
  };
};