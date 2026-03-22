import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {CheckCircle2} from 'lucide-react-native';

export function RegistrationCompleteScreen({onGoHome}: {onGoHome: () => void}) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={80} color="#0e7490" />
        </View>
        
        <Text style={styles.title}>Registration complete</Text>
        
        <Text style={styles.description}>
          Your NGO registration has been received and is under review. You'll receive a confirmation email within 24-48 hours. Once approved, you can complete your organisation profile and access all Hub features.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onGoHome}>
          <Text style={styles.buttonText}>Go to Homepage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 24,
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0e7490',
    height: 56,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
