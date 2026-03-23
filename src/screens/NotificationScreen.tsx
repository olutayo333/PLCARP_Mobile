import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
} from 'react-native';
import { Bell } from 'lucide-react-native';

export function NotificationScreen({ isLoggedIn, navigation }: { isLoggedIn?: boolean; navigation?: any }) {
    const [activeTab, setActiveTab] = useState('All');
    const tabs = [
        { name: 'All', count: undefined },
        { name: 'Replies', count: undefined },
        { name: 'Likes', count: undefined },
        { name: 'System', count: undefined }
    ];

    const notifications: any[] = [];

    const filteredNotifications = activeTab === 'All'
        ? notifications
        : notifications.filter(n => n.type === activeTab);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Alerts</Text>
                {isLoggedIn && (
                    <TouchableOpacity>
                        <Text style={styles.markAllRead}>Mark all as read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isLoggedIn && (
                <View style={styles.tabs}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.name}
                            style={[styles.tab, activeTab === tab.name && styles.tabActive]}
                            onPress={() => setActiveTab(tab.name)}
                        >
                            <View style={styles.tabLabelContainer}>
                                <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>
                                    {tab.name}
                                </Text>
                                {tab.count && (
                                    <View style={[styles.tabBadge, activeTab === tab.name && styles.tabBadgeActive]}>
                                        <Text style={[styles.tabBadgeText, activeTab === tab.name && styles.tabBadgeTextActive]}>
                                            {tab.count}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.item, item.unread && styles.itemUnread]}>
                        <View style={styles.itemContent}>
                            <View style={styles.itemHeaderRow}>
                                {item.unread && <View style={styles.unreadDot} />}
                                <Text style={styles.itemActionText}>
                                    {item.user && <Text style={styles.itemUser}>{item.user} </Text>}
                                    {item.action}
                                </Text>
                            </View>
                            <Text style={styles.itemSnippet} numberOfLines={2}>{item.content}</Text>
                            <Text style={styles.itemTime}>{item.time}</Text>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        {!isLoggedIn ? (
                            <>
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
                                <Text style={styles.emptyTitle}>Stay Updated</Text>
                                <Text style={styles.emptySubtitle}>
                                    Please <Text style={styles.linkText} onPress={() => navigation?.navigate('Register')}>register</Text> or <Text style={styles.linkText} onPress={() => navigation?.navigate('Login')}>login</Text> to view your personalized notifications and alerts.
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.emptyIconCircle}>
                                    <Bell size={40} color="#9ca3af" />
                                </View>
                                <Text style={styles.emptyTitle}>No notifications yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    When you have alerts about your posts or profile, they'll appear here.
                                </Text>
                            </>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    markAllRead: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#0e7490',
    },
    tabLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#111827',
        fontWeight: 'bold',
    },
    tabBadge: {
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeActive: {
        backgroundColor: '#ef4444',
    },
    tabBadgeText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    tabBadgeTextActive: {
        color: '#fff',
    },
    list: {
        flexGrow: 1,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    itemUnread: {
        backgroundColor: '#ecfdf5',
    },
    itemContent: {
        gap: 4,
    },
    itemHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
    },
    itemActionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    itemUser: {
        fontWeight: 'bold',
        color: '#111827',
    },
    itemSnippet: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginTop: 2,
    },
    itemTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
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
    linkText: {
        color: '#0e7490',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
