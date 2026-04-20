import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { RootStackParamList, CommunitiesStackParamList } from '../navigation/types';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
    useGetCommunitiesQuery,
    useSubscribeToCommunityMutation,
    useUnsubscribeFromCommunityMutation,
    useGetMySubscriptionsQuery
} from '../services/communityApi';
import { CommunityCard } from '../components/CommunityCard';
import { Skeleton } from '../components/common/Skeleton';
import { RootState } from '../store';
import { showToast } from '../store/slices/uiSlice';
import CustomAlert from '../utils/CustomAlert';

const Alert = CustomAlert;

export function CommunitiesScreen() {
    const navigation = useNavigation<NavigationProp<CommunitiesStackParamList & RootStackParamList>>();
    const [page, setPage] = useState(1);
    const limit = 10;
    const search = undefined; // Adding back missing search variable

    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

    const [activeFilter, setActiveFilter] = useState<'all' | 'subscribed'>('all');
    const { data: allData, isLoading: isLoadingAll, refetch: refetchAll } = useGetCommunitiesQuery({ search, page, limit });
    const { data: subsData, isLoading: isLoadingSubs, refetch: refetchSubs } = useGetMySubscriptionsQuery(undefined, {
        skip: !isLoggedIn || activeFilter === 'all'
    });

    const [subscribe] = useSubscribeToCommunityMutation();
    const [unsubscribe] = useUnsubscribeFromCommunityMutation();

    const communities = activeFilter === 'all' ? (allData?.communities || []) : (subsData?.map((c: any) => ({ ...c, joined: true })) || []);
    const isLoading = activeFilter === 'all' ? isLoadingAll : isLoadingSubs;
    const refetch = activeFilter === 'all' ? refetchAll : refetchSubs;

    const totalPages = activeFilter === 'all' ? Math.ceil((allData?.total || 0) / limit) : 1;

    const handleNextPage = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const flatListRef = React.useRef<FlatList>(null);

    React.useEffect(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [page, activeFilter]);

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
                // Confirm leave
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

    const CommunitySkeleton = () => (
        <View style={styles.skeletonContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton width={60} height={60} borderRadius={12} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                    <Skeleton width="20%" height={10} style={{ marginBottom: 4 }} />
                    <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={12} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.screenHeader}>
                    <Text style={styles.screenTitle}>Communities</Text>
                </View>
                <View style={{ padding: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>Communities</Text>
                {isLoggedIn && (
                    <View style={styles.filterTabs}>
                        {['all', 'subscribed'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterTab, activeFilter === f && styles.activeFilterTab]}
                                onPress={() => setActiveFilter(f as any)}
                            >
                                <Text style={[styles.filterTabText, activeFilter === f && styles.activeFilterTabText]}>
                                    {f === 'all' ? 'All' : 'Subscribed'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <FlatList
                ref={flatListRef}
                data={communities}
                renderItem={({ item, index }) => (
                    <CommunityCard
                        community={item}
                        isLoggedIn={isLoggedIn}
                        isFirst={index === 0}
                        isLast={index === communities.length - 1}
                        onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                        onSubscribe={() => handleCommunityAction(item)}
                        isJoined={activeFilter === 'subscribed' || !!item.joined || !!item.isJoined || !!item.isSubscribed}
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.communityList}
                onRefresh={refetch}
                refreshing={isLoading}
                ListFooterComponent={() => (
                    activeFilter === 'all' && totalPages > 1 ? (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[styles.paginationButton, page <= 1 && styles.paginationButtonDisabled]}
                                onPress={handlePrevPage}
                                disabled={page <= 1}
                            >
                                <Text style={styles.paginationButtonText}>Previous</Text>
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                Page {page} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                style={[styles.paginationButton, page >= totalPages && styles.paginationButtonDisabled]}
                                onPress={handleNextPage}
                                disabled={page >= totalPages}
                            >
                                <Text style={styles.paginationButtonText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                )}
                ListEmptyComponent={() => {
                    if (isLoading) return null;
                    return (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No communities found</Text>
                        </View>
                    );
                }}
            />

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
        backgroundColor: '#f9fafb',
    },
    screenHeader: {
        padding: 16,
        backgroundColor: '#fff',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 0,
        alignSelf: 'flex-start',
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    activeFilterTab: {
        backgroundColor: '#e0f2fe',
        borderColor: '#e0f2fe',
        shadowColor: 'transparent',
        elevation: 0,
    },
    filterTabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeFilterTabText: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    communityList: {
        padding: 16,
        paddingBottom: 100,
    },
    skeletonContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
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
    // Pagination Styles
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 8,
        marginTop: 10,
    },
    paginationButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minWidth: 100,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    paginationButtonDisabled: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
        opacity: 0.5,
    },
    paginationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0e7490',
    },
    paginationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
});
