import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Platform, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Plus,
    AtSign,
    ArrowRight,
    Check,
    MessageCircle,
    Users,
    TrendingUp,
    Search,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    ChevronDown,
    X,
    Edit2,
    Trash2,
    Heart,
    Quote,
    AlertCircle,
    Star,
    Flag,
} from 'lucide-react-native';

import {
    useGetGlobalTopicsQuery,
    useGetCommunitiesQuery,
    useGetCommunityTopicsQuery,
    useGetCommunityAnalyticsQuery,
    useGetGeneralAnalyticsQuery,
    useGetMySubscriptionsQuery,
    useGetMentionsQuery,
    useSubscribeToCommunityMutation,
    useUnsubscribeFromCommunityMutation,
    useGetActivityFeedQuery,
    useToggleCommentLikeMutation,
    useReportCommentMutation,
    CommunityActivityFeedItem,
} from '../services/communityApi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetUserProfileQuery } from '../services/profileApi';
import { Skeleton } from '../components/common/Skeleton';
import { decodeHtmlEntities } from '../utils/textUtils';
import { ReportModal } from '../components/ReportModal';
import { TopicCard } from '../components/TopicCard';
import { CommunityCard } from '../components/CommunityCard';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { showToast } from '../store/slices/uiSlice';
import CustomAlert from '../utils/CustomAlert';
import { socketService } from '../services/socketService';

const Alert = CustomAlert;

const categoryFilters = [
    { name: 'Policy Advocacy', icon: Check, color: '#2563eb', bg: '#eff6ff' },
    { name: 'Crisis Response', icon: Check, color: '#dc2626', bg: '#fef2f2' },
    { name: 'Project Management', icon: Check, color: '#059669', bg: '#ecfdf5' },
    { name: 'Community Outreach', icon: Check, color: '#7c3aed', bg: '#f5f3ff' },
    { name: 'Capacity Building', icon: Check, color: '#d97706', bg: '#fffbeb' },
    { name: 'Grant Writing', icon: Check, color: '#4f46e5', bg: '#eef2ff' },
];

const ITEMS_PER_PAGE = 10;

