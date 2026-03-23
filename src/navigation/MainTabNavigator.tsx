import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Search, Bell, User } from 'lucide-react-native';

import { FeedScreen } from '../screens/FeedScreen';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#0e7490',
                tabBarInactiveTintColor: '#9ca3af',
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    elevation: 0,
                    height: 60,
                    paddingBottom: 10,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                options={{
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            >
                {(props) => <FeedScreen {...props} isLoggedIn={isLoggedIn} />}
            </Tab.Screen>
            <Tab.Screen
                name="CommunitiesStack"
                component={CommunitiesScreen}
                options={{
                    title: 'Communities',
                    tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="SearchStack"
                component={SearchScreen}
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Notification"
                options={{
                    tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
                }}
            >
                {(props) => <NotificationScreen {...props} isLoggedIn={isLoggedIn} />}
            </Tab.Screen>
            <Tab.Screen
                name="ProfileStack"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            >
                {(props) => <ProfileScreen {...props} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

