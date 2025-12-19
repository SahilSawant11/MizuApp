import { supabase } from '../config/supabase';
import { Entry, CreateEntryDTO, UpdateEntryDTO } from '../models/Entry';
import { deletePhoto } from '../utils/storageUtils';
export const entryRepository = {
  // Create a new entry
  create: async (dto: CreateEntryDTO): Promise<number> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const date = dto.date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('entries')
        .insert({
          title: dto.title,
          type: dto.type,
          amount: dto.amount || null,
          category: dto.category || null,
          payment_mode: dto.payment_mode || null,
          notes: dto.notes || null,
          date,
          user_id: user.id,
          photo_url: dto.photo_url || null,
          photo_path: dto.photo_path || null,
          has_photo: dto.has_photo || false,
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log('✅ Entry created with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error creating entry:', error);
      throw error;
    }
  },

  // Get all entries for current user
  getAll: async (): Promise<Entry[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching entries:', error);
      throw error;
    }
  },

  // Get entries by date for current user
  getByDate: async (date: string): Promise<Entry[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching entries by date:', error);
      throw error;
    }
  },

  // Get entry by ID (ensures it belongs to current user)
  getById: async (id: number): Promise<Entry | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error fetching entry by ID:', error);
      return null;
    }
  },

  // Update entry (only if it belongs to current user)
  update: async (dto: UpdateEntryDTO): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.amount !== undefined) updateData.amount = dto.amount;
      if (dto.category !== undefined) updateData.category = dto.category;
      if (dto.payment_mode !== undefined) updateData.payment_mode = dto.payment_mode;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (dto.date !== undefined) updateData.date = dto.date;
      if (dto.photo_url !== undefined) updateData.photo_url = dto.photo_url;
      if (dto.photo_path !== undefined) updateData.photo_path = dto.photo_path;
      if (dto.has_photo !== undefined) updateData.has_photo = dto.has_photo;

      const { error } = await supabase
        .from('entries')
        .update(updateData)
        .eq('id', dto.id)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('✅ Entry updated:', dto.id);
    } catch (error) {
      console.error('❌ Error updating entry:', error);
      throw error;
    }
  },

  // Delete entry (only if it belongs to current user)
  delete: async (id: number): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get entry first to check for photo
      const entry = await entryRepository.getById(id);
      
      // Delete photo from storage if exists
      if (entry?.photo_path) {
        try {
          await deletePhoto(entry.photo_path);
          console.log('✅ Photo deleted from storage');
        } catch (photoError) {
          console.warn('⚠️ Failed to delete photo from storage:', photoError);
          // Continue with entry deletion even if photo deletion fails
        }
      }

      // Delete entry from database
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('✅ Entry deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      throw error;
    }
  },

  // Get total expenses for current user
  getTotalExpenses: async (startDate?: string, endDate?: string): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('entries')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
      return total;
    } catch (error) {
      console.error('❌ Error calculating total expenses:', error);
      throw error;
    }
  },

  // Get activity count for current user
  getActivityCount: async (startDate?: string, endDate?: string): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'activity');

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('❌ Error counting activities:', error);
      throw error;
    }
  },

  // Get entries by date range for current user
  getByDateRange: async (startDate: string, endDate: string): Promise<Entry[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching entries by date range:', error);
      throw error;
    }
  },

  // Get expenses by category for current user
  getExpensesByCategory: async (startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('entries')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .not('category', 'is', null);

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;

      if (error) throw error;

      // Group by category
      const grouped = (data || []).reduce((acc, entry) => {
        const cat = entry.category || 'Other';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += entry.amount || 0;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped).map(([category, total]) => ({
        category,
        total,
      }));
    } catch (error) {
      console.error('❌ Error fetching expenses by category:', error);
      throw error;
    }
  },
};