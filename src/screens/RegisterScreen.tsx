import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowRight, Users, UserCheck, UserPlus } from 'lucide-react-native';

export function RegisterScreen({ onBackToLogin, onSelectType }: {
  onBackToLogin: () => void;
  onSelectType: (type: 'ngo' | 'expert' | 'guest') => void;
}) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Join the Hub</Text>
          <View style={styles.loginLinkContainer}>
            <Text style={styles.subtitle}>Already have an account? </Text>
            <TouchableOpacity onPress={onBackToLogin} style={styles.loginLink}>
              <Text style={styles.loginText}>Log in </Text>
              <ArrowRight size={16} color="#0e7490" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>I AM JOINING AS...</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelectType('ngo')}
          >
            <View style={styles.optionIconContainer}>
              <Users size={24} color="#0e7490" />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>A Nigerian NGO</Text>
                <ArrowRight size={20} color="#0e7490" />
              </View>
              <Text style={styles.optionDescription}>
                Register your NGO to access capacity building, mentorship, assessments and peer learning.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelectType('expert')}
          >
            <View style={styles.optionIconContainer}>
              <UserCheck size={24} color="#0e7490" />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>An Expert</Text>
                <ArrowRight size={20} color="#0e7490" />
              </View>
              <Text style={styles.optionDescription}>
                Join as a verified capacity-development expert to offer mentorship, training and advisory services.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelectType('guest')}
          >
            <View style={styles.optionIconContainer}>
              <UserPlus size={24} color="#0e7490" />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>A Guest</Text>
                <ArrowRight size={20} color="#0e7490" />
              </View>
              <Text style={styles.optionDescription}>
                Browse public resources, news and the community forum without a full membership profile.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#0e7490',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 24,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
