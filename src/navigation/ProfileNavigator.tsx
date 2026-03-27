import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { CommunityGuidelinesScreen } from '../screens/CommunityGuidelinesScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        </Stack.Navigator>
    );
}
