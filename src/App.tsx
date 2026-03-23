import React, { useState, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { store } from './store';
import { RootNavigator } from './navigation/RootNavigator';
import { NativeShell } from './components/NativeShell';
import { CreatePost } from './components/CreatePost';
import { useLoginMutation } from './services/authApi';
import { FeedScreen } from './screens/FeedScreen';
import { CommunitiesScreen } from './screens/CommunitiesScreen';
import { SearchScreen } from './screens/SearchScreen';
import { NotificationScreen } from './screens/NotificationScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

import { setUser } from './store/slices/userSlice';
import { RootState } from './store';

function AppContent() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
    }
  };

  const handleOnboardingFinish = async () => {
    await AsyncStorage.setItem('onboarded', 'true');
    setShowOnboarding(false);
  };

  if (isCheckingAuth) {
    return <SplashScreen onFinish={() => setIsCheckingAuth(false)} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onGetStarted={handleOnboardingFinish} />;
  }

  return (
    <RootNavigator />
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
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
