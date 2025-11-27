// ==============================================
// Updated PinAuthScreen.tsx
// This version creates ONE persistent anonymous user
// ==============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Vibration,
} from 'react-native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PinAuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'welcome' | 'setup' | 'confirm' | 'enter';

const STORAGE_KEY_PIN = '@mizu_pin_hash';
const STORAGE_KEY_USER = '@mizu_user_session';

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkExistingSetup();
  }, []);

  const checkExistingSetup = async () => {
    try {
      const storedPin = await AsyncStorage.getItem(STORAGE_KEY_PIN);
      const storedSession = await AsyncStorage.getItem(STORAGE_KEY_USER);
      
      console.log('🔍 Checking existing setup:', { hasPin: !!storedPin, hasSession: !!storedSession });
      
      if (storedPin && storedSession) {
        // User has both PIN and session - show PIN entry
        const sessionData = JSON.parse(storedSession);
        
        // Restore the session in Supabase
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
        
        if (!error) {
          console.log('✅ Session restored, showing PIN entry');
          setMode('enter');
        } else {
          console.log('⚠️ Session expired, need to re-authenticate');
          setMode('welcome');
        }
      } else if (storedPin && !storedSession) {
        // Has PIN but no session - show PIN entry to re-authenticate
        console.log('⚠️ Has PIN but no session');
        setMode('enter');
      } else {
        // First time user
        console.log('👤 First time user');
        setMode('welcome');
      }
    } catch (error) {
      console.error('❌ Error checking setup:', error);
      setMode('welcome');
    }
  };

  const hashPin = (pinValue: string): string => {
    let hash = 0;
    for (let i = 0; i < pinValue.length; i++) {
      const char = pinValue.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const verifyPin = async (enteredPin: string): Promise<boolean> => {
    try {
      const storedHash = await AsyncStorage.getItem(STORAGE_KEY_PIN);
      if (!storedHash) return false;
      return hashPin(enteredPin) === storedHash;
    } catch (error) {
      console.error('❌ Error verifying PIN:', error);
      return false;
    }
  };

  const savePin = async (pinValue: string) => {
    try {
      const hash = hashPin(pinValue);
      await AsyncStorage.setItem(STORAGE_KEY_PIN, hash);
      console.log('✅ PIN saved');
    } catch (error) {
      console.error('❌ Error saving PIN:', error);
      throw error;
    }
  };

  const saveSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user_id: session.user.id,
        }));
        console.log('✅ Session saved:', session.user.id);
      }
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  };

  const shakeAnimation = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleNumberPress = (num: string) => {
    if (mode === 'setup') {
      if (setupPin.length < 6) {
        setSetupPin(setupPin + num);
      }
    } else if (mode === 'confirm') {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length >= 3 && newPin.length <= 6) {
          if (newPin === setupPin) {
            handleConfirmPin(newPin);
          }
        }
      }
    } else if (mode === 'enter') {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length >= 3) {
          handleEnterPin(newPin);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (mode === 'setup') {
      setSetupPin(setupPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleSetupComplete = () => {
    if (setupPin.length < 3) {
      Alert.alert('Error', 'PIN must be at least 3 digits');
      shakeAnimation();
      return;
    }
    if (setupPin.length > 6) {
      Alert.alert('Error', 'PIN must be at most 6 digits');
      shakeAnimation();
      return;
    }
    setMode('confirm');
  };

  const handleConfirmPin = async (confirmedPin: string) => {
    if (confirmedPin !== setupPin) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      shakeAnimation();
      setPin('');
      setSetupPin('');
      setMode('setup');
      return;
    }

    setLoading(true);
    try {
      // Save PIN first
      await savePin(confirmedPin);
      console.log('✅ PIN confirmed and saved');

      // Check if session already exists
      const storedSession = await AsyncStorage.getItem(STORAGE_KEY_USER);
      
      if (storedSession) {
        // Restore existing session
        const sessionData = JSON.parse(storedSession);
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
        
        if (!error) {
          console.log('✅ Existing session restored');
          Vibration.vibrate(50);
          onAuthSuccess();
          return;
        }
      }

      // Create new anonymous user (ONLY if no existing session)
      console.log('🆕 Creating new anonymous user...');
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;

      console.log('✅ New user created:', data.user?.id);
      
      // Save the new session
      await saveSession();

      Vibration.vibrate(50);
      onAuthSuccess();
    } catch (error: any) {
      console.error('❌ Setup error:', error);
      Alert.alert('Error', error.message);
      setPin('');
      setSetupPin('');
      setMode('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterPin = async (enteredPin: string) => {
    setLoading(true);
    try {
      const isValid = await verifyPin(enteredPin);
      
      if (!isValid) {
        shakeAnimation();
        Alert.alert('Incorrect PIN', 'Please try again');
        setPin('');
        setLoading(false);
        return;
      }

      console.log('✅ PIN verified');

      // Try to restore existing session
      const storedSession = await AsyncStorage.getItem(STORAGE_KEY_USER);
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        console.log('🔄 Restoring session for user:', sessionData.user_id);
        
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
        
        if (!error) {
          console.log('✅ Session restored successfully');
          Vibration.vibrate(50);
          onAuthSuccess();
          return;
        }
        
        console.log('⚠️ Session expired, creating new one');
      }

      // If session restoration failed, create new anonymous user
      console.log('🆕 Creating new session...');
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;

      console.log('✅ New session created:', data.user?.id);
      await saveSession();

      Vibration.vibrate(50);
      onAuthSuccess();
    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', error.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset App',
      'This will clear your PIN and all data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY_PIN);
              await AsyncStorage.removeItem(STORAGE_KEY_USER);
              await supabase.auth.signOut();
              setPin('');
              setSetupPin('');
              setMode('welcome');
              console.log('✅ App reset complete');
            } catch (error) {
              console.error('❌ Reset error:', error);
            }
          },
        },
      ]
    );
  };

  const renderPinDots = () => {
    const currentPin = mode === 'setup' ? setupPin : pin;
    const dots = [];
    
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < currentPin.length && styles.pinDotFilled,
          ]}
        />
      );
    }
    
    return dots;
  };

  // Welcome Screen
  if (mode === 'welcome') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💧</Text>
          </View>
          
          <Text style={styles.welcomeTitle}>Welcome to Mizu</Text>
          <Text style={styles.welcomeSubtitle}>
            Your personal finance tracker
          </Text>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => setMode('setup')}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.secureText}>🔒 Secured with PIN</Text>
        </Animated.View>
      </View>
    );
  }

  // Setup, Confirm, or Enter PIN Screen
  return (
    <View style={styles.container}>
      <View style={styles.pinContainer}>
        <Text style={styles.pinTitle}>
          {mode === 'setup' && 'Create Your PIN'}
          {mode === 'confirm' && 'Confirm Your PIN'}
          {mode === 'enter' && 'Enter Your PIN'}
        </Text>
        
        <Text style={styles.pinSubtitle}>
          {mode === 'setup' && '3-6 digits to secure your account'}
          {mode === 'confirm' && 'Re-enter your PIN to confirm'}
          {mode === 'enter' && 'Welcome back!'}
        </Text>

        <Animated.View 
          style={[
            styles.dotsContainer,
            { transform: [{ translateX: shakeAnim }] }
          ]}
        >
          {renderPinDots()}
        </Animated.View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', '⌫'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numberRow}>
              {row.map((num, colIndex) => {
                if (num === '') {
                  return <View key={colIndex} style={styles.numberButton} />;
                }
                
                if (num === '⌫') {
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.numberButton}
                      onPress={handleBackspace}
                      disabled={loading}
                    >
                      <Text style={styles.backspaceText}>{num}</Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={styles.numberButton}
                    onPress={() => handleNumberPress(num)}
                    disabled={loading}
                  >
                    <Text style={styles.numberText}>{num}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {mode === 'setup' && setupPin.length >= 3 && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSetupComplete}
            disabled={loading}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}

        {mode === 'enter' && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6BCF9F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: 'rgba(107, 207, 159, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 64,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#5F7A6F',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 12,
    shadowColor: 'rgba(107, 207, 159, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secureText: {
    fontSize: 14,
    color: '#9DB4A8',
    marginTop: 16,
  },
  pinContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinSubtitle: {
    fontSize: 16,
    color: '#5F7A6F',
    marginBottom: 48,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 64,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4E8DD',
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  pinDotFilled: {
    backgroundColor: '#6BCF9F',
    borderColor: '#6BCF9F',
  },
  numberPad: {
    width: '100%',
    maxWidth: 320,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(107, 207, 159, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  numberText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1A3A2E',
  },
  backspaceText: {
    fontSize: 28,
    color: '#5F7A6F',
  },
  continueButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 32,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    marginTop: 32,
    padding: 12,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6BCF9F',
    fontWeight: '600',
  },
});

export default PinAuthScreen;