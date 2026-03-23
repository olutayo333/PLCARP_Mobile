import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000); // 3 seconds for splash
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
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
  logoImage: {
    width: 120,
    height: 60,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
});
