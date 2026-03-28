import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Platform, Modal } from 'react-native';
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
} from '../services/communityApi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetUserProfileQuery } from '../services/profileApi';
import { Skeleton } from '../components/common/Skeleton';
import { TopicCard } from '../components/TopicCard';
import { CommunityCard } from '../components/CommunityCard';
import { ActivityCard } from '../components/ActivityCard';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { showToast } from '../store/slices/uiSlice';
import CustomAlert from '../utils/CustomAlert';

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
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState('topics');

    useEffect(() => {
        if (route?.params?.initialSubTab) {
            setActiveSubTab(route.params.initialSubTab);
            navigation.setParams({ initialSubTab: undefined } as any);
        }
    }, [route?.params?.initialSubTab]);

    const [activeFilter, setActiveFilter] = useState('recents');
    const [categorySearch, setCategorySearch] = useState('');
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

    // Cross-platform modal state
    type ConfirmConfig = { title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [effectiveSearch, setEffectiveSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCommunityPickerVisible, setIsCommunityPickerVisible] = useState(false);
    const [communitySearch, setCommunitySearch] = useState('');
    const [debouncedCommunitySearch, setDebouncedCommunitySearch] = useState('');

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
    }, [activeSubTab, selectedCommunityId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

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
                            dispatch(showToast({
                                message: response?.message || 'Left community successfully',
                                type: response?.status ? 'success' : 'error'
                            }));
                        } catch (err: any) {
                            dispatch(showToast({ message: err?.data?.message || 'Failed to leave community', type: 'error' }));
                        }
                    }
                });
            } else {
                const response = await subscribe(community.id).unwrap() as any;
                dispatch(showToast({
                    message: response?.message || 'Joined community successfully',
                    type: response?.status ? 'success' : 'error'
                }));
            }
        } catch (err: any) {
            const serverError = err?.data?.message || 'Failed to update subscription';
            dispatch(showToast({ message: serverError, type: 'error' }));
        }
    };

    const { data: communitiesData } = useGetCommunitiesQuery({});

    const {
        data: globalTopicsData,
        isLoading: isLoadingGlobal,
        isFetching: isFetchingGlobal,
        refetch: refetchGlobal
    } = useGetGlobalTopicsQuery(
        {
            search: combinedSearch,
            page: currentPage,
            limit: ITEMS_PER_PAGE
        },
        { skip: activeSubTab !== 'topics' || selectedCommunityId !== null }
    );

    const {
        data: communityTopicsData,
        isLoading: isLoadingCommunityTopics,
        isFetching: isFetchingCommunity,
        refetch: refetchCommunity
    } = useGetCommunityTopicsQuery(
        {
            communityId: selectedCommunityId || '',
            filters: {
                search: combinedSearch,
                page: currentPage,
                limit: ITEMS_PER_PAGE
            }
        },
        { skip: !selectedCommunityId || activeSubTab !== 'topics' }
    );

    const { data: generalAnalytics } = useGetGeneralAnalyticsQuery(undefined, { skip: !isLoggedIn || selectedCommunityId !== null });
    const { data: communityAnalytics } = useGetCommunityAnalyticsQuery(selectedCommunityId || '', { skip: !selectedCommunityId });
    const { data: userProfile } = useGetUserProfileQuery(undefined, { skip: !isLoggedIn });
    const { data: subscriptions, refetch: refetchSubscriptions } = useGetMySubscriptionsQuery(undefined, { skip: !isLoggedIn || activeSubTab !== 'subscribed' });
    const { data: mentions, isLoading: isLoadingMentions, refetch: refetchMentions } = useGetMentionsQuery(undefined, { skip: !isLoggedIn || activeSubTab !== 'mentions' });

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

    const isFetching = activeSubTab === 'communities' ? isFetchingCommunitiesList : (selectedCommunityId ? isFetchingCommunity : isFetchingGlobal);

    const isLoading = activeSubTab === 'communities' ? isLoadingCommunitiesList : (selectedCommunityId ? (isLoadingCommunityTopics) : isLoadingGlobal);
    const topicsData = selectedCommunityId ? communityTopicsData : globalTopicsData;
    const listData = activeSubTab === 'communities' ? communitiesListData : topicsData;
    const topics = topicsData?.topics;
    const refetch = () => {
        if (activeSubTab === 'communities') return refetchCommunitiesList();
        if (activeSubTab === 'mentions') return refetchMentions();
        if (activeSubTab === 'subscribed') return refetchSubscriptions();
        if (activeSubTab === 'activities') return; // Mock data, nothing to refetch
        return selectedCommunityId ? refetchCommunity() : refetchGlobal();
    };

    const headerComponent = useMemo(() => (
        <View style={styles.feedHeaderContainer}>
            {isLoggedIn ? (
                <>
                    <View style={styles.pointsBadgeContainer}>
                        <View style={styles.pointsBadge}>
                            <View style={styles.pointsIconCircle}>
                                <ShieldCheck size={14} color="#fff" />
                            </View>
                            <Text style={styles.pointsLabel}>Your Points</Text>
                            <Text style={styles.pointsValue}>
                                {userProfile?.pointsCount || 0} <Text style={styles.pointsUnit}>pts</Text>
                            </Text>
                        </View>
                    </View>
                    <View style={styles.analyticsBar}>
                        {selectedCommunityId === null ? (
                            <>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>TOTAL TOPICS</Text>
                                    <Text style={styles.analyticsValue}>{generalAnalytics?.totalTopics || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>COMMUNITIES</Text>
                                    <Text style={styles.analyticsValue}>{generalAnalytics?.totalCommunities || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>MEMBERS</Text>
                                    <Text style={styles.analyticsValue}>{generalAnalytics?.totalMembers || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>JOINED</Text>
                                    <Text style={styles.analyticsValue}>{generalAnalytics?.myJoinedCommunities || 0}</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>TOTAL TOPICS</Text>
                                    <Text style={styles.analyticsValue}>{communityAnalytics?.totalTopics || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>MEMBERS</Text>
                                    <Text style={styles.analyticsValue}>{communityAnalytics?.totalMembers || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>ONLINE</Text>
                                    <Text style={styles.analyticsValue}>{communityAnalytics?.onlineMembers || 0}</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <Text style={styles.analyticsLabel}>JOINED</Text>
                                    <Text style={styles.analyticsValue}>{communityAnalytics?.dateJoined ? new Date(communityAnalytics.dateJoined).getFullYear() : '--'}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </>
            ) : (
                <GuestWelcomeBanner navigation={navigation} />
            )}

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        style={[styles.searchInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null]}
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabs} contentContainerStyle={styles.subTabsContent}>
                {['Topics', 'Activities', 'Communities', 'Mentions', 'Subscribed'].map((tab) => {
                    const tabKey = tab.toLowerCase();
                    if (!isLoggedIn && (tabKey === 'mentions' || tabKey === 'subscribed' || tabKey === 'activities')) return null;
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
                        {['Recents', 'Trending'].map((filter) => (
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

            {activeSubTab === 'topics' && !isLoggedIn && (
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'} style={styles.categoryScroller} contentContainerStyle={styles.categoryScrollerContent}>
                        {categoryFilters.map((cat) => (
                            <TouchableOpacity
                                key={cat.name}
                                style={[styles.categoryPill, categorySearch === cat.name && { backgroundColor: cat.bg, borderColor: cat.color }]}
                                onPress={() => setCategorySearch(prev => prev === cat.name ? '' : cat.name)}
                            >
                                <cat.icon size={14} color={categorySearch === cat.name ? cat.color : '#6b7280'} />
                                <Text style={[styles.categoryPillText, categorySearch === cat.name && { color: cat.color, fontWeight: 'bold' }]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    ), [isLoggedIn, generalAnalytics, communityAnalytics, userProfile, searchQuery, activeSubTab, activeFilter, categorySearch, navigation, selectedCommunityId]);


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

    const mockActivities = [
        {
            id: '1',
            topicTitle: 'Communication and Advocacy strategies f...',
            authorName: 'ASomebody',
            date: 'Mar 15, 2023',
            body: 'This is replying the main post',
            likes: 1
        },
        {
            id: '2',
            topicTitle: 'Communication and Advocacy strategies f...',
            authorName: 'ASomebody',
            date: 'Mar 15, 2023',
            body: 'This is replying the main post',
            likes: 1
        }
    ];

    const renderActivities = () => {
        return null;
    };

    const renderTrendingEmpty = () => (
        <View style={styles.trendingEmptyContainer}>
            <View style={styles.trendingEmptyCircle}>
                <TrendingUp size={40} color="#4f46e5" />
            </View>
            <Text style={styles.trendingEmptyTitle}>Trending topics coming soon!</Text>
            <Text style={styles.trendingEmptySub}>
                We're building a new way to discover the most active discussions in our community. Stay tuned!
            </Text>
        </View>
    );

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
        <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
            {communitiesData?.communities && (
                <View style={[styles.communitySelectorContainer, !isLoggedIn && { borderBottomWidth: 0, paddingBottom: 0, backgroundColor: 'transparent' }]}>
                    {isLoggedIn ? (
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setIsCommunityPickerVisible(true)}
                        >
                            <View style={styles.dropdownInner}>
                                <Text style={styles.dropdownLabel}>COMMUNITY</Text>
                                <View style={styles.dropdownValueRow}>
                                    <Text style={styles.dropdownValue} numberOfLines={1}>
                                        {selectedCommunity?.name || 'Global Feed'}
                                    </Text>
                                    <ChevronDown size={18} color="#0e7490" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.communityTab}>
                            <Text style={[styles.communityTabText, { fontSize: 12, color: '#6b7280', fontWeight: 'bold' }]}>
                                Global Feed
                            </Text>
                        </View>
                    )}
                </View>
            )}


            <FlatList
                data={(isFetching && currentPage === 1)
                    ? []
                    : (activeSubTab === 'topics'
                        ? (activeFilter === 'trending' ? [] : (topics || []))
                        : activeSubTab === 'communities' ? (communitiesListData?.communities || [])
                            : activeSubTab === 'mentions' ? (mentions || [])
                                : activeSubTab === 'subscribed' ? (subscriptions || [])
                                    : activeSubTab === 'activities' ? mockActivities
                                        : []
                    )
                }
                renderItem={({ item }: { item: any }) => {
                    if (activeSubTab === 'topics') {
                        return (
                            <TopicCard
                                topic={item}
                                readOnly={!isLoggedIn}
                                onTopicPress={(id) => {
                                    navigation.navigate('TopicDetail', {
                                        communityId: item.communityId,
                                        topicId: id
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
                                onPress={() => handleCommunityAction(item)}
                            />
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
                    if ((activeSubTab === 'topics' || activeSubTab === 'communities') && listData) {
                        const totalPages = (listData as any).totalPages || (listData as any).pages || 1;
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
                    if (activeFilter === 'trending' && activeSubTab === 'topics') return renderTrendingEmpty();
                    if (isLoading || isFetching) return <FeedSkeleton />;

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

            {isLoggedIn && activeSubTab === 'topics' && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            )}

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
                                style={styles.pickerSearchInput}
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
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    feedHeaderContainer: {
        backgroundColor: '#fff',
    },
    analyticsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    analyticsItem: {
        alignItems: 'center',
    },
    analyticsLabel: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    analyticsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    pointsBadgeContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: '#fff',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(23, 117, 166, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        alignSelf: 'flex-start',
        gap: 8,
    },
    pointsIconCircle: {
        backgroundColor: '#1775a6',
        borderRadius: 12,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointsLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1775a6',
    },
    pointsValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1775a6',
    },
    pointsUnit: {
        fontSize: 11,
        fontWeight: '600',
    },
    subTabs: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    subTabsContent: {
        paddingHorizontal: 8,
    },
    subTab: {
        paddingHorizontal: 16,
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
        backgroundColor: '#f3f4f6',
    },
    filterPillActive: {
        backgroundColor: '#4f46e5',
    },
    filterPillText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    filterPillTextActive: {
        color: '#fff',
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
    // communitySelectorContainer: {
    //     backgroundColor: '#fff',
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#f3f4f6',
    // },
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
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
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
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
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
        paddingHorizontal: 16,
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
        borderColor: '#f1f5f9'
    },
    communitySkeletonCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center'
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
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        // backgroundColor: '#fff',
        // borderBottomWidth: 1,
        // borderBottomColor: '#f3f4f6',
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
});

