// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔍 Initial auth state:', {
          hasSession: !!session,
          userId: session?.user?.id?.substring(0, 8),
        });
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id?.substring(0, 8));
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle session persistence
        if (session) {
          // Session exists - store it
          await AsyncStorage.setItem('@mizu_user_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user_id: session.user.id,
          }));
        } else {
          // No session - clear storage
          await AsyncStorage.removeItem('@mizu_user_session');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@mizu_user_session');
      await AsyncStorage.removeItem('@mizu_user_data');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};