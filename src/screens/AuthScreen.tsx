import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'welcome' | 'login' | 'register';

const STORAGE_KEY_USER = '@mizu_user_session';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  const checkExistingSession = async () => {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEY_USER);
      
      if (session) {
        const sessionData = JSON.parse(session);
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });

        if (!error) {
          console.log('✅ Auto-login successful');
          onAuthSuccess();
        }
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
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
        console.log('✅ Session saved');
      }
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  };

  const hashPin = (pinValue: string): string => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < pinValue.length; i++) {
      const char = pinValue.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const handleRegister = async () => {
    if (!username.trim() || !mobile || !pin) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const email = `${mobile}@mizu.app`;
      const hashedPin = hashPin(pin);

      console.log('🔄 Starting registration...');

      // STEP 1: Check if mobile already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('mobile', mobile)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'Mobile number already registered');
        return;
      }

      // STEP 2: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: hashedPin,
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        
        // If user already exists, try to sign in
        if (authError.message.includes('already registered')) {
          await handleExistingUserLogin(mobile, pin);
          return;
        }
        
        throw authError;
      }

      console.log('✅ Auth user created:', authData.user?.id);

      if (authData.user) {
        // STEP 3: Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: username.trim(),
            mobile: mobile,
            pin_hash: hashedPin,
            email: email,
            full_name: username.trim(),
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('❌ Profile error:', profileError);
          throw profileError;
        }

        console.log('✅ User profile created');

        // STEP 4: Sign in automatically
        await handleLogin(mobile, pin);
      }

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loginMobile?: string, loginPin?: string) => {
    const useMobile = loginMobile || mobile;
    const usePin = loginPin || pin;

    if (!useMobile || !usePin) {
      Alert.alert('Error', 'Please enter mobile number and PIN');
      return;
    }

    if (useMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const email = `${useMobile}@mizu.app`;
      const hashedPin = hashPin(usePin);

      console.log('🔄 Attempting login...');

      // STEP 1: Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: hashedPin,
      });

      if (error) {
        console.error('❌ Login error:', error);
        
        // Check if user exists in our database but auth failed
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('mobile', useMobile)
          .single();

        if (dbUser) {
          Alert.alert('Error', 'Invalid PIN');
        } else {
          Alert.alert('Error', 'Mobile number not registered');
        }
        return;
      }

      console.log('✅ Login successful');

      // STEP 2: Save session and proceed
      await saveSession();
      onAuthSuccess();

    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExistingUserLogin = async (existingMobile: string, existingPin: string) => {
    // User exists in auth but we need to check if profile exists
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('mobile', existingMobile)
      .single();

    if (!profile) {
      // Create profile for existing auth user
      const email = `${existingMobile}@mizu.app`;
      const hashedPin = hashPin(existingPin);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('users').insert({
          id: user.id,
          username: username.trim(),
          mobile: existingMobile,
          pin_hash: hashedPin,
          email: email,
          full_name: username.trim(),
          created_at: new Date().toISOString(),
        });
      }
    }

    // Now login
    await handleLogin(existingMobile, existingPin);
  };

  const handleResetApp = async () => {
    Alert.alert(
      'Reset App',
      'This will clear all your data and logout. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY_USER);
              await supabase.auth.signOut();
              setMobile('');
              setPin('');
              setConfirmPin('');
              setUsername('');
              setMode('welcome');
            } catch (error) {
              console.error('❌ Reset error:', error);
            }
          },
        },
      ]
    );
  };

  // Welcome Screen
  if (mode === 'welcome') {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.welcomeContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeIconContainer}>
              <Text style={styles.welcomeIcon}>💧</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Mizu</Text>
            <Text style={styles.welcomeSubtitle}>
              Your simple expense and task tracker
            </Text>
          </View>

          <View style={styles.featuresList}>
            <FeatureItem icon="💰" title="Track Expenses" description="Monitor your spending effortlessly" />
            <FeatureItem icon="✓" title="Manage Tasks" description="Stay organized and productive" />
            <FeatureItem icon="📊" title="View Insights" description="Understand your habits better" />
          </View>

          <View style={styles.welcomeFooter}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setMode('register')}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setMode('login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Registration Screen
  if (mode === 'register') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode('welcome')}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <Text style={styles.formIcon}>👤</Text>
              </View>
              <Text style={styles.formTitle}>Create Account</Text>
              <Text style={styles.formSubtitle}>
                Join Mizu to track your expenses
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Your Name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                editable={!loading}
              />
              
              <TextInput
                style={styles.textInput}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile Number (10 digits)"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
              
              <TextInput
                style={styles.textInput}
                value={pin}
                onChangeText={setPin}
                placeholder="PIN (4-6 digits)"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
              
              <TextInput
                style={styles.textInput}
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Confirm PIN"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                username.trim() && mobile.length === 10 && pin.length >= 4 && confirmPin && !loading 
                  ? styles.continueButtonActive 
                  : null,
              ]}
              onPress={handleRegister}
              disabled={!username.trim() || mobile.length !== 10 || pin.length < 4 || !confirmPin || loading}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setMode('login')}
            >
              <Text style={styles.switchModeText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Login Screen
  if (mode === 'login') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode('welcome')}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <Text style={styles.formIcon}>🔐</Text>
              </View>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>
                Sign in to your account
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
              
              <TextInput
                style={styles.textInput}
                value={pin}
                onChangeText={setPin}
                placeholder="PIN"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                mobile.length === 10 && pin.length >= 4 && !loading 
                  ? styles.continueButtonActive 
                  : null,
              ]}
              onPress={() => handleLogin()}
              disabled={mobile.length !== 10 || pin.length < 4 || loading}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setMode('register')}
            >
              <Text style={styles.switchModeText}>
                Don't have an account? Create One
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetApp}
            >
              <Text style={styles.resetButtonText}>Reset App</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return null;
};


const FeatureItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Text style={styles.featureIconText}>{icon}</Text>
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6BCF9F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: 'rgba(107, 207, 159, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeIcon: {
    fontSize: 60,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A3A2E',
    marginBottom: 12,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#5F7A6F',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresList: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(107, 207, 159, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#5F7A6F',
    lineHeight: 20,
  },
  welcomeFooter: {
    marginTop: 32,
  },
  primaryButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(107, 207, 159, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6BCF9F',
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6BCF9F',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: '#9DB4A8',
    textAlign: 'center',
    lineHeight: 18,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: 'rgba(107, 207, 159, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 24,
    color: '#1A3A2E',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  formIcon: {
    fontSize: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A3A2E',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#5F7A6F',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A2E',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#D4E8DD',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonActive: {
    backgroundColor: '#6BCF9F',
    shadowColor: 'rgba(107, 207, 159, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  switchModeButton: {
    padding: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6BCF9F',
  },
  resetButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#9DB4A8',
  },
});

export default AuthScreen;