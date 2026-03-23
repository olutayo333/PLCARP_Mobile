import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { MainTabNavigator } from './MainTabNavigator';
import { TopicDetailScreen } from '../screens/TopicDetailScreen';
import { ExpertDetailScreen } from '../screens/ExpertDetailScreen';
import { CreatePost } from '../components/CreatePost';
import { RootStackParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { GuestRegistrationScreen } from '../screens/GuestRegistrationScreen';
import { ExpertRegistrationScreen } from '../screens/ExpertRegistrationScreen';
import { NGORegistrationScreen } from '../screens/NGORegistrationScreen';
import { RegistrationCompleteScreen } from '../screens/RegistrationCompleteScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabNavigator}
                />
                <Stack.Screen
                    name="TopicDetail"
                    component={TopicDetailScreenWrapper}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ExpertDetail"
                    component={ExpertDetailScreenWrapper}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreatePost"
                    options={{ headerShown: false }}
                >
                    {(props) => (
                        <CreatePost
                            onCancel={() => props.navigation.goBack()}
                            onSuccess={() => props.navigation.goBack()}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="Login">
                    {(props) => (
                        <LoginScreen
                            onLoginSuccess={() => props.navigation.navigate('MainTabs')}
                            onRegisterPress={() => props.navigation.navigate('Register')}
                            onVisitorPress={() => props.navigation.navigate('MainTabs')}
                            onForgotPasswordPress={() => props.navigation.navigate('ForgotPassword')}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="Register">
                    {(props) => (
                        <RegisterScreen
                            onBackToLogin={() => props.navigation.navigate('Login')}
                            onSelectType={(type) => {
                                if (type === 'guest') props.navigation.navigate('GuestRegistration');
                                else if (type === 'expert') props.navigation.navigate('ExpertRegistration');
                                else if (type === 'ngo') props.navigation.navigate('NGORegistration');
                            }}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="GuestRegistration">
                    {(props) => (
                        <GuestRegistrationScreen
                            onBack={() => props.navigation.goBack()}
                            onComplete={() => props.navigation.navigate('RegistrationComplete')}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="ExpertRegistration">
                    {(props) => (
                        <ExpertRegistrationScreen
                            onBack={() => props.navigation.goBack()}
                            onComplete={() => props.navigation.navigate('RegistrationComplete')}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="NGORegistration">
                    {(props) => (
                        <NGORegistrationScreen
                            onBack={() => props.navigation.goBack()}
                            onComplete={() => props.navigation.navigate('RegistrationComplete')}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="RegistrationComplete">
                    {(props) => (
                        <RegistrationCompleteScreen
                            onGoHome={() => props.navigation.navigate('MainTabs')}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword">
                    {(props) => (
                        <ForgotPasswordScreen
                            onBackToLogin={() => props.navigation.navigate('Login')}
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function TopicDetailScreenWrapper({ route, navigation }: any) {
    const { communityId, topicId } = route.params;
    return (
        <TopicDetailScreen
            communityId={communityId}
            topicId={topicId}
            onBack={() => navigation.goBack()}
        />
    );
}

function ExpertDetailScreenWrapper({ route, navigation }: any) {
    const { expertId } = route.params;
    return (
        <ExpertDetailScreen
            expertId={expertId}
            onBack={() => navigation.goBack()}
        />
    );
}
