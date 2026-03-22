import React from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, ImageBackground} from 'react-native';

export function OnboardingScreen({onGetStarted}: {onGetStarted: () => void}) {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{uri: 'https://picsum.photos/seed/onboarding/800/1200'}} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <View style={styles.logoIcon}>
                  <View style={styles.grid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <View key={i} style={[styles.gridItem, i <= 4 && {backgroundColor: '#4f46e5'}]} />
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={styles.logoText}>PLRCAP</Text>
                  <Text style={styles.logoSubtext}>NIGERIA</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.logoWrapper}>
                <View style={styles.norcapLogo}>
                  <Text style={styles.norcapText}>NOR</Text>
                  <Text style={styles.norcapText}>CAP</Text>
                </View>
                <View>
                  <Text style={styles.norcapSubtext}>PART OF NORWEGIAN</Text>
                  <Text style={styles.norcapSubtext}>REFUGEE COUNCIL</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.title}>Grow Through Community</Text>
            <Text style={styles.description}>
              Join conversations, share insights, discover funding opportunities, and connect with NGOs and experts across sectors.
            </Text>
            <TouchableOpacity style={styles.button} onPress={onGetStarted}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    paddingTop: 48,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 8,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 24,
    height: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 18,
    height: 18,
    gap: 1,
  },
  gridItem: {
    width: 5,
    height: 5,
    backgroundColor: '#9ca3af',
    borderRadius: 0.5,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e40af',
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  norcapLogo: {
    backgroundColor: '#3b82f6',
    padding: 2,
    borderRadius: 1,
  },
  norcapText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 8,
  },
  norcapSubtext: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#374151',
  },
  footer: {
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#f3f4f6',
    lineHeight: 24,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#0e7490',
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
