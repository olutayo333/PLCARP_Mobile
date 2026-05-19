import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Eye, EyeOff, Check, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoginMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/userSlice';
import { showToast } from '../store/slices/uiSlice';
import CustomAlert from '../utils/CustomAlert';
import { socketService } from '../services/socketService';

const Alert = CustomAlert;

export function LoginScreen({ onLoginSuccess, onRegisterPress, onVisitorPress, onForgotPasswordPress, onVerifyEmail }: {
  onLoginSuccess: () => void;
  onRegisterPress: () => void;
  onVisitorPress: () => void;
  onForgotPasswordPress: () => void;
  onVerifyEmail: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  const handleLogin = async () => {
    if (!email || !password) {
      showConfirm({ title: 'Error', message: 'Please fill in all fields', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }
    try {
      const result = await login({ email, password }).unwrap() as any;
      if (result.status && (result.token || result.data?.token)) {
        const token = result.token || result.data?.token;
        const user = result.user || result.data?.user;

        await AsyncStorage.setItem('token', token);
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
          dispatch(setUser(user));
        }
        // Connect socket immediately so the server marks this user as globally online
        socketService.connect(token);
        dispatch(showToast({ message: 'Login successful! Welcome back.', type: 'success' }));
        onLoginSuccess();
      } else {
        const errorMsg = result?.message || result?.data?.message || '';

        // Detect unverified email — redirect to verification screen
        const isUnverified =
          (result?.statusCode === 403 || result?.data?.statusCode === 403) &&
          typeof errorMsg === 'string' &&
          errorMsg.toLowerCase().includes('verify your email');

        if (isUnverified) {
          await AsyncStorage.setItem('verificationEmail', email);
          await AsyncStorage.setItem('verificationPassword', password);
          onVerifyEmail();
          return;
        }

        showConfirm({ title: 'Login Error', message: errorMsg || 'Invalid login response', confirmText: 'Retry', hideCancel: true, onConfirm: () => { } });
      }
    } catch (error: any) {
      const serverMsg: string = error?.data?.message || error?.message || 'Something went wrong';

      // Detect unverified email thrown as an error (RTK Query unwrap throws on 4xx)
      const isUnverified =
        (error?.status === 403 || error?.data?.statusCode === 403) &&
        serverMsg.toLowerCase().includes('verify your email');

      if (isUnverified) {
        await AsyncStorage.setItem('verificationEmail', email);
        await AsyncStorage.setItem('verificationPassword', password);
        onVerifyEmail();
        return;
      }

      showConfirm({ title: 'Login Failed', message: serverMsg, confirmText: 'Try Again', hideCancel: true, onConfirm: () => { } });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <View style={styles.registerLinkContainer}>
            <Text style={styles.subtitle}>Don't have an account? </Text>
            <TouchableOpacity onPress={onRegisterPress} style={styles.registerLink}>
              <Text style={styles.registerText}>Register </Text>
              <ArrowRight size={16} color="#0e7490" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForgotPasswordPress}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.visitorButton} onPress={onVisitorPress}>
            <Text style={styles.visitorButtonText}>Continue as a Visitor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Cross-Platform CONFIRM Modal ── */}
      <Modal
        visible={!!confirmModal}
        transparent
        animationType="fade"
        onRequestClose={dismissConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
            <Text style={styles.modalMessage}>{confirmModal?.message}</Text>
            <View style={styles.modalActions}>
              {!confirmModal?.hideCancel && (
                <TouchableOpacity style={styles.modalCancelBtn} onPress={dismissConfirm}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalConfirmBtn, confirmModal?.danger && styles.modalDangerBtn]}
                onPress={() => {
                  dismissConfirm();
                  confirmModal?.onConfirm();
                }}
              >
                <Text style={styles.modalConfirmText}>{confirmModal?.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#0e7490',
    fontWeight: '600',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0e7490',
    borderColor: '#0e7490',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#0e7490',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0e7490',
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  visitorButton: {
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  visitorButtonText: {
    color: '#0e7490',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0e7490',
    alignItems: 'center',
  },
  modalDangerBtn: {
    backgroundColor: '#ef4444',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
