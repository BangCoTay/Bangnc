import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim(), password);
      if (email.trim().toLowerCase() === 'vankhai15052005@gmail.com') {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>AI Companions</Text>
          <Text style={styles.brandSubtitle}>Your AI friends are waiting</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brandContainer: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoGradient: {
    width: 72, height: 72, borderRadius: borderRadius.xl,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  brandTitle: {
    fontSize: typography.size['3xl'], fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.xs,
  },
  brandSubtitle: {
    fontSize: typography.size.base, color: colors.textSecondary,
  },
  form: { gap: spacing.base },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.inputBorder,
    paddingHorizontal: spacing.base,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1, height: 52, fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  eyeBtn: { padding: spacing.sm },
  forgotText: {
    fontSize: typography.size.sm, color: colors.primaryLight,
    textAlign: 'right', marginTop: -spacing.xs,
  },
  loginButton: {
    height: 54, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonText: {
    fontSize: typography.size.md, fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    fontSize: typography.size.sm, color: colors.error,
    textAlign: 'center', marginTop: spacing.sm,
  },
  registerContainer: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  registerText: { fontSize: typography.size.base, color: colors.textSecondary },
  registerLink: { fontSize: typography.size.base, color: colors.primary, fontWeight: '600' },
});
