import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { authService } from '../../src/services/auth.service';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {sent ? 'Check your email for a reset link.' : 'Enter your email to receive a password reset link.'}
        </Text>

        {!sent ? (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity onPress={handleSend} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, paddingTop: spacing['3xl'], justifyContent: 'flex-start' },
  backBtn: { marginBottom: spacing.xl },
  title: {
    fontSize: typography.size['3xl'], fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base, color: colors.textSecondary,
    marginBottom: spacing.xl, lineHeight: typography.lineHeight.base,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.inputBorder,
    paddingHorizontal: spacing.base, marginBottom: spacing.lg,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1, height: 52, fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  button: {
    height: 54, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { fontSize: typography.size.md, fontWeight: '600', color: '#fff' },
});
