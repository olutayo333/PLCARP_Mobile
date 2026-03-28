import React, { useState, useEffect, Suspense } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { store } from './store';
import { setUser } from './store/slices/userSlice';
import { RootState } from './store';
import { GlobalToast } from './components/GlobalToast';
import { GlobalAlert } from './components/GlobalAlert';

// ── Lazy-load all heavy modules so a bad import doesn't crash the JS thread ──
const RootNavigator = React.lazy(() =>
  import('./navigation/RootNavigator').then((m) => ({ default: m.RootNavigator }))
);
const OnboardingScreen = React.lazy(() =>
  import('./screens/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen }))
);

// ── Simple inline splash (no external image imports that could fail) ──
function InlineSplash() {
  return (
    <View style={styles.centered}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0e7490' }}>PLRCAP v2</Text>

      <Text style={{ color: '#6b7280', marginTop: 8 }}>Loading...</Text>
      <ActivityIndicator color="#0e7490" style={{ marginTop: 16 }} />
    </View>
  );
}

// ── ErrorBoundary ──
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('JS Crash caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.centered, { padding: 24 }]}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 8 }}>
            App Error
          </Text>
          <Text style={{ textAlign: 'center', color: '#4b5563', fontSize: 12 }}>
            {this.state.error?.message || 'A JavaScript error occurred.'}
          </Text>
          <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 10, marginTop: 8 }}>
            {this.state.error?.stack?.substring(0, 400) || ''}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        const onboarded = await AsyncStorage.getItem('onboarded');
        if (token && userJson) {
          dispatch(setUser(JSON.parse(userJson)));
        }
        setShowOnboarding(!token && !onboarded);
      } catch (e) {
        console.error('Auth check failed', e);
      } finally {
        // 500ms delay before mounting navigation to let native threads stabilize
        setTimeout(() => setReady(true), 500);
      }
    };
    init();
  }, []);

  if (!ready) {
    return <InlineSplash />;
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<InlineSplash />}>
        <OnboardingScreen onGetStarted={async () => {
          await AsyncStorage.setItem('onboarded', 'true');
          setShowOnboarding(false);
        }} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<InlineSplash />}>
      <RootNavigator />
    </Suspense>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
          <AppContent />
          <GlobalToast />
          <GlobalAlert />
        </Provider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
