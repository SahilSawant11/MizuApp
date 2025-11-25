// src/components/DebugAuthHelper.tsx
// Add this temporarily to your HomeScreen to debug and clear auth

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuthHelper: React.FC = () => {
  const { user, session } = useAuth();

  const handleClearAll = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared');

      // Sign out from Supabase
      await supabase.auth.signOut();
      console.log('✅ Signed out from Supabase');

      Alert.alert(
        'Success',
        'Storage cleared and signed out. App should reload to login screen.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Clear error:', error);
      Alert.alert('Error', 'Failed to clear storage');
    }
  };

  const handleCheckAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const allKeys = await AsyncStorage.getAllKeys();
      const storage = await AsyncStorage.multiGet(allKeys);
      
      console.log('🔍 Auth Debug Info:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        storageKeys: allKeys,
        storage: storage,
      });

      Alert.alert(
        'Auth Debug',
        `Session: ${session ? 'EXISTS' : 'NULL'}\n` +
        `User: ${session?.user?.email || 'None'}\n` +
        `Storage Keys: ${allKeys.length}\n\n` +
        `Check console for details`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  };

  // Only show in development
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Tools</Text>
      
      <View style={styles.info}>
        <Text style={styles.infoText}>
          User: {user?.email || 'Not logged in'}
        </Text>
        <Text style={styles.infoText}>
          Session: {session ? 'Active' : 'None'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCheckAuth}>
        <Text style={styles.buttonText}>Check Auth Status</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.dangerButton]} 
        onPress={handleClearAll}
      >
        <Text style={styles.buttonText}>Clear Storage & Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFE69C',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 12,
  },
  info: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#457B9D',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButton: {
    backgroundColor: '#E63946',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});