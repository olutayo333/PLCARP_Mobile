import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignupMutation } from '../services/authApi';
import CustomAlert from '../utils/CustomAlert';

const Alert = CustomAlert;

const EXPERTISE_AREAS = [
  'Governance',
  'M&E',
  'Leadership',
  'Strategic visioning and planning',
  'Human resource and Finance management',
  'Resource mobilization',
  'Project development and implementation',
  'Communications and branding',
  'Partnership and network building',
  'Organizational development and Change management'
];

export function ExpertRegistrationScreen({ onBack, onComplete }: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  const [registerApi, { isLoading: registerLoading }] = useSignupMutation();

  // Step 1 Data (Credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Data (Professional Info)
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

  const toggleExpertise = (area: string) => {
    if (selectedExpertise.includes(area)) {
      setSelectedExpertise(selectedExpertise.filter((i: string) => i !== area));
    } else {
      setSelectedExpertise([...selectedExpertise, area]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password) {
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
      setStep(2);
    } else if (step === 2) {
      if (!fullName || !professionalTitle || !yearsExperience || !phoneNumber) {
        showConfirm({ title: 'Error', message: 'Please fill in all fields', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
        return;
      }
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (selectedExpertise.length === 0 || !termsAccepted) {
      showConfirm({ title: 'Error', message: 'Please select at least one area of expertise and accept terms', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }
    const payload = {
      email,
      password,
      fullName,
      role: 'EXPERT',
      title: professionalTitle,
      phoneNumber,
      yearsOfExperience: Number(yearsExperience),
      areasOfExpertise: selectedExpertise,
    };
    try {
      const response = await registerApi(payload).unwrap();
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

  const handlePrevious = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>STEP {step} OF 3</Text>
            <Text style={styles.percentageText}>{Math.round((step / 3) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Expert Registration</Text>
            <Text style={styles.subtitle}>Set up your login credentials for the Hub.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="expert@email.com"
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
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Professional Info</Text>
            <Text style={styles.subtitle}>Provide details about your expertise.</Text>

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
                <Text style={styles.label}>Professional Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Capacity Development Specialist"
                  placeholderTextColor="#9ca3af"
                  value={professionalTitle}
                  onChangeText={setProfessionalTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0800 000 0000"
                  placeholderTextColor="#9ca3af"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor="#9ca3af"
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Expertise Areas</Text>
            <Text style={styles.subtitle}>Select the fields you specialize in.</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Areas of Expertise <Text style={styles.required}>*</Text></Text>
              <View style={styles.expertiseList}>
                {EXPERTISE_AREAS.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={styles.expertiseItem}
                    onPress={() => toggleExpertise(area)}
                  >
                    <View style={[styles.checkbox, selectedExpertise.includes(area) && styles.checkboxChecked]}>
                      {selectedExpertise.includes(area) && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.expertiseText}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I verify that all informations provided is accurate and I understand the <Text style={styles.link}>Terms and Conditions</Text>.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
            <ArrowLeft size={20} color="#111827" />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, registerLoading && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={registerLoading}
          >
            {registerLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{step === 3 ? 'Complete Registration' : 'Continue'}</Text>
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
    paddingTop: 60,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0e7490',
  },
  stepContent: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  form: {
    gap: 20,
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
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  expertiseList: {
    gap: 12,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  expertiseText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  link: {
    color: '#0e7490',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0e7490',
    justifyContent: 'center',
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
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
