import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { testConnection } from './src/config/supabase';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

function AppContent() {
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
        <Text style={styles.errorSubtext}>Please check your configuration</Text>
      </View>
    );
  }

  // Show loading state while initializing
  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#457B9D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show app with navigation
  console.log('✅ App ready, showing navigation');
  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
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