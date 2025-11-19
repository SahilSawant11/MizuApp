import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DB_NAME = 'mizu.db';
const DB_VERSION = '1.0';
const DB_DISPLAY_NAME = 'Mizu Database';
const DB_SIZE = 200000;

let db: SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });

    console.log('✅ Database opened successfully');

    // Create tables
    await createTables(db);

    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const createTables = async (database: SQLiteDatabase): Promise<void> => {
  const createEntriesTable = `
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('activity', 'expense')),
      amount REAL,
      category TEXT,
      payment_mode TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  try {
    await database.executeSql(createEntriesTable);
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

export const getDatabase = (): SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    try {
      await db.close();
      db = null;
      console.log('✅ Database closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }
};

// Utility: Drop all tables (for development/reset)
export const dropAllTables = async (): Promise<void> => {
  const database = getDatabase();
  try {
    await database.executeSql('DROP TABLE IF EXISTS entries');
    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
};