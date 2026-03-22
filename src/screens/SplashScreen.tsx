import React, {useEffect} from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';

export function SplashScreen({onFinish}: {onFinish: () => void}) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Placeholder for PLRCAP Nigeria Logo */}
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

        {/* Placeholder for NORCAP Logo */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    height: 24,
    gap: 2,
  },
  gridItem: {
    width: 6,
    height: 6,
    backgroundColor: '#9ca3af',
    borderRadius: 1,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e40af',
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  norcapLogo: {
    backgroundColor: '#3b82f6',
    padding: 4,
    borderRadius: 2,
  },
  norcapText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 10,
  },
  norcapSubtext: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
});
