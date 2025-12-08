import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../config/supabase';

type AuthMode = 'welcome' | 'signup' | 'login';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useUsernameLogin, setUseUsernameLogin] = useState(false);

  const handleUsernameSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    console.log('📝 Attempting sign up with username:', username);
    setLoading(true);
    
    try {
      // Step 1: Check if username is available
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username already taken');
      }

      // Step 2: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.toLowerCase(),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Step 3: Create profile in public.profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: username.toLowerCase(),
              email: email.trim(),
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Delete the auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('Failed to create profile');
        }

        console.log('✅ Sign up successful!');
        Alert.alert(
          'Success!',
          'Account created! Please check your email to verify your account.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Switch to login mode
                setMode('login');
                setUsername('');
                setEmail('');
                setPassword('');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ SignUp Error:', error);
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSignIn = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    console.log('🔑 Attempting sign in with username:', username);
    setLoading(true);
    
    try {
      // Step 1: Get email from username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username.toLowerCase())
        .single();

      if (profileError || !profile) {
        throw new Error('Invalid username or password');
      }

      // Step 2: Sign in with email (from profile) and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      console.log('📤 SignIn Response:', {
        hasError: !!authError,
        error: authError?.message,
        userEmail: authData?.user?.email,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid username or password');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email first');
        }
        throw authError;
      }

      console.log('✅ SignIn Successful!');
      // Auth state will update automatically via onAuthStateChange
      
    } catch (error: any) {
      console.error('💥 SignIn Error:', error);
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Sign In Failed', 'Wrong email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email Not Verified', 'Please check your email and verify your account first.');
        } else {
          Alert.alert('Sign In Failed', error.message);
        }
        throw error;
      }
    } catch (error: any) {
      // Error already handled above
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Welcome Screen (unchanged)
  if (mode === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logo}>☘️</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.appName}>Mizu App</Text>
          {/* <Text style={styles.tagline}>Track expenses, stay on budget</Text> */}

          {/* Features */}
          {/* <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Smart Budget Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Expense Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureText}>Secure & Private</Text>
            </View>
          </View> */}

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setMode('signup');
                setUseUsernameLogin(true);
              }}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setMode('login');
                setUseUsernameLogin(true);
              }}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Sign Up / Sign In Screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.authContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('welcome')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.authHeader}>
            <View style={styles.logoCircleSmall}>
              <Text style={styles.logoSmall}>☘️</Text>
            </View>
            <Text style={styles.authTitle}>
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.authSubtitle}>
              {mode === 'signup'
                ? 'Start tracking your finances'
                : 'Sign in to continue'}
            </Text>
          </View>

            {/* Form */}
            <View style={styles.formContainer}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="User Name"
                placeholderTextColor="#9DB4A8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              </View>
              {mode === 'signup' && (
              <Text style={styles.hint}>3-20 letters, numbers, or underscores</Text>
              )}
            </View>

            {/* Email Input (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9DB4A8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                />
              </View>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {mode === 'login' && (
                  <TouchableOpacity>
                    <Text style={styles.forgotLink}>Forgot?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9DB4A8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {mode === 'signup' && (
                <Text style={styles.hint}>At least 8 characters</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={() => {
                if (mode === 'signup') {
                  handleUsernameSignUp();
                } else if (useUsernameLogin) {
                  handleUsernameSignIn();
                } else {
                  handleEmailSignIn();
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* Google Sign In */}
          {/* <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity> */}

          {/* Toggle Sign In/Up */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {mode === 'signup'
                ? 'Already have an account? '
                : "Don't have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            >
              <Text style={styles.toggleLink}>
                {mode === 'signup' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
  },
  keyboardView: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6BCF9F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6BCF9F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    fontSize: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1A3A2E',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    color: '#5F7A6F',
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#1A3A2E',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6BCF9F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5EE',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A3A2E',
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#5F7A6F',
    fontWeight: '600',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6BCF9F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSmall: {
    fontSize: 32,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 15,
    color: '#5F7A6F',
  },
  loginTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F7A6F',
  },
  toggleButtonTextActive: {
    color: '#6BCF9F',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A2E',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 14,
    color: '#6BCF9F',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A3A2E',
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  hint: {
    fontSize: 12,
    color: '#9DB4A8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6BCF9F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8F5EE',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9DB4A8',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    color: '#1A3A2E',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A2E',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
    color: '#5F7A6F',
  },
  toggleLink: {
    fontSize: 14,
    color: '#6BCF9F',
    fontWeight: '700',
  },
});