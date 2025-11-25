import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { testConnection } from './src/config/supabase';
import { HomeScreen } from './src/screens/HomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { PinAuthScreen } from './src/screens/PinAuthScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const connected = await testConnection();
        
        if (!connected) {
          setError('Failed to connect to Supabase');
          return;
        }

        console.log('✅ App initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('❌ App initialization failed:', err);
        setError('Failed to initialize app');
      }
    };

    initializeApp();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Auth State:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8),
      authLoading,
      isReady,
      showSplash,
    });
  }, [user, authLoading, isReady, showSplash]);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.errorSubtext}>Please check your configuration</Text>
      </View>
    );
  }

  // Show loading state while checking auth or initializing
  if (!isReady || authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#457B9D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show PIN auth screen if not logged in
  if (!user) {
    console.log('👤 No user found, showing PIN auth screen');
    return <PinAuthScreen onAuthSuccess={() => console.log('✅ Auth success!')} />;
  }

  // Show main app
  console.log('✅ User authenticated, showing home screen');
  return <HomeScreen />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E63946',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default App;