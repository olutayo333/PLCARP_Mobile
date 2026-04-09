import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { CommunityDetailScreen } from '../screens/CommunityDetailScreen';
import { CommunitiesStackParamList } from './types';

const Stack = createStackNavigator<CommunitiesStackParamList>();

export function CommunitiesNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="CommunitiesMain"
                component={CommunitiesScreen}
            />
            <Stack.Screen
                name="CommunityDetail"
                component={CommunityDetailScreen}
            />
        </Stack.Navigator>
    );
}
