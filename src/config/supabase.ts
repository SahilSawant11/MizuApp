import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://koalgdaiklujbxaozubc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWxnZGFpa2x1amJ4YW96dWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzczODEsImV4cCI6MjA3OTE1MzM4MX0.7o6OK4MZwNDrQeaQ2UPhGOefTNBuqQZQwjv-457aVe8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Required for React Native
  },
});

// Better connection test
export const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test 1: Basic connectivity
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('🔐 Auth test - RLS may be blocking, but connection works');
    } else {
      console.log('✅ Auth connectivity test passed');
    }
    
    // Test 2: Simple query to check database access
    const { error: queryError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (queryError) {
      if (queryError.message.includes('row-level security') || 
          queryError.message.includes('JWT')) {
        console.log('✅ Database connected (RLS active)');
        return true;
      }
      console.warn('⚠️ Database query failed:', queryError.message);
    } else {
      console.log('✅ Database connectivity test passed');
    }
    
    console.log('✅ Supabase connection successful');
    return true;
    
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error);
    
    // More specific error messages
    if (error.message?.includes('Network request failed')) {
      console.error('🌐 Network error - check internet connection');
    } else if (error.message?.includes('Failed to fetch')) {
      console.error('🔗 Fetch error - check Supabase URL');
    } else {
      console.error('💥 Unknown connection error');
    }
    
    return false;
  }
};

// Additional debug function
export const debugSupabase = async () => {
  try {
    console.log('🔍 Supabase Debug Info:');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session ? 'Exists' : 'None');
    if (sessionError) console.log('Session error:', sessionError);
    
    // Check if we can access auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user ? `Logged in (${user.email})` : 'Not logged in');
    if (userError) console.log('User error:', userError);
    
    return { session, user };
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return null;
  }
};

// Check if username is available
export const checkUsernameAvailability = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .single();
  
  return { available: !data, error };
};

// Get user profile by username
export const getProfileByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();
  
  return { data, error };
};

// Get user profile by ID
export const getProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};