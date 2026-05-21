import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { RootState } from '../store';


import { Skeleton } from '../components/common/Skeleton';
import {
    Search,
    X,
    ChevronDown,
    ChevronRight,
    ShieldCheck,
    Share2,
    MessageCircle,
    Eye,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import {
    useGetGlobalTopicsQuery,
    useGetCommunitiesQuery,
    useSubscribeToCommunityMutation,
    useUnsubscribeFromCommunityMutation
} from '../services/communityApi';
import { CommunityCard } from '../components/CommunityCard';
import { TopicCard } from '../components/TopicCard';


export function SearchScreen() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

    // Mutation hooks
    const [subscribe] = useSubscribeToCommunityMutation();
    const [unsubscribe] = useUnsubscribeFromCommunityMutation();

    // Cross-platform modal state
    type ConfirmConfig = { title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    const handleCommunityAction = async (community: any) => {
        if (!isLoggedIn) {
            showConfirm({
                title: 'Join Community',
                message: 'Please register and login to join this community.',
                confirmText: 'Login',
                onConfirm: () => {
                    navigation.navigate('Login');
                }
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
                            if (response?.status) {
                                dispatch(showToast({
                                    message: response?.message || 'Left community successfully',
                                    type: 'success'
                                }));
                            } else {
                                dispatch(showToast({
                                    message: response?.message || 'Failed to leave community',
                                    type: 'error'
                                }));
                            }
                        } catch (err: any) {
                            dispatch(showToast({ message: err?.data?.message || 'Failed to leave community', type: 'error' }));
                        }
                    }
                });
            } else {
                const response = await subscribe(community.id).unwrap() as any;
                if (response?.status) {
                    dispatch(showToast({
                        message: response?.message || 'Joined community successfully',
                        type: 'success'
                    }));
                } else {
                    dispatch(showToast({
                        message: response?.message || 'Failed to join community',
                        type: 'error'
                    }));
                }
            }
        } catch (err: any) {
            const serverError = err?.data?.message || 'Failed to update subscription';
            dispatch(showToast({ message: serverError, type: 'error' }));
        }
    };

    useEffect(() => {

        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 800);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data: topicsData,
        isFetching: isFetchingTopics,
    } = useGetGlobalTopicsQuery(
        { search: debouncedSearch, page: 1, limit: 10 },
        { skip: !debouncedSearch }
    );

    const {
        data: communitiesData,
        isFetching: isFetchingCommunities,
    } = useGetCommunitiesQuery(
        { search: debouncedSearch, page: 1, limit: 10 },
        { skip: !debouncedSearch }
    );

    // Fetch Trending Topics for Initial View
    const { data: trendingData, isLoading: isLoadingTrending } = useGetGlobalTopicsQuery(
        { filter: 'TRENDING', limit: 3 },
        { skip: !!searchQuery }
    );

    // Fetch Popular Communities for Initial View
    const { data: popularData, isLoading: isLoadingPopular } = useGetCommunitiesQuery(
        { limit: 4 },
        { skip: !!searchQuery }
    );

    const renderInitialView = () => (
        <ScrollView style={styles.searchInitial}>
            {/* Trending Section */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>TRENDING IN FORUM</Text>
                {isLoadingTrending ? (
                    <ActivityIndicator style={{ padding: 20 }} color="#0e7490" />
                ) : (
                    trendingData?.topics?.map((topic: any) => (
                        <TouchableOpacity
                            key={topic.id}
                            style={styles.trendingItem}
                            onPress={() => navigation.navigate('TopicDetail', { communityId: topic.communityId, topicId: topic.id })}
                        >
                            <View style={styles.trendingIcon}>
                                <Text style={styles.trendingIconText}>
                                    {(topic.author?.fullName || 'A').charAt(0)}
                                </Text>
                            </View>
                            <View style={styles.trendingContent}>
                                <Text style={styles.trendingTitle} numberOfLines={1}>{topic.title}</Text>
                                <View style={styles.trendingMeta}>
                                    <View style={styles.statItemRow}>
                                        <MessageCircle size={12} color="#9ca3af" />
                                        <Text style={styles.statTextSmall}>{topic.commentCount || 0}</Text>
                                    </View>
                                    <View style={styles.statItemRow}>
                                        <Eye size={12} color="#9ca3af" />
                                        <Text style={styles.statTextSmall}>{topic.viewCount || 0}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                {!isLoadingTrending && (!trendingData?.topics || trendingData.topics.length === 0) && (
                    <Text style={styles.emptyTextSmaller}>No trending topics at the moment</Text>
                )}
            </View>

            {/* Popular Communities Section */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>POPULAR COMMUNITIES</Text>
                <View style={styles.popularCommunitiesList}>
                    {isLoadingPopular ? (
                        <ActivityIndicator style={{ padding: 20 }} color="#0e7490" />
                    ) : (
                        popularData?.communities?.map((community: any) => (
                            <CommunityCard
                                key={community.id}
                                community={community}
                                isLoggedIn={isLoggedIn}
                                onPress={() => handleCommunityAction(community)}
                            />
                        ))
                    )}
                    {!isLoadingPopular && (!popularData?.communities || popularData.communities.length === 0) && (
                        <Text style={styles.emptyTextSmaller}>No communities found</Text>
                    )}

                    <TouchableOpacity
                        style={styles.loadMoreBtn}
                        onPress={() => navigation.navigate('MainTabs' as any)}
                    >
                        <Text style={styles.loadMoreBtnText}>View all communities</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderResultsView = () => (
        <View style={styles.searchResults}>
            {(isFetchingTopics || isFetchingCommunities) ? (
                <View style={{ padding: 16 }}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.skeletonCard}>
                            <Skeleton width={40} height={40} borderRadius={20} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                                <Skeleton width="90%" height={14} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.resultsList}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {topicsData?.topics?.length ? (
                            <View style={styles.resultsSection}>
                                <Text style={styles.resultsCount}>TOPICS FOUND ({topicsData.topics.length})</Text>
                                {topicsData.topics.map((topic: any) => (
                                    <TopicCard
                                        key={topic.id}
                                        topic={topic}
                                        isLoggedIn={isLoggedIn}
                                        onPress={() => navigation.navigate('TopicDetail', { communityId: topic.communityId, topicId: topic.id })}
                                    />
                                ))}
                            </View>
                        ) : null}

                        {communitiesData?.communities?.length ? (
                            <View style={styles.resultsSection}>
                                <Text style={styles.resultsCount}>COMMUNITIES FOUND ({communitiesData.communities.length})</Text>
                                {communitiesData.communities.map((community: any) => (
                                    <View key={community.id} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                                        <CommunityCard
                                            community={community}
                                            isLoggedIn={isLoggedIn}
                                            onPress={() => handleCommunityAction(community)}
                                        />

                                    </View>
                                ))}
                            </View>
                        ) : null}

                        {!topicsData?.topics?.length && !communitiesData?.communities?.length && (
                            <View style={styles.centered}><Text style={styles.emptyText}>No results found for "{searchQuery}"</Text></View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.searchHeader}>
                <Text style={styles.screenTitle}>Search</Text>
                <View style={styles.searchBarLarge}>
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchBarInput}
                        placeholder="Search forum..."
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            setIsSearching(text.length > 0);
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearching(false); }}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {searchQuery.length > 0 ? renderResultsView() : renderInitialView()}

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
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchHeader: {
        padding: 16,
        gap: 16,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchBarLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchBarInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
        ...Platform.select({
            web: {
                outlineStyle: 'none' as any,
            },
        }),
    },
    searchInitial: {
        flex: 1,
    },
    searchSection: {
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        letterSpacing: 0.5,
    },
    clearAll: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '600',
    },
    recentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    recentText: {
        fontSize: 14,
        color: '#374151',
    },
    trendingItem: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    trendingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendingIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    trendingContent: {
        flex: 1,
        gap: 4,
    },
    trendingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    trendingMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statTextSmall: {
        fontSize: 12,
        color: '#6b7280',
    },
    searchResults: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    searchSubTabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    searchSubTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    searchSubTabActive: {
        borderBottomColor: '#0e7490',
    },
    searchSubTabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    searchSubTabTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    resultsList: {
        flex: 1,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    filterToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterToggleText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    sortInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sortLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    sortValue: {
        color: '#111827',
        fontWeight: 'bold',
    },
    resultsCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        padding: 16,
        letterSpacing: 0.5,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    emptyTextSmaller: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
        padding: 20,
    },
    popularCommunitiesList: {
        gap: 12,
    },
    loadMoreBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    loadMoreBtnText: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: 'bold',
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
    },
    resultsSection: {
        marginBottom: 20,
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
});

