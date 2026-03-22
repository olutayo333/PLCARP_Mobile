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
import {ArrowLeft, ArrowRight, Eye, EyeOff, Check} from 'lucide-react-native';

const EXPERTISE_AREAS = [
  'Leadership',
  'Strategic visioning and planning',
  'Effective governance',
  'Human resource and Finance management',
  'Resource mobilization',
  'Project development and implementation',
  'Communications and branding',
  'Partnership and network building',
  'Organizational development and Change management',
];

export function ExpertRegistrationScreen({onBack, onComplete}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  // Step 1 Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Data
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  const toggleExpertise = (area: string) => {
    if (selectedExpertise.includes(area)) {
      setSelectedExpertise(selectedExpertise.filter(i => i !== area));
    } else {
      setSelectedExpertise([...selectedExpertise, area]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!fullName || !professionalTitle || !yearsExperience) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      setStep(3);
    } else {
      if (selectedExpertise.length === 0 || !termsAccepted) {
        Alert.alert('Error', 'Please select at least one area of expertise and accept terms');
        return;
      }
      onComplete();
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>STEP {step} OF 3</Text>
            <Text style={styles.percentageText}>{Math.round((step / 3) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${(step / 3) * 100}%`}]} />
          </View>
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Expert Registration</Text>
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
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>About your organisation</Text>
            <Text style={styles.subtitle}>Tell us about the NGO you are registering.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
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
                <Text style={styles.label}>Years of Experience <Text style={styles.required}>*</Text></Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 5 years"
                  placeholderTextColor="#9ca3af"
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>About your organisation</Text>
            <Text style={styles.subtitle}>Tell us about the NGO you are registering.</Text>

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
