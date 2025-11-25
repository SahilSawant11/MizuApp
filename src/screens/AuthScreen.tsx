import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet as RNStyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { supabase } from '../config/supabase';
import { colors } from '../theme/colors';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'welcome' | 'phone' | 'otp' | 'username';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // Using Supabase Phone Auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phoneNumber}`,
      });

      if (error) throw error;

      Alert.alert('Success', 'OTP sent to your mobile number');
      setMode('otp');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phoneNumber}`,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        // Check if user already has a name
        if (data.user.user_metadata?.full_name) {
          onAuthSuccess();
        } else {
          setMode('username');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: username.trim() },
      });

      if (error) throw error;

      onAuthSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Welcome Screen
  if (mode === 'welcome') {
    return (
      <View style={authStyles.container}>
        <RNAnimated.View
          style={[
            authStyles.welcomeContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={authStyles.welcomeHeader}>
            <View style={authStyles.welcomeIconContainer}>
              <Text style={authStyles.welcomeIcon}>💧</Text>
            </View>
            <Text style={authStyles.welcomeTitle}>Welcome to Mizu</Text>
            <Text style={authStyles.welcomeSubtitle}>
              Your simple expense and task tracker
            </Text>
          </View>

          <View style={authStyles.featuresList}>
            <FeatureItem icon="💰" title="Track Expenses" description="Monitor your spending effortlessly" />
            <FeatureItem icon="✓" title="Manage Tasks" description="Stay organized and productive" />
            <FeatureItem icon="📊" title="View Insights" description="Understand your habits better" />
          </View>

          <View style={authStyles.welcomeFooter}>
            <TouchableOpacity
              style={authStyles.primaryButton}
              onPress={() => setMode('phone')}
            >
              <Text style={authStyles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <Text style={authStyles.termsText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </RNAnimated.View>
      </View>
    );
  }

  // Phone Number Entry
  if (mode === 'phone') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.container}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <RNAnimated.View
            style={[
              authStyles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={authStyles.backButton}
              onPress={() => setMode('welcome')}
            >
              <Text style={authStyles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={authStyles.formHeader}>
              <View style={authStyles.formIconContainer}>
                <Text style={authStyles.formIcon}>📱</Text>
              </View>
              <Text style={authStyles.formTitle}>Enter Your Mobile</Text>
              <Text style={authStyles.formSubtitle}>
                We'll send you a verification code
              </Text>
            </View>

            <View style={authStyles.inputContainer}>
              <View style={authStyles.phoneInputWrapper}>
                <View style={authStyles.countryCode}>
                  <Text style={authStyles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={authStyles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                authStyles.continueButton,
                phoneNumber.length === 10 && !loading ? authStyles.continueButtonActive : null,
              ]}
              onPress={handleSendOTP}
              disabled={phoneNumber.length !== 10 || loading}
            >
              <Text style={authStyles.continueButtonText}>
                {loading ? 'Sending...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // OTP Verification
  if (mode === 'otp') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.container}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <RNAnimated.View
            style={[
              authStyles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={authStyles.backButton}
              onPress={() => setMode('phone')}
            >
              <Text style={authStyles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={authStyles.formHeader}>
              <View style={authStyles.formIconContainer}>
                <Text style={authStyles.formIcon}>🔐</Text>
              </View>
              <Text style={authStyles.formTitle}>Enter OTP</Text>
              <Text style={authStyles.formSubtitle}>
                Code sent to +91 {phoneNumber}
              </Text>
            </View>

            <View style={authStyles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={authStyles.otpInput}
                  value={digit}
                  onChangeText={(text) => {
                    const newOtp = [...otp];
                    newOtp[index] = text;
                    setOtp(newOtp);
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textMuted}
                  editable={!loading}
                />
              ))}
            </View>

            <TouchableOpacity
              style={authStyles.resendButton}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={authStyles.resendText}>Resend Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                authStyles.continueButton,
                otp.every(d => d) && !loading ? authStyles.continueButtonActive : null,
              ]}
              onPress={handleVerifyOTP}
              disabled={!otp.every(d => d) || loading}
            >
              <Text style={authStyles.continueButtonText}>
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Username Entry
  if (mode === 'username') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.container}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <RNAnimated.View
            style={[
              authStyles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={authStyles.formHeader}>
              <View style={authStyles.formIconContainer}>
                <Text style={authStyles.formIcon}>👋</Text>
              </View>
              <Text style={authStyles.formTitle}>What's Your Name?</Text>
              <Text style={authStyles.formSubtitle}>
                Help us personalize your experience
              </Text>
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your first name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                authStyles.continueButton,
                username.trim() && !loading ? authStyles.continueButtonActive : null,
              ]}
              onPress={handleCompleteSetup}
              disabled={!username.trim() || loading}
            >
              <Text style={authStyles.continueButtonText}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return null;
};

const FeatureItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={authStyles.featureItem}>
    <View style={authStyles.featureIcon}>
      <Text style={authStyles.featureIconText}>{icon}</Text>
    </View>
    <View style={authStyles.featureContent}>
      <Text style={authStyles.featureTitle}>{title}</Text>
      <Text style={authStyles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const authStyles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
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
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textLight,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
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
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  welcomeFooter: {
    marginTop: 32,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
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
  termsText: {
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
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
    color: colors.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  countryCode: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  textInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  continueButton: {
    backgroundColor: colors.border,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
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
});