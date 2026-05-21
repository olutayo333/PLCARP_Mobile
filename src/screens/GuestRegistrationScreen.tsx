import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignupMutation } from '../services/authApi';
import CustomAlert from '../utils/CustomAlert';

const Alert = CustomAlert;

export function GuestRegistrationScreen({ onBack, onComplete }: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [registerApi, { isLoading: registerLoading }] = useSignupMutation();

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

  const handleContinue = async () => {
    if (!fullName || !email || !password) {
      showConfirm({ title: 'Error', message: 'Please fill in all fields', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }

    if (!emailRegex.test(email)) {
      showConfirm({ title: 'Error', message: 'Enter a valid email address', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }

    if (!passwordRegex.test(password)) {
      showConfirm({ title: 'Error', message: 'Password must contain an uppercase letter, a number and a symbol', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }

    const payload = {
      email,
      password,
      fullName,
      role: 'GUEST',
    };

    try {
      const response = await registerApi(payload).unwrap() as any;
      if (response.status) {
        // Save credentials for the verification screen
        await AsyncStorage.setItem('verificationEmail', email);
        await AsyncStorage.setItem('verificationPassword', password);
        // Immediately navigate to email verification
        onComplete();
      } else {
        showConfirm({ title: 'Error', message: response.message || 'Registration failed', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      }
    } catch (error: any) {
      const serverError = error?.data?.message || 'Registration failed. Please try again.';
      showConfirm({ title: 'Error', message: serverError, confirmText: 'Retry', hideCancel: true, onConfirm: () => { } });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Guest Registration</Text>
          <Text style={styles.subtitle}>Set up your login credentials for the Hub.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="guest@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min 8 characters"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>A minimum of 8 characters and must contain at least one Uppercase, lowercase and a special character</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.prevButton} onPress={onBack}>
            <ArrowLeft size={20} color="#111827" />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, registerLoading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={registerLoading}
          >
            {registerLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Continue</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 8,
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
  required: {
    color: '#ef4444',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
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
        outlineStyle: 'none' as any,
      },
    }),
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 40,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0e7490',
    justifyContent: 'center',
    minWidth: 140,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
