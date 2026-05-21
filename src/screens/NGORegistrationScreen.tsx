import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ChevronDown, Check, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignupMutation } from '../services/authApi';
import { NIGERIA_STATES_LGAS } from '../constants/statesAndLgas';
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

const Wrapper = Platform.OS === 'ios'
  ? ({ children }: { children: React.ReactNode }) => (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: '#fff' }}>
      {children}
    </KeyboardAvoidingView>
  )
  : ({ children }: { children: React.ReactNode }) => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>{children}</View>
  );

export function NGORegistrationScreen({ onBack, onComplete }: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [registerApi, { isLoading: registerLoading }] = useSignupMutation();

  // Step 1 Data (Credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Data (Personal Info)
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [areasOfExpertise, setAreasOfExpertise] = useState<string[]>([]);

  // Step 3 Data (Org Info)
  const [orgName, setOrgName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');

  // New NGO Fields
  const [isLocalOrNational, setIsLocalOrNational] = useState<boolean | null>(null);
  const [hasHumanitarianExperience, setHasHumanitarianExperience] = useState<boolean | null>(null);
  const [isInterestedInTraining, setIsInterestedInTraining] = useState<boolean | null>(null);

  // UI State for Pickers
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showLGAPicker, setShowLGAPicker] = useState(false);

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

  const toggleExpertise = (area: string) => {
    if (areasOfExpertise.includes(area)) {
      setAreasOfExpertise(areasOfExpertise.filter((i: string) => i !== area));
    } else {
      setAreasOfExpertise([...areasOfExpertise, area]);
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
      if (!fullName || !title || !personalPhone || !yearsOfExperience || areasOfExpertise.length === 0 || !termsAccepted) {
        showConfirm({ title: 'Error', message: 'Please fill in all fields, select expertise and accept terms', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
        return;
      }
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!orgName || !cacNumber || !orgPhone || !state || !lga || !address || isLocalOrNational === null || hasHumanitarianExperience === null || isInterestedInTraining === null) {
      showConfirm({ title: 'Error', message: 'Please fill in all organisation fields and answer all questions', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }

    const payload = {
      email,
      password,
      fullName,
      role: 'NGO_MEMBER',
      orgName,
      cacNumber,
      orgPhoneNumber: orgPhone,
      state,
      lga,
      title,
      phoneNumber: personalPhone,
      yearsOfExperience: Number(yearsOfExperience),
      areasOfExpertise,
      address,
      isLocalOrNational,
      hasHumanitarianExperience,
      isInterestedInTraining,
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

  const handlePrevious = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const renderStatePicker = () => (
    <Modal visible={showStatePicker} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStatePicker(false)}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={Object.keys(NIGERIA_STATES_LGAS).sort()}
            keyExtractor={(item: string) => item}
            renderItem={({ item }: { item: string }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setState(item);
                  setLga('');
                  setShowStatePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{item}</Text>
                {state === item && <Check size={20} color="#0e7490" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderLGAPicker = () => (
    <Modal visible={showLGAPicker} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select LGA</Text>
            <TouchableOpacity onPress={() => setShowLGAPicker(false)}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={state ? NIGERIA_STATES_LGAS[state].sort() : []}
            keyExtractor={(item: string) => item}
            renderItem={({ item }: { item: string }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setLga(item);
                  setShowLGAPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{item}</Text>
                {lga === item && <Check size={20} color="#0e7490" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <Wrapper>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.title}>NGO Registration</Text>
            <Text style={styles.subtitle}>Set up your login credentials for the Hub.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="org@email.com"
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
            <Text style={styles.title}>Personal Info</Text>
            <Text style={styles.subtitle}>Tell us about the person registering the NGO.</Text>

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
                <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dr., Prof., Engr."
                  placeholderTextColor="#9ca3af"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0800 000 0000"
                  placeholderTextColor="#9ca3af"
                  value={personalPhone}
                  onChangeText={(text: string) => setPersonalPhone(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor="#9ca3af"
                  value={yearsOfExperience}
                  onChangeText={(text: string) => setYearsOfExperience(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Areas of Expertise <Text style={styles.required}>*</Text></Text>
                <View style={styles.expertiseList}>
                  {EXPERTISE_AREAS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.expertiseItem}
                      onPress={() => toggleExpertise(item)}
                    >
                      <View style={[styles.checkbox, areasOfExpertise.includes(item) && styles.checkboxChecked]}>
                        {areasOfExpertise.includes(item) && <Check size={14} color="#fff" />}
                      </View>
                      <Text style={styles.expertiseText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I have read and understand the <Text style={styles.link}>Terms and Conditions</Text> and agree to join the training/mentorship program, or the Hub community. I confirm all information provided is accurate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>About your organisation</Text>
            <Text style={styles.subtitle}>Tell us about the NGO you are registering.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name of Organisation <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full registered name of organisation"
                  placeholderTextColor="#9ca3af"
                  value={orgName}
                  onChangeText={setOrgName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CAC Registration Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="RC123456"
                  placeholderTextColor="#9ca3af"
                  value={cacNumber}
                  onChangeText={setCacNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organisation Phone Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0801 234 5678"
                  placeholderTextColor="#9ca3af"
                  value={orgPhone}
                  onChangeText={(text: string) => setOrgPhone(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowStatePicker(true)}>
                  <Text style={[styles.dropdownText, !state && { color: '#9ca3af' }]}>{state || 'Select state...'}</Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>LGA <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.dropdown, !state && { backgroundColor: '#f3f4f6' }]}
                  onPress={() => state && setShowLGAPicker(true)}
                  disabled={!state}
                >
                  <Text style={[styles.dropdownText, !lga && { color: '#9ca3af' }]}>{lga || 'Select LGA...'}</Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Physical Address <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Street address"
                  placeholderTextColor="#9ca3af"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Is a local/national organization in Nigeria? <Text style={styles.required}>*</Text></Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setIsLocalOrNational(true)}>
                    <View style={[styles.radioOuter, isLocalOrNational === true && styles.radioOuterSelected]}>
                      {isLocalOrNational === true && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setIsLocalOrNational(false)}>
                    <View style={[styles.radioOuter, isLocalOrNational === false && styles.radioOuterSelected]}>
                      {isLocalOrNational === false && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Has experience working in humanitarian contexts? <Text style={styles.required}>*</Text></Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setHasHumanitarianExperience(true)}>
                    <View style={[styles.radioOuter, hasHumanitarianExperience === true && styles.radioOuterSelected]}>
                      {hasHumanitarianExperience === true && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setHasHumanitarianExperience(false)}>
                    <View style={[styles.radioOuter, hasHumanitarianExperience === false && styles.radioOuterSelected]}>
                      {hasHumanitarianExperience === false && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Interested in training and mentorship programs? <Text style={styles.required}>*</Text></Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setIsInterestedInTraining(true)}>
                    <View style={[styles.radioOuter, isInterestedInTraining === true && styles.radioOuterSelected]}>
                      {isInterestedInTraining === true && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.radioOption} onPress={() => setIsInterestedInTraining(false)}>
                    <View style={[styles.radioOuter, isInterestedInTraining === false && styles.radioOuterSelected]}>
                      {isInterestedInTraining === false && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmModal?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmModal?.message}</Text>
            <View style={styles.confirmActions}>
              {!confirmModal?.hideCancel && (
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={dismissConfirm}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.confirmOkBtn, confirmModal?.danger && styles.confirmDangerBtn]}
                onPress={() => {
                  dismissConfirm();
                  confirmModal?.onConfirm();
                }}
              >
                <Text style={styles.confirmOkText}>{confirmModal?.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderStatePicker()}
      {renderLGAPicker()}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
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
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  // Premium Confirmation Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
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
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmOkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0e7490',
    alignItems: 'center',
  },
  confirmDangerBtn: {
    backgroundColor: '#ef4444',
  },
  confirmOkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0e7490',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0e7490',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
});
