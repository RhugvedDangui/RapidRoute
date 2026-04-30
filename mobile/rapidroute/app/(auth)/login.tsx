import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPhone } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const digits = phone.replace(/\D/g, '');
    
    if (!digits || digits.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const last10 = digits.slice(-10);
      const formattedPhone = `+91${last10}`;
      await signInWithPhone(formattedPhone);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Phone number not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.title}>RapidRoute</Text>
          <Text style={styles.subtitle}>Driver App</Text>
        </View>

        {/* Phone Input */}
        <Text style={styles.heading}>Enter Your Phone</Text>
        <Text style={styles.description}>
          Enter the phone number registered with your driver account
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="7890123403"
            placeholderTextColor="#52525b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={14}
            autoFocus
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.buttonText}>LOGIN →</Text>
          )}
        </TouchableOpacity>

        {/* Test accounts hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>TEST ACCOUNTS</Text>
          <Text style={styles.hintText}>7890123401 — Vikram Kamat</Text>
          <Text style={styles.hintText}>7890123402 — Rahul Sawant</Text>
          <Text style={styles.hintText}>7890123403 — Santosh Naik</Text>
          <Text style={styles.hintText}>7890123404 — Deepak Dessai</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to RapidRoute's{'\n'}
            Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#000000',
    fontSize: 36,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 8,
  },
  heading: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#27272a',
    color: '#ffffff',
    fontSize: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 16,
  },
  otpInput: {
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#27272a',
    color: '#ffffff',
    fontSize: 36,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 16,
    textAlign: 'center',
    letterSpacing: 16,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  resendButton: {
    paddingVertical: 16,
    marginTop: 16,
  },
  resendText: {
    color: '#a1a1aa',
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    right: 32,
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
  },
  hintBox: {
    marginTop: 24,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 16,
  },
  hintTitle: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hintText: {
    color: '#a1a1aa',
    fontSize: 13,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
});
