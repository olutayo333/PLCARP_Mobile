import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Search, Bell, User } from 'lucide-react-native';

import { FeedScreen } from '../screens/FeedScreen';
import { CommunitiesNavigator } from './CommunitiesNavigator';
import { SearchScreen } from '../screens/SearchScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import { useGetUnreadCountQuery } from '../services/notificationApi';
import { ProfileNavigator } from './ProfileNavigator';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
    const insets = useSafeAreaInsets();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const { data: unreadData } = useGetUnreadCountQuery(undefined, {
        skip: !isLoggedIn,
        pollingInterval: 30000, // Poll every 30 seconds for new notifications
    });

    const unreadCount = isLoggedIn ? (unreadData?.unreadCount || 0) : 0;

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
                    height: 60 + Math.max(insets.bottom, 0),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
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
                component={CommunitiesNavigator}
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
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#ef4444',
                        fontSize: 10,
                    },
                }}
            >
                {(props) => <NotificationScreen {...props} isLoggedIn={isLoggedIn} />}
            </Tab.Screen>
            <Tab.Screen
                name="ProfileStack"
                component={ProfileNavigator}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

