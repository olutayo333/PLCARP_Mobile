import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Users, Check, Plus, List } from 'lucide-react-native';

export function CommunityCard({
    community,
    isLoggedIn,
    onPress,
    onSubscribe,
    isJoined: isJoinedProp
}: {
    community: any;
    isLoggedIn?: boolean;
    onPress?: () => void;
    onSubscribe?: () => void;
    isJoined?: boolean;
}) {
    const isJoined = isJoinedProp ?? (!!community.joined || !!community.isJoined || !!community.isSubscribed);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.topInfo}>
                <Text style={styles.category} numberOfLines={1}>
                    {community.category || ''}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                    {community.name}
                </Text>
            </View>

            <View style={styles.bottomRow}>
                <TouchableOpacity
                    style={[styles.subscribeBtn, isJoined && styles.subscribedBtn]}
                    onPress={(e) => {
                        if (isJoined) return;
                        e.stopPropagation();
                        onSubscribe?.();
                    }}
                    activeOpacity={isJoined ? 1 : 0.7}
                    disabled={isJoined}
                >
                    {isJoined ? (
                        <>
                            <Check size={16} color="#000000" />
                            <Text style={styles.subscribedText}>Subscribed</Text>
                        </>
                    ) : (
                        <>
                            <Plus size={16} color="#0e7490" />
                            <Text style={styles.subscribeText}>Subscribe</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <List size={16} color="#4b5563" />
                        <Text style={styles.statValue}>{community.topicCount || 0}</Text>
                    </View>
                    <View style={[styles.statItem, { marginLeft: 16 }]}>
                        <Users size={16} color="#4b5563" />
                        <Text style={styles.statValue}>{community.memberCount || 0}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    topInfo: {
        marginBottom: 12,
    },
    category: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4,
        fontWeight: '500',
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subscribeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#0e7490',
        backgroundColor: '#fff',
    },
    subscribedBtn: {
        borderColor: '#e5e7eb',
    },
    subscribeText: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: '700',
    },
    subscribedText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '700',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
});

