import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { initDatabase } from './src/database/db';
import { HomeScreen } from './src/screens/HomeScreen';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        console.log('✅ Database initialized successfully');
        setIsDbReady(true);
      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        setError('Failed to initialize database');
      }
    };

    setupDatabase();
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#457B9D" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

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
  },
});

export default App;