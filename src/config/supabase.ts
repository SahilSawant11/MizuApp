import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Supabase credentials
const SUPABASE_URL = 'https://koalgdaiklujbxaozubc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWxnZGFpa2x1amJ4YW96dWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzczODEsImV4cCI6MjA3OTE1MzM4MX0.7o6OK4MZwNDrQeaQ2UPhGOefTNBuqQZQwjv-457aVe8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection
export const testConnection = async () => {
  try {
    // Just test if Supabase is reachable
    const { error } = await supabase.from('entries').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If it's just RLS blocking, that's fine - connection works
      if (error.message.includes('row-level security') || error.message.includes('JWT')) {
        console.log('✅ Supabase connected (RLS active)');
        return true;
      }
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};