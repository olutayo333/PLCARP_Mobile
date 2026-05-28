import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Platform, ImageBackground, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Plus, Check, Clock, TrendingUp, Sparkles, Bell } from 'lucide-react-native';
import { useGetCommunityByIdQuery, useGetCommunityTopicsQuery, useSubscribeToCommunityMutation, useUnsubscribeFromCommunityMutation, useGetMySubscriptionsQuery } from '../services/communityApi';
import { TopicCard } from '../components/TopicCard';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { showToast } from '../store/slices/uiSlice';
import { Skeleton } from '../components/common/Skeleton';
import CustomAlert from '../utils/CustomAlert';

const Alert = CustomAlert;

const CommunityTopicSkeleton = () => (
    <View style={styles.topicSkeletonCard}>
        <View style={styles.skeletonHeader}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={{ gap: 4 }}>
                <Skeleton width={120} height={14} borderRadius={4} />
                <Skeleton width={80} height={10} borderRadius={4} />
            </View>
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
            <Skeleton width="90%" height={18} borderRadius={4} />
            <Skeleton width="100%" height={14} borderRadius={4} />
            <Skeleton width="100%" height={14} borderRadius={4} />
        </View>
        <View style={styles.skeletonFooter}>
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width={20} height={20} borderRadius={4} />
        </View>
    </View>
);

export function CommunityDetailScreen({
    route,
    navigation
}: {
    route: any;
    navigation: any;
}) {
    const { communityId } = route.params;
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('RECENT'); // RECENT, TRENDING, NEW, SUBSCRIBED

    const { data: community, isLoading: isLoadingCommunity } = useGetCommunityByIdQuery(communityId);
    const { data: subscriptions } = useGetMySubscriptionsQuery(undefined, { skip: !isLoggedIn });
    
    const { data: topicsData, isLoading: isLoadingTopics, refetch: refetchTopics } = useGetCommunityTopicsQuery({
        communityId,
        filters: {
            search: searchQuery,
            filter: activeTab,
            page: 1,
            limit: 20
        }
    });

    const [subscribe] = useSubscribeToCommunityMutation();
    const [unsubscribe] = useUnsubscribeFromCommunityMutation();

    const isSubscribedLocally = subscriptions?.some((sub: any) => sub?.id === communityId);
    const isJoined = community?.joined || community?.isJoined || community?.isSubscribed || isSubscribedLocally;

    const handleBack = () => navigation.goBack();

    const handleSubscribe = async () => {
        if (!isLoggedIn) {
            dispatch(showToast({ message: 'Please login to join this community', type: 'info' }));
            navigation.navigate('Login');
            return;
        }

        try {
            if (isJoined) {
                // For simplicity in this detail view, we just toggle. 
                // In a real app, maybe a confirming Alert is better.
                await unsubscribe(communityId).unwrap();
                dispatch(showToast({ message: 'Unsubscribed successfully', type: 'success' }));
            } else {
                await subscribe(communityId).unwrap();
                dispatch(showToast({ message: 'Subscribed successfully!', type: 'success' }));
            }
        } catch (err: any) {
            dispatch(showToast({ message: err?.data?.message || 'Failed to update subscription', type: 'error' }));
        }
    };

    const renderHeader = () => {
        if (isLoadingCommunity || !community) {
            return (
                <View style={styles.headerSkeleton}>
                    <Skeleton width="100%" height={150} borderRadius={0} />
                </View>
            );
        }

        return (
            <View style={styles.headerContainer}>
                <ImageBackground
                    source={community.imageUrl ? { uri: community.imageUrl } : undefined}
                    style={styles.coverImage}
                    imageStyle={{ opacity: 0.3 }}
                >
                    <View style={styles.headerOverlay}>
                        <Text style={styles.communityName} numberOfLines={2}>
                            {community.name}
                        </Text>

                        <View style={styles.headerStats}>
                            <View style={styles.headerStatItem}>
                                <Text style={styles.headerStatValue}>{community.topicCount || 0}</Text>
                                <Text style={styles.headerStatLabel}>TOPICS</Text>
                            </View>
                            <View style={styles.headerStatItem}>
                                <Text style={styles.headerStatValue}>{community.memberCount || 0}</Text>
                                <Text style={styles.headerStatLabel}>MEMBERS</Text>
                            </View>
                        </View>
                    </View>
                </ImageBackground>

                {/* Tab Bar */}
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                        {[
                            { id: 'RECENT', label: 'Recents', icon: Clock },
                            { id: 'TRENDING', label: 'Trending', icon: TrendingUp },
                            { id: 'NEW', label: 'New', icon: Sparkles },
                            { id: 'SUBSCRIBED', label: 'Subscribed', icon: Check },
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={16} color={activeTab === tab.id ? '#0e7490' : '#6b7280'} />
                                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={[styles.navBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#6b7280" />
                    <Text style={styles.backText}>Forum Home</Text>
                </TouchableOpacity>

                <View style={styles.searchBox}>
                    <Search size={18} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search discussions"
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        underlineColorAndroid="transparent"
                    />
                </View>

                {isLoggedIn && (
                    <TouchableOpacity
                        style={styles.newTopicBtn}
                        onPress={() => navigation.navigate('CreatePost', { communityId })}
                    >
                        <Plus size={18} color="#fff" />
                        <Text style={styles.newTopicText}>New Topic</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={topicsData?.topics || []}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <TopicCard
                        topic={item as any}
                        isLoggedIn={isLoggedIn}
                        onPress={() => navigation.navigate('TopicDetail', { communityId, topicId: item.id })}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => {
                    if (isLoadingTopics) {
                        return (
                            <View style={{ padding: 0 }}>
                                <CommunityTopicSkeleton />
                                <CommunityTopicSkeleton />
                                <CommunityTopicSkeleton />
                                <CommunityTopicSkeleton />
                            </View>
                        );
                    }
                    return (
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color="#e5e7eb" />
                            <Text style={styles.emptyText}>No topics yet. Start the conversation!</Text>
                        </View>
                    );
                }}
                onRefresh={refetchTopics}
                refreshing={isLoadingTopics}
            />
        </View>
    );
}

// Separate component for horizontal tabs since I used ScrollView in renderHeader

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: '#fff',
        zIndex: 10,
        gap: 6,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: 4,
    },
    backText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    searchBox: {
        flex: 1,
        height: 36,
        backgroundColor: '#f3f4f6',
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 0,
    },
    searchInput: {
        flex: 1,
        fontSize: 12,
        color: '#111827',
        marginLeft: 8,
        padding: 0,
        borderWidth: 0,
        height: '100%',
    },
    newTopicBtn: {
        backgroundColor: '#0e7490',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    newTopicText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    headerContainer: {
        backgroundColor: '#f8fafc',
    },
    coverImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#0e7490',
    },
    headerOverlay: {
        flex: 1,
        padding: 24,
        paddingBottom: 32,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    communityName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerStats: {
        flexDirection: 'row',
        gap: 24,
    },
    headerStatItem: {
        alignItems: 'center',
    },
    headerStatValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    headerStatLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 0.5,
    },
    tabContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    activeTabItem: {
        backgroundColor: '#fff',
        borderColor: '#0e7490',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#0e7490',
    },
    listContent: {
        paddingBottom: 60,
    },
    headerSkeleton: {
        height: 150,
        backgroundColor: '#f3f4f6',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
    },
    topicSkeletonCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    skeletonFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginTop: 16,
    },
});
