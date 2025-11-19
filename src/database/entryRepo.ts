import { getDatabase } from './db';
import { Entry, CreateEntryDTO, UpdateEntryDTO } from '../models/Entry';

export const entryRepository = {
  // Create a new entry
  create: async (dto: CreateEntryDTO): Promise<number> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const date = dto.date || new Date().toISOString().split('T')[0];

    const query = `
      INSERT INTO entries (title, type, amount, category, payment_mode, notes, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await db.executeSql(query, [
        dto.title,
        dto.type,
        dto.amount || null,
        dto.category || null,
        dto.payment_mode || null,
        dto.notes || null,
        date,
        now,
        now,
      ]);

      console.log('✅ Entry created with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error creating entry:', error);
      throw error;
    }
  },

  // Get all entries
  getAll: async (): Promise<Entry[]> => {
    const db = getDatabase();
    const query = 'SELECT * FROM entries ORDER BY date DESC, created_at DESC';

    try {
      const [results] = await db.executeSql(query);
      const entries: Entry[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        entries.push(results.rows.item(i));
      }

      return entries;
    } catch (error) {
      console.error('❌ Error fetching entries:', error);
      throw error;
    }
  },

  // Get entries by date
  getByDate: async (date: string): Promise<Entry[]> => {
    const db = getDatabase();
    const query = 'SELECT * FROM entries WHERE date = ? ORDER BY created_at DESC';

    try {
      const [results] = await db.executeSql(query, [date]);
      const entries: Entry[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        entries.push(results.rows.item(i));
      }

      return entries;
    } catch (error) {
      console.error('❌ Error fetching entries by date:', error);
      throw error;
    }
  },

  // Get entry by ID
  getById: async (id: number): Promise<Entry | null> => {
    const db = getDatabase();
    const query = 'SELECT * FROM entries WHERE id = ?';

    try {
      const [results] = await db.executeSql(query, [id]);
      if (results.rows.length > 0) {
        return results.rows.item(0);
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching entry by ID:', error);
      throw error;
    }
  },

  // Update entry
  update: async (dto: UpdateEntryDTO): Promise<void> => {
    const db = getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: any[] = [];

    if (dto.title !== undefined) {
      fields.push('title = ?');
      values.push(dto.title);
    }
    if (dto.type !== undefined) {
      fields.push('type = ?');
      values.push(dto.type);
    }
    if (dto.amount !== undefined) {
      fields.push('amount = ?');
      values.push(dto.amount);
    }
    if (dto.category !== undefined) {
      fields.push('category = ?');
      values.push(dto.category);
    }
    if (dto.payment_mode !== undefined) {
      fields.push('payment_mode = ?');
      values.push(dto.payment_mode);
    }
    if (dto.notes !== undefined) {
      fields.push('notes = ?');
      values.push(dto.notes);
    }
    if (dto.date !== undefined) {
      fields.push('date = ?');
      values.push(dto.date);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(dto.id);

    const query = `UPDATE entries SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await db.executeSql(query, values);
      console.log('✅ Entry updated:', dto.id);
    } catch (error) {
      console.error('❌ Error updating entry:', error);
      throw error;
    }
  },

  // Delete entry
  delete: async (id: number): Promise<void> => {
    const db = getDatabase();
    const query = 'DELETE FROM entries WHERE id = ?';

    try {
      await db.executeSql(query, [id]);
      console.log('✅ Entry deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      throw error;
    }
  },

  // Get total expenses
  getTotalExpenses: async (startDate?: string, endDate?: string): Promise<number> => {
    const db = getDatabase();
    let query = "SELECT SUM(amount) as total FROM entries WHERE type = 'expense'";
    const params: string[] = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    try {
      const [results] = await db.executeSql(query, params);
      return results.rows.item(0).total || 0;
    } catch (error) {
      console.error('❌ Error calculating total expenses:', error);
      throw error;
    }
  },

  // Get activity count
  getActivityCount: async (startDate?: string, endDate?: string): Promise<number> => {
    const db = getDatabase();
    let query = "SELECT COUNT(*) as count FROM entries WHERE type = 'activity'";
    const params: string[] = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    try {
      const [results] = await db.executeSql(query, params);
      return results.rows.item(0).count || 0;
    } catch (error) {
      console.error('❌ Error counting activities:', error);
      throw error;
    }
  },
};