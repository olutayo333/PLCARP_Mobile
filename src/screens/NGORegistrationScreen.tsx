import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {ArrowLeft, ArrowRight, Eye, EyeOff, ChevronDown, Check} from 'lucide-react-native';

export function NGORegistrationScreen({onBack, onComplete}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 1 Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Data
  const [orgName, setOrgName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      setStep(2);
    } else {
      if (!orgName || !cacNumber || !phone || !state || !lga || !address || !termsAccepted) {
        Alert.alert('Error', 'Please fill in all fields and accept terms');
        return;
      }
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>STEP {step} OF 2</Text>
            <Text style={styles.percentageText}>{step === 1 ? '50%' : '100%'}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: step === 1 ? '50%' : '100%'}]} />
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.stepContent}>
            <Text style={styles.title}>NGO Registration</Text>
            <Text style={styles.subtitle}>Set up your login credentials for the Hub.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
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
                <Text style={styles.label}>Password</Text>
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
        ) : (
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
                <Text style={styles.label}>Phone number <Text style={styles.required}>*</Text></Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0801 234 5678"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={[styles.dropdownText, !state && {color: '#9ca3af'}]}>{state || 'Select state...'}</Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>LGA</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Local Government Area"
                  placeholderTextColor="#9ca3af"
                  value={lga}
                  onChangeText={setLga}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Physical Address</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Street address"
                  placeholderTextColor="#9ca3af"
                  value={address}
                  onChangeText={setAddress}
                />
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

        <View style={styles.footer}>
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
            <ArrowLeft size={20} color="#111827" />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Continue</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
