import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { testConnection } from './src/config/supabase';
import { HomeScreen } from './src/screens/HomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

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

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.errorSubtext}>Please check your Supabase configuration</Text>
      </View>
    );
  }

  // Show loading state
  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#457B9D" />
        <Text style={styles.loadingText}>Connecting to Supabase...</Text>
      </View>
    );
  }

  // Show main app
  return <HomeScreen />;
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