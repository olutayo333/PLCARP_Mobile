import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native';

export function OnboardingScreen({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/home_hero_pics.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/PLRCAP_ONL_LOGO.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.divider} />
              <Image
                source={require('../../assets/NORCAP-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
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
  logoImage: {
    width: 100,
    height: 40,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
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