function GuestWelcomeBanner({ navigation }: { navigation: any }) {
    return (
        <View style={styles.guestBanner}>
            <View style={styles.guestBannerContent}>
                <Text style={styles.guestBannerTitle}>Welcome to PLRCAP Community!</Text>
                <Text style={styles.guestBannerSub}>Join the global community of practitioners, experts, and organizations.</Text>
                <View style={styles.guestBannerActions}>
                    <TouchableOpacity
                        style={styles.guestLoginBtn}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.guestLoginText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.guestRegisterBtn}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.guestRegisterText}>Join Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export function FeedScreen({ route }: any) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const flatListRef = useRef<FlatList>(null);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState('topics');

    useEffect(() => {
        if (route?.params?.initialSubTab) {
            setActiveSubTab(route.params.initialSubTab);
            navigation.setParams({ initialSubTab: undefined } as any);
        }
    }, [route?.params?.initialSubTab]);

    const [activeFilter, setActiveFilter] = useState('new');
    const [categorySearch, setCategorySearch] = useState('');
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const user = useSelector((state: RootState) => state.user.user);

    // Cross-platform modal state
    type ConfirmConfig = { title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    const [communityFilter, setCommunityFilter] = useState<'all' | 'subscribed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [effectiveSearch, setEffectiveSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCommunityPickerVisible, setIsCommunityPickerVisible] = useState(false);
    const [communitySearch, setCommunitySearch] = useState('');
    const [debouncedCommunitySearch, setDebouncedCommunitySearch] = useState('');
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

    // Activity Management State
    const [isActivityFormVisible, setIsActivityFormVisible] = useState(false);
    const [activityFormMode, setActivityFormMode] = useState<'create' | 'edit'>('create');
    const [activityFormData, setActivityFormData] = useState({
        sector: '',
        who: '',
        where: '',
        when: new Date().getFullYear().toString(),
        activity: '',
        id: ''
    });

    const [toggleCommentLike] = useToggleCommentLikeMutation();
    const [reportCommentMutation, { isLoading: isReporting }] = useReportCommentMutation();
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

    const handleReportClick = (commentId: string) => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please login to report comments.');
            return;
        }
        setReportingCommentId(commentId);
        setIsReportModalVisible(true);
    };

    const submitReport = async (reason: string) => {
        if (!reportingCommentId) return;

        try {
            const response = await reportCommentMutation({
                communityId: '', // API handles lookup by commentId usually
                topicId: '',
                commentId: reportingCommentId,
                data: { reason }
            }).unwrap();

            if (response?.status) {
                dispatch(showToast({ message: 'Comment reported successfully', type: 'success' }));
            } else {
                dispatch(showToast({ message: response?.message || 'Failed to report', type: 'error' }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error?.data?.message || 'Failed to report', type: 'error' }));
        } finally {
            setIsReportModalVisible(false);
            setReportingCommentId(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCommunitySearch(communitySearch);
        }, 1000);
        return () => clearTimeout(timer);
    }, [communitySearch]);


    useEffect(() => {
        const timer = setTimeout(() => {
            setEffectiveSearch(searchQuery);
            setCurrentPage(1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setSearchQuery('');
        setEffectiveSearch('');
        setCategorySearch('');
        setCurrentPage(1);
    }, [activeSubTab, selectedCommunityId, activeFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

    useEffect(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [currentPage, activeSubTab, selectedCommunityId, activeFilter, communityFilter]);

    // Real-time states
    const [realtimeTopics, setRealtimeTopics] = useState<any[]>([]);
    const [realtimeOnlineCount, setRealtimeOnlineCount] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedCommunityId) return;
        socketService.joinCommunity(selectedCommunityId);

        // Reset local real-time state for the new room
        setRealtimeTopics([]);
        setRealtimeOnlineCount(null);

        const onPresenceUpdated = (data: any) => {
            if (data.communityId === selectedCommunityId) {
                setRealtimeOnlineCount(data.onlineCount);
            }
        };

        const onTopicNew = (topic: any) => {
            if (topic.communityId === selectedCommunityId) {
                setRealtimeTopics((prev) => [topic, ...prev]);
            }
        };

        socketService.on('presence:updated', onPresenceUpdated);
        socketService.on('topic:new', onTopicNew);

        return () => {
            socketService.leaveCommunity(selectedCommunityId);
            socketService.off('presence:updated', onPresenceUpdated);
            socketService.off('topic:new', onTopicNew);
        };
    }, [selectedCommunityId]);

    const combinedSearch = useMemo(() => {
        return [effectiveSearch, categorySearch].filter(Boolean).join(' ') || undefined;
    }, [effectiveSearch, categorySearch]);

    const [subscribe] = useSubscribeToCommunityMutation();
    const [unsubscribe] = useUnsubscribeFromCommunityMutation();

    const handleCommunityAction = async (community: any) => {
        if (!isLoggedIn) {
            showConfirm({
                title: 'Join Community',
                message: 'Please register and login to join this community.',
                confirmText: 'Login',
                onConfirm: () => navigation.navigate('Login')
            });
            return;
        }
        try {
            if (community.joined) {
                showConfirm({
                    title: 'Leave Community',
                    message: `Are you sure you want to leave ${community.name}?`,
                    confirmText: 'Leave',
                    danger: true,
                    onConfirm: async () => {
                        try {
                            const response = await unsubscribe(community.id).unwrap() as any;
                            if (response.status) {
                                dispatch(showToast({ message: response.message || 'Left community successfully', type: 'success' }));
                            } else {
                                dispatch(showToast({ message: response.message || 'Failed to leave community', type: 'error' }));
                            }
                        } catch (err: any) {
                            dispatch(showToast({ message: err?.data?.message || 'Failed to leave community', type: 'error' }));
                        }
                    }
                });
            } else {
                const response = await subscribe(community.id).unwrap() as any;
                if (response?.status) {
                    dispatch(showToast({ message: response?.message || 'Joined community successfully', type: 'success' }));
                } else {
                    dispatch(showToast({ message: response?.message || 'Failed to join community', type: 'error' }));
                }
            }
        } catch (err: any) {
            const serverError = err?.data?.message || 'Failed to update subscription';
            dispatch(showToast({ message: serverError, type: 'error' }));
        }
    };

    const { data: communitiesData } = useGetCommunitiesQuery({});

    const topicFilterParam = activeFilter === 'new' ? undefined : (activeFilter === 'trending' ? 'TRENDING' : 'RECENT');

    const { data: globalTopicsData, isLoading: isLoadingGlobal, isFetching: isFetchingGlobal, refetch: refetchGlobal } = useGetGlobalTopicsQuery(
        {
            search: combinedSearch,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            filter: topicFilterParam
        },
        { skip: activeSubTab !== 'topics' || selectedCommunityId !== null }
    );

    const { data: communityTopicsData, isLoading: isLoadingCommunityTopics, isFetching: isFetchingCommunity, refetch: refetchCommunity } = useGetCommunityTopicsQuery(
        {
            communityId: selectedCommunityId || '',
            filters: {
                search: combinedSearch,
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                filter: topicFilterParam
            }
        },
        { skip: !selectedCommunityId || activeSubTab !== 'topics' }
    );

    const { data: generalAnalytics } = useGetGeneralAnalyticsQuery(undefined, { skip: !isLoggedIn || selectedCommunityId !== null });
    const { data: communityAnalytics } = useGetCommunityAnalyticsQuery(selectedCommunityId || '', { skip: !selectedCommunityId });
    const { data: userProfile } = useGetUserProfileQuery(undefined, { skip: !isLoggedIn });
    const { data: subscriptions, refetch: refetchSubscriptions, isLoading: isLoadingSubscriptions, isFetching: isFetchingSubscriptions } = useGetMySubscriptionsQuery(undefined, { skip: !isLoggedIn || activeSubTab !== 'communities' || communityFilter !== 'subscribed' });
    const { data: mentions, isLoading: isLoadingMentions, isFetching: isFetchingMentions, refetch: refetchMentions } = useGetMentionsQuery(undefined, { skip: !isLoggedIn || activeSubTab !== 'mentions' });

    const {
        data: communitiesListData,
        isLoading: isLoadingCommunitiesList,
        isFetching: isFetchingCommunitiesList,
        refetch: refetchCommunitiesList
    } = useGetCommunitiesQuery({
        search: effectiveSearch,
        page: currentPage,
        limit: ITEMS_PER_PAGE
    }, { skip: activeSubTab !== 'communities' });

    const {
        data: activityFeedData,
        isLoading: isLoadingActivityFeed,
        isFetching: isFetchingActivityFeed,
        refetch: refetchActivityFeed
    } = useGetActivityFeedQuery(undefined, { skip: activeSubTab !== 'activities' });

    const isNgoMember = isLoggedIn && userProfile?.role === 'NGO_MEMBER';

    const {
        data: communitySearchResults,
        isFetching: isFetchingCommunitySearch
    } = useGetCommunitiesQuery({
        search: debouncedCommunitySearch,
        limit: 50
    }, { skip: !isCommunityPickerVisible });

    const selectedCommunity = useMemo(() => {
        if (!selectedCommunityId) return null;
        return communitiesData?.communities?.find((c: any) => c.id === selectedCommunityId);
    }, [selectedCommunityId, communitiesData]);

    const isFetching: boolean = activeSubTab === 'communities'
        ? (communityFilter === 'subscribed' ? (isFetchingSubscriptions ?? false) : (isFetchingCommunitiesList ?? false)) :
        activeSubTab === 'mentions' ? (isFetchingMentions ?? false) :
            activeSubTab === 'activities' ? (isFetchingActivityFeed ?? false) :
                (selectedCommunityId ? (isFetchingCommunity ?? false) : (isFetchingGlobal ?? false));

    const isLoading: boolean = activeSubTab === 'communities'
        ? (communityFilter === 'subscribed' ? (isLoadingSubscriptions ?? false) : (isLoadingCommunitiesList ?? false)) :
        activeSubTab === 'mentions' ? (isLoadingMentions ?? false) :
            activeSubTab === 'activities' ? (isLoadingActivityFeed ?? false) :
                (selectedCommunityId ? (isLoadingCommunityTopics ?? false) : (isLoadingGlobal ?? false));
    const topicsData = selectedCommunityId ? communityTopicsData : globalTopicsData;
    const listData = activeSubTab === 'communities' ? communitiesListData :
        activeSubTab === 'activities' ? activityFeedData :
            topicsData;
    // Combine fetched topics with real-time new topics
    const topics = [
        ...realtimeTopics,
        ...(topicsData?.topics || [])
    ];
    const refetch = () => {
        if (activeSubTab === 'communities') {
            return communityFilter === 'subscribed' ? refetchSubscriptions() : refetchCommunitiesList();
        }
        if (activeSubTab === 'mentions') return refetchMentions();
        if (activeSubTab === 'subscribed') return refetchSubscriptions();
        if (activeSubTab === 'activities') return refetchActivityFeed();
        return selectedCommunityId ? refetchCommunity() : refetchGlobal();
    };
    const headerComponent = useMemo(() => (
        <View style={styles.feedHeaderContainer}>
            {isLoggedIn ? (
                <>
                    <View style={styles.headerTopRow}>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitleStatic}>
                                {selectedCommunity?.name || 'Community Forum'}
                            </Text>
                        </View>
                        <View style={styles.pointsBadgeNew}>
                            <Star size={16} color="#0e7490" fill="#0e7490" />
                            <Text style={styles.pointsValueNew}>
                                {userProfile?.pointsCount || 0} <Text style={styles.pointsUnitNew}>pts</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.analyticsCard}>
                        <View style={styles.analyticsColumn}>
                            <Text style={styles.analyticsVal}>
                                {selectedCommunityId ? (communityAnalytics?.totalTopics || 0) : (generalAnalytics?.totalTopics || 0)}
                            </Text>
                            <Text style={styles.analyticsLab}>TOPICS</Text>
                        </View>
                        <View style={styles.analyticsColumn}>
                            <Text style={styles.analyticsVal}>
                                {selectedCommunityId ? 0 : (generalAnalytics?.totalCommunities || 0)}
                            </Text>
                            <Text style={styles.analyticsLab}>{selectedCommunityId ? 'POSTS' : 'COMMUNITIES'}</Text>
                        </View>
                        <View style={styles.analyticsColumn}>
                            <Text style={styles.analyticsVal}>
                                {selectedCommunityId ? (communityAnalytics?.totalMembers || 0) : (generalAnalytics?.totalMembers || 0)}
                            </Text>
                            <Text style={styles.analyticsLab}>MEMBERS</Text>
                        </View>
                        <View style={styles.analyticsColumn}>
                            <Text style={styles.analyticsVal}>
                                {realtimeOnlineCount !== null
                                    ? realtimeOnlineCount
                                    : selectedCommunityId
                                        ? (communityAnalytics?.onlineMembers || 0)
                                        : (generalAnalytics?.onlineUsers || 0)}
                            </Text>
                            <Text style={styles.analyticsLab}>ONLINE</Text>
                        </View>
                    </View>
                </>
            ) : (
                <GuestWelcomeBanner navigation={navigation} />
            )}

            {(activeSubTab === 'topics' || activeSubTab === 'communities') && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#9ca3af" />
                        <TextInput
                            style={[styles.searchInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null]}
                            placeholder={`Search ${activeSubTab === 'communities' ? 'communities' : 'topics'}...`}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabs} contentContainerStyle={styles.subTabsContent}>
                {['Topics', 'Communities', 'Activities', 'Mentions'].map((tab) => {
                    const tabKey = tab.toLowerCase();
                    if (!isLoggedIn && (tabKey === 'mentions' || tabKey === 'activities')) return null;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.subTab, activeSubTab === tabKey && styles.subTabActive]}
                            onPress={() => setActiveSubTab(tabKey)}
                        >
                            <Text style={[styles.subTabText, activeSubTab === tabKey && styles.subTabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {activeSubTab === 'topics' && isLoggedIn && (
                <View style={styles.filtersContainer}>
                    <View style={styles.filterRow}>
                        {['New', 'Recent', 'Trending'].map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterPill, activeFilter === filter.toLowerCase() && styles.filterPillActive]}
                                onPress={() => setActiveFilter(filter.toLowerCase())}
                            >
                                <Text style={[styles.filterPillText, activeFilter === filter.toLowerCase() && styles.filterPillTextActive]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {activeSubTab === 'communities' && isLoggedIn && (
                <View style={styles.filtersContainer}>
                    <View style={styles.filterRow}>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'subscribed', label: 'Subscribed' }
                        ].map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[styles.filterPill, communityFilter === filter.id && styles.filterPillActive]}
                                onPress={() => setCommunityFilter(filter.id as any)}
                            >
                                <Text style={[styles.filterPillText, communityFilter === filter.id && styles.filterPillTextActive]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    ), [isLoggedIn, generalAnalytics, communityAnalytics, userProfile, searchQuery, activeSubTab, activeFilter, communityFilter, categorySearch, navigation, selectedCommunityId]);


    const renderMentions = () => {
        if (isLoadingMentions) return (
            <View style={{ padding: 16 }}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 }}>
                        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
                            <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
                            <Skeleton width="30%" height={10} />
                        </View>
                    </View>
                ))}
            </View>
        );
        if (!mentions?.length) {
            return (
                <View style={styles.emptyContainer}>
                    <AtSign size={40} color="#9ca3af" style={{ marginBottom: 10 }} />
                    <Text style={styles.emptyText}>No mentions yet</Text>
                </View>
            );
        }

        return null;
    };

    const renderMentionItem = ({ item: mention }: any) => (
        <TouchableOpacity
            style={styles.mentionItem}
            onPress={() => {
                const cid = mention.communityId || mention.topic?.communityId || mention.comment?.communityId || selectedCommunityId;
                const tId = mention.topicId || mention.comment?.topicId;
                if (cid && tId) {
                    navigation.navigate('TopicDetail', {
                        communityId: cid,
                        topicId: tId
                    });
                }
            }}
        >
            <View style={styles.mentionIconContainer}>
                <AtSign size={20} color="#4f46e5" />
            </View>
            <View style={styles.mentionContent}>
                <Text style={styles.mentionTitle}>Mentioned you in a {mention.comment ? 'comment' : 'topic'}</Text>
                <Text style={styles.mentionSnippet} numberOfLines={2}>
                    {mention.comment ? mention.comment.body : mention.topic?.title}
                </Text>
                <Text style={styles.mentionDate}>{new Date(mention.createdAt).toLocaleDateString()}</Text>
            </View>
            <ArrowRight size={16} color="#9ca3af" />
        </TouchableOpacity>
    );

    const renderSubscribedItem = ({ item: community }: any) => (
        <TouchableOpacity
            style={styles.subscriptionItem}
            onPress={() => {
                setSelectedCommunityId(community.id);
                setActiveSubTab('topics');
            }}
        >
            <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionCategory}>{community.category}</Text>
                <Text style={styles.subscriptionName}>{community.name}</Text>
                <View style={styles.subscribedBadge}>
                    <Check size={12} color="#059669" />
                    <Text style={styles.subscribedBadgeText}>Joined</Text>
                </View>
            </View>
            <View style={styles.subscriptionStats}>
                <View style={styles.subStat}>
                    <MessageCircle size={14} color="#6b7280" />
                    <Text style={styles.subStatText}>{community.topicCount}</Text>
                </View>
                <View style={styles.subStat}>
                    <Users size={14} color="#6b7280" />
                    <Text style={styles.subStatText}>{community.memberCount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSubscribed = () => (
        <View style={styles.subscribedContainer}>
            {/* Handled by FlatList data directly */}
        </View>
    );

    const renderActivities = () => {
        return null;
    };

    const renderTrendingEmpty = () => null;

    const FeedSkeleton = () => (
        <View style={{ padding: 16 }}>
            {activeSubTab === 'communities'
                ? [1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={styles.communitySkeletonCard}>
                        <Skeleton width={60} height={60} borderRadius={12} />
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <Skeleton width="20%" height={10} style={{ marginBottom: 4 }} />
                            <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                            <Skeleton width="40%" height={12} />
                        </View>
                        <Skeleton width={24} height={24} borderRadius={12} />
                    </View>
                ))
                : [1, 2, 3, 4].map(i => (
                    <View key={i} style={styles.topicSkeletonCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Skeleton width={40} height={40} borderRadius={20} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Skeleton width="40%" height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width="25%" height={10} />
                            </View>
                            <Skeleton width={60} height={20} borderRadius={10} />
                        </View>
                        <Skeleton width="90%" height={18} style={{ marginBottom: 12 }} />
                        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
                        <Skeleton width="70%" height={14} style={{ marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <Skeleton width={40} height={12} />
                            <Skeleton width={40} height={12} />
                        </View>
                    </View>
                ))
            }
        </View>
    );

    return (
        <View style={[styles.screenContainer, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0) }]}>
            {/* Community Selector moved into headerComponent for layout parity */}


            <FlatList
                ref={flatListRef}
                data={((isLoading || (isFetching && (searchQuery !== '' || categorySearch !== ''))) && currentPage === 1)
                    ? []
                    : (activeSubTab === 'topics'
                        ? (topics || [])
                        : activeSubTab === 'communities' ? (communityFilter === 'subscribed' ? (subscriptions?.map(c => ({ ...c, joined: true })) || []) : (communitiesListData?.communities || []))
                            : activeSubTab === 'mentions' ? (mentions || [])
                                : activeSubTab === 'activities' ? (activityFeedData || [])
                                    : []
                    )
                }
                renderItem={({ item, index }: { item: any; index: number }) => {
                    const dataArray = (activeSubTab === 'topics'
                        ? (topics || [])
                        : activeSubTab === 'communities' ? (communityFilter === 'subscribed' ? (subscriptions?.map(c => ({ ...c, joined: true })) || []) : (communitiesListData?.communities || []))
                            : activeSubTab === 'mentions' ? (mentions || [])
                                : activeSubTab === 'activities' ? (activityFeedData || [])
                                    : []
                    );
                    const isFirst = index === 0;
                    const isLast = index === dataArray.length - 1;

                    if (activeSubTab === 'topics') {
                        return (
                            <TopicCard
                                topic={item}
                                isLoggedIn={isLoggedIn}
                                isFirst={isFirst}
                                isLast={isLast}
                                onPress={() => {
                                    navigation.navigate('TopicDetail', {
                                        communityId: item.communityId,
                                        topicId: item.id
                                    });
                                }}
                            />
                        );
                    }
                    if (activeSubTab === 'communities') {
                        return (
                            <CommunityCard
                                community={item}
                                isLoggedIn={isLoggedIn}
                                isFirst={isFirst}
                                isLast={isLast}
                                onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                                onSubscribe={() => handleCommunityAction(item)}
                                isJoined={communityFilter === 'subscribed' || !!item.joined || !!item.isJoined || !!item.isSubscribed}
                            />
                        );
                    }
                    if (activeSubTab === 'mentions') {
                        return renderMentionItem({ item });
                    }
                    if (activeSubTab === 'subscribed') {
                        return renderSubscribedItem({ item });
                    }
                    if (activeSubTab === 'activities') {
                        return (
                            <View style={styles.activityItem}>
                                <TouchableOpacity
                                    style={{ padding: 16, flexDirection: 'row' }}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        const cId = item.community?.id || item.communityId || item.topic?.communityId || item.comment?.communityId;
                                        const tId = item.topic?.id || item.topicId;
                                        console.log('Activity Navigating to TopicDetail:', { cId, tId, item });
                                        if (cId && tId) {
                                            navigation.navigate('TopicDetail', {
                                                communityId: cId,
                                                topicId: tId
                                            });
                                        } else {
                                            Alert.alert('Navigation Error', 'Missing topic or community ID in the activity payload.');
                                        }
                                    }}
                                >
                                    <View style={styles.activityIconBox}>
                                        <MessageCircle size={20} color="#0e7490" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.activityRe}>
                                            Re: {item.topic?.title || item.topicTitle}
                                        </Text>
                                        <View style={styles.activityHeaderRow}>
                                            <Text style={styles.activitySector}>{item.community?.name || item.communityName}</Text>
                                            <Text style={styles.activityYear}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                        </View>

                                        <View style={{ marginBottom: 4 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                                                {item.author?.fullName}
                                            </Text>
                                        </View>

                                        {item.quote && (
                                            <View style={styles.activityQuoteBox}>
                                                <Text style={styles.activityQuoteAuthor}>
                                                    {item.quote.author?.fullName}
                                                </Text>
                                                <Text style={styles.activityQuoteBody} numberOfLines={2}>
                                                    {decodeHtmlEntities(item.quote.body)}
                                                </Text>
                                            </View>
                                        )}

                                        <Text style={styles.activityBody} numberOfLines={4}>{decodeHtmlEntities(item.body)}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={[styles.activityActionRow, { paddingHorizontal: 16, paddingBottom: 16, paddingLeft: 56 }]}>
                                    <TouchableOpacity
                                        style={styles.activityAction}
                                        onPress={() => {
                                            const cId = item.community?.id || item.communityId || item.topic?.communityId || item.comment?.communityId;
                                            const tId = item.topic?.id || item.topicId;
                                            if (cId && tId) {
                                                navigation.navigate('TopicDetail', {
                                                    communityId: cId,
                                                    topicId: tId,
                                                    quoteCommentId: item.id
                                                });
                                            } else {
                                                Alert.alert('Navigation Error', 'Missing topic or community ID in the activity payload.');
                                            }
                                        }}
                                    >
                                        <MessageCircle size={14} color="#64748b" />
                                        <Text style={styles.activityActionText}>Quote</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.activityAction}
                                        onPress={() => handleReportClick(item.id)}
                                    >
                                        <Flag size={14} color="#64748b" />
                                        <Text style={styles.activityActionText}>Report</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }
                    return null;
                }}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feed}
                onRefresh={refetch}
                refreshing={isFetching}
                ListHeaderComponent={headerComponent}
                ListFooterComponent={() => {
                    if ((activeSubTab === 'topics' || activeSubTab === 'communities' || activeSubTab === 'activities') && listData) {
                        // For communities, only show pagination if 'All' filter is selected
                        if (activeSubTab === 'communities' && communityFilter !== 'all') return null;

                        const totalPages = (listData as any).totalPages || (listData as any).pages || 1;
                        if (totalPages <= 1 || activeSubTab === 'activities') return null;
                        return (
                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1 || isFetching}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#0e7490'} />
                                    <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonDisabledText]}>Previous</Text>
                                </TouchableOpacity>
                                <View style={styles.pageIndicator}>
                                    {isFetching ? (
                                        <ActivityIndicator size="small" color="#0e7490" />
                                    ) : (
                                        <Text style={styles.pageNumber}>Page {currentPage} of {totalPages}</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.paginationButton, currentPage >= totalPages && styles.paginationButtonDisabled]}
                                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages || isFetching}
                                >
                                    <Text style={[styles.paginationButtonText, currentPage >= totalPages && styles.paginationButtonDisabledText]}>Next</Text>
                                    <ChevronRight size={20} color={currentPage >= totalPages ? '#9ca3af' : '#0e7490'} />
                                </TouchableOpacity>
                            </View>
                        );
                    }
                    return null;
                }}
                ListEmptyComponent={() => {
                    if (isLoading || (isFetching && (searchQuery !== '' || categorySearch !== ''))) return <FeedSkeleton />;

                    if (activeSubTab === 'mentions') {
                        return (
                            <View style={styles.emptyContainer}>
                                <AtSign size={40} color="#9ca3af" style={{ marginBottom: 10 }} />
                                <Text style={styles.emptyText}>No mentions yet</Text>
                            </View>
                        );
                    }

                    if (activeSubTab === 'subscribed') {
                        return (
                            <View style={styles.emptyContainer}>
                                <Users size={40} color="#9ca3af" style={{ marginBottom: 10 }} />
                                <Text style={styles.emptyText}>No subscriptions yet</Text>
                            </View>
                        );
                    }

                    return (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                {activeSubTab === 'communities' ? <Users size={48} color="#9ca3af" /> : <MessageCircle size={48} color="#9ca3af" />}
                            </View>
                            <Text style={styles.emptyText}>
                                {activeSubTab === 'communities' ? 'No communities found' : 'No topics found'}
                            </Text>
                        </View>
                    );
                }}
            />

            {
                isLoggedIn && activeSubTab === 'topics' && (
                    <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
                        <Plus size={24} color="#fff" />
                    </TouchableOpacity>
                )
            }

            {/* ── Community Picker Modal ── */}
            <Modal
                visible={isCommunityPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCommunityPickerVisible(false)}
            >
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerCard}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Community</Text>
                            <TouchableOpacity onPress={() => setIsCommunityPickerVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerSearchBox}>
                            <Search size={18} color="#9ca3af" />
                            <TextInput
                                style={[styles.pickerSearchInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null]}
                                placeholder="Search communities..."
                                value={communitySearch}
                                onChangeText={setCommunitySearch}
                                autoFocus
                            />
                            {communitySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCommunitySearch('')}>
                                    <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.pickerListContainer, { height: 400 }]}>
                            {isFetchingCommunitySearch && communitySearch !== '' ? (
                                <ActivityIndicator style={{ marginTop: 20 }} color="#0e7490" />
                            ) : (
                                <FlatList
                                    data={[
                                        { id: null, name: 'Global Feed' },
                                        ...(communitySearchResults?.communities || [])
                                    ]}
                                    renderItem={({ item }: { item: any }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.pickerItem,
                                                selectedCommunityId === item.id && styles.pickerItemActive
                                            ]}
                                            onPress={() => {
                                                setSelectedCommunityId(item.id);
                                                setIsCommunityPickerVisible(false);
                                                setCommunitySearch('');
                                            }}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                selectedCommunityId === item.id && styles.pickerItemActiveText
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {selectedCommunityId === item.id && <Check size={16} color="#0e7490" />}
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item) => item.id || 'global'}
                                    ListEmptyComponent={() => (
                                        <Text style={styles.pickerEmptyText}>No communities found</Text>
                                    )}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Cross-Platform CONFIRM Modal ── */}
            <Modal
                visible={!!confirmModal}
                transparent
                animationType="fade"
                onRequestClose={dismissConfirm}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
                        <Text style={styles.modalMessage}>{confirmModal?.message}</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={dismissConfirm}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, confirmModal?.danger && styles.modalDangerBtn]}
                                onPress={() => {
                                    dismissConfirm();
                                    confirmModal?.onConfirm();
                                }}
                            >
                                <Text style={styles.modalConfirmText}>{confirmModal?.confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Cross-Platform REPORT Modal ── */}
            <ReportModal
                visible={isReportModalVisible}
                onClose={() => setIsReportModalVisible(false)}
                onSubmit={submitReport}
                isSubmitting={isReporting}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingBottom: 24,
    },
    feedHeaderContainer: {
        backgroundColor: '#f1f5f9',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 2,
        marginBottom: 16,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitleStatic: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    pointsBadgeNew: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pointsValueNew: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    pointsUnitNew: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: 'normal',
    },
    analyticsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    analyticsColumn: {
        alignItems: 'center',
        flex: 1,
    },
    analyticsVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    analyticsLab: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subTabs: {
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginBottom: 12,
    },
    subTabsContent: {
        paddingHorizontal: 4,
    },
    subTab: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subTabActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#0e7490',
    },
    subTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    subTabTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    filtersContainer: {
        padding: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterPillActive: {
        backgroundColor: '#e0f2fe',
        borderColor: '#e0f2fe',
    },
    filterPillText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    filterPillTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    categoryScroller: {
        marginTop: 8,
    },
    categoryScrollerContent: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    categoryPillText: {
        fontSize: 12,
        color: '#374151',
    },
    communitySelector: {
        paddingVertical: 12,
    },
    communitySelectorContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    communityTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    communityTabActive: {
        backgroundColor: '#4f46e5',
    },
    communityTabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    communityTabTextActive: {
        color: '#fff',
    },
    feed: {
        padding: 16,
        paddingBottom: 120, // Increased for safe area + nav parity
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        fontWeight: '500',
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    mentionsList: {
        gap: 12,
        paddingTop: 12,
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    mentionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mentionContent: {
        flex: 1,
    },
    mentionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    mentionSnippet: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    mentionDate: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
    },
    subscribedContainer: {
        gap: 12,
        paddingTop: 12,
    },
    subscriptionItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    subscriptionInfo: {
        marginBottom: 12,
    },
    subscriptionCategory: {
        fontSize: 10,
        color: '#4f46e5',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subscriptionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 2,
    },
    subscribedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    subscribedBadgeText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: 'bold',
    },
    subscriptionStats: {
        flexDirection: 'row',
        gap: 12,
    },
    subStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    subStatText: {
        fontSize: 12,
        color: '#6b7280',
    },
    postActivityBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0e7490',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    postActivityBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    activityActions: {
        flexDirection: 'row',
        columnGap: 16,
        rowGap: 8,
        flexWrap: 'wrap',
    },
    activityActionBtn: {
        padding: 4,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    formSubmitBtn: {
        backgroundColor: '#0e7490',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    formSubmitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    activitiesContainer: {
        gap: 12,
        paddingTop: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    guestBanner: {
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    guestBannerContent: {
        backgroundColor: '#0e7490',
        padding: 20,
        borderRadius: 12,
    },
    guestBannerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    guestBannerSub: {
        color: '#e0e7ff',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    guestBannerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    guestLoginBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: '#fff',
    },
    guestLoginText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    guestRegisterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    guestRegisterText: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingVertical: 16,
        paddingHorizontal: 0,
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#111827',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 0,
        marginBottom: 40,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 4,
    },
    paginationButtonDisabled: {
        borderColor: '#f3f4f6',
        backgroundColor: '#f9fafb',
    },
    paginationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0e7490',
    },
    paginationButtonDisabledText: {
        color: '#9ca3af',
    },
    pageIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    pageNumber: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    trendingEmptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    trendingEmptyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    trendingEmptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    trendingEmptySub: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 40,
    },
    topicSkeletonCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginHorizontal: 0,
    },
    communitySkeletonCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 0,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#0e7490',
        alignItems: 'center',
    },
    modalDangerBtn: {
        backgroundColor: '#ef4444',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    communitySelectorContainer: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 0,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownTrigger: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dropdownInner: {
        gap: 2,
    },
    dropdownLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9ca3af',
        letterSpacing: 0.5,
    },
    dropdownValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    // Picker Modal Styles
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    pickerSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
    },
    pickerSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#111827',
    },
    pickerListContainer: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    pickerItemActive: {
        backgroundColor: 'rgba(14, 116, 144, 0.08)',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#374151',
    },
    pickerItemActiveText: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    pickerEmptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 40,
        fontSize: 14,
    },
    activityItem: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        marginHorizontal: 0,
        marginVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        overflow: 'hidden',
    },
    activityIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0f9ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    activityBody: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    activityQuoteBox: {
        backgroundColor: '#f8fafc',
        borderLeftWidth: 3,
        borderLeftColor: '#0e7490',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    activityQuoteAuthor: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0e7490',
        marginBottom: 2,
    },
    activityQuoteBody: {
        fontSize: 11,
        color: '#475569',
        fontStyle: 'italic',
    },
    activityActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 6,
    },
    activityAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activityActionText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    activityRe: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 2,
    },
    reportInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 14,
        color: '#111827',
    },
    activityHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    activitySector: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0e7490',
        backgroundColor: '#ecfeff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
    activityYear: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    detailModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    detailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    detailModalBody: {
        padding: 24,
    },
    detailSection: {
        marginBottom: 24,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#9ca3af',
        letterSpacing: 1,
        marginBottom: 8,
    },
    detailValue: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    detailModalCloseBtn: {
        margin: 24,
        marginTop: 0,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    detailModalCloseText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },



});
