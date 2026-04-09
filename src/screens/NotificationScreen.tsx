import React, { useState, useMemo, useRef, useEffect } from 'react';

import CustomAlert from '../utils/CustomAlert';
const Alert = CustomAlert;
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl, ScrollView, Animated, Modal, Platform } from 'react-native';;
import { Bell, CheckCheck, Trash2, MessageSquare, Heart, Filter, RefreshCcw, UserCheck, Calendar, ChevronDown, Info, CheckCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    useGetNotificationsQuery,
    useMarkAllReadMutation,
    useMarkReadMutation,
    useDeleteNotificationMutation,
    useClearNotificationsMutation,
    NotificationType,
    Notification
} from '../services/notificationApi';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';

// Zero-dependency helper to avoid crashes if date-fns is missing
const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

export function NotificationScreen({ isLoggedIn, navigation }: { isLoggedIn?: boolean; navigation?: any }) {
    const insets = useSafeAreaInsets();
    const statusTabs = ['All', 'Unread'];
    const flatListRef = useRef<FlatList>(null);

    // Comprehensive labels for all available notification types from the API
    const CATEGORIES = [
        { label: 'Every Category', value: 'All' },
        { label: 'Account Approved', value: 'ACCOUNT_APPROVED' },
        { label: 'Account Rejected', value: 'ACCOUNT_REJECTED' },
        { label: 'Event Registration', value: 'EVENT_REGISTRATION_CONFIRMED' },
        { label: 'Event Updated', value: 'EVENT_UPDATED' },
        { label: 'Event Cancelled', value: 'EVENT_CANCELLED' },
        { label: 'Event Reminder', value: 'EVENT_REMINDER' },
        { label: 'Mentor Request', value: 'MENTOR_REQUEST_RECEIVED' },
        { label: 'Mentor Approved', value: 'MENTOR_REQUEST_APPROVED' },
        { label: 'Mentor Declined', value: 'MENTOR_REQUEST_DECLINED' },
        { label: 'Mentor Done', value: 'MENTOR_SESSION_COMPLETED' },
        { label: 'Comments', value: 'COMMUNITY_TOPIC_COMMENT' },
        { label: 'Mentions', value: 'COMMUNITY_MENTION' },
        { label: 'Likes', value: 'COMMUNITY_TOPIC_LIKED' },
        { label: 'Resource Done', value: 'RESOURCE_COMPLETED' },
        { label: 'Achievements', value: 'ACHIEVEMENT_EARNED' },
        { label: 'Assessments', value: 'ODA_ASSESSMENT_COMPLETED' },
        { label: 'System Announcements', value: 'SYSTEM_ANNOUNCEMENT' },
    ];

    const [activeStatus, setActiveStatus] = useState<'All' | 'Unread'>('All');
    const [activeCategory, setActiveCategory] = useState('All');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [page, setPage] = useState(1);

    // Cross-platform modal state (replaces Alert.alert which is a no-op on web)
    type ConfirmConfig = { title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);
    const [detailsItem, setDetailsItem] = useState<Notification | null>(null);

    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    // API Hooks
    const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
        page,
        limit: 10,
        isRead: activeStatus === 'Unread' ? false : undefined,
        type: activeCategory === 'All' ? undefined : activeCategory as any,
    }, { skip: !isLoggedIn });

    console.log('[NotificationScreen] Render State:', { page, isFetching, dataLength: data?.notifications?.length, dataPage: data?.page });

    const [markAllRead] = useMarkAllReadMutation();
    const [markRead] = useMarkReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();
    const [clearNotifications] = useClearNotificationsMutation();

    const dispatch = useDispatch();

    const notifications = data?.notifications || [];
    console.log('notifications', notifications)
    const handleMarkAllRead = () => {
        showConfirm({
            title: 'Mark all as read',
            message: 'Are you sure you want to mark all notifications as read?',
            confirmText: 'Mark All',
            onConfirm: async () => {
                try {
                    const response = await markAllRead().unwrap() as any;
                    if (response?.status) {
                        dispatch(showToast({
                            message: response?.message || 'All notifications marked as read',
                            type: 'success'
                        }));
                    } else {
                        dispatch(showToast({
                            message: response?.message || 'Failed to mark all notifications as read',
                            type: 'error'
                        }));
                    }
                } catch (error: any) {
                    dispatch(showToast({ message: error?.data?.message || 'Failed to mark as read', type: 'error' }));
                }
            }
        });
    };

    const handleNotificationPress = async (item: Notification) => {
        // Mark as read silently
        if (!item.isRead) {
            try { await markRead({ ids: [item.id] }).unwrap() as any; } catch (_) { }
        }

        // Navigate to topic if it's a mention or comment
        if (item.type === 'COMMUNITY_MENTION' || item.type === 'COMMUNITY_TOPIC_COMMENT') {
            const data = item.data as any;
            const cid = data?.communityId || data?.topic?.communityId || data?.comment?.communityId;
            const tid = data?.topicId || data?.comment?.topicId;

            if (cid && tid) {
                navigation.navigate('TopicDetail', { communityId: cid, topicId: tid });
                return;
            }
        }

        // Open the in-app details modal for others
        setDetailsItem(item);
    };


    const handleDelete = (id: string) => {
        showConfirm({
            title: 'Delete Notification',
            message: 'Are you sure you want to delete this notification?',
            confirmText: 'Delete',
            danger: true,
            onConfirm: async () => {
                try {
                    const response = await deleteNotification(id).unwrap() as any;
                    if (response?.status) {
                        dispatch(showToast({
                            message: response?.message || 'Notification deleted',
                            type: 'success'
                        }));
                    }
                    else {
                        dispatch(showToast({
                            message: response?.message || 'Failed to delete notification',
                            type: 'error'
                        }));
                    }
                } catch (error: any) {
                    dispatch(showToast({ message: error?.data?.message || 'Failed to delete', type: 'error' }));
                }
            }
        });
    };

    const getIcon = (type: NotificationType) => {
        const props = { size: 24 };
        const MyCheckIcon = CheckCircle2 || CheckCircle || Bell; // Safe fallback
        if (type.includes('CONFIRMED')) return <MyCheckIcon {...props} color="#10b981" />;
        if (type.includes('COMMENT') || type.includes('MENTION')) return <MessageSquare {...props} color="#0e7490" />;
        if (type.includes('LIKED')) return <Heart {...props} color="#ef4444" />;
        if (type.includes('EVENT')) return <Calendar {...props} color="#0e7490" />;
        if (type.includes('ACCOUNT') || type.includes('ACHIEVEMENT')) return <UserCheck {...props} color="#10b981" />;
        return <Info {...props} color="#0e7490" />;
    };

    const NotificationSkeleton = () => {
        const shimmerAnim = useMemo(() => new Animated.Value(0), []);

        React.useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        }, [shimmerAnim]);

        const opacity = shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
        });

        return (
            <Animated.View style={[styles.skeletonItem, { opacity }]}>
                <View style={styles.leftStripSkeleton} />
                <View style={styles.itemInner}>
                    <View style={styles.itemMainRow}>
                        <View style={styles.skeletonIcon} />
                        <View style={styles.itemHeaderContent}>
                            <View style={styles.skeletonTitle} />
                            <View style={styles.skeletonTime} />
                        </View>
                    </View>
                    <View style={styles.skeletonBody} />
                    <View style={styles.skeletonBodyShort} />
                </View>
            </Animated.View>
        );
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const isUnread = item?.isRead === false;

        return (
            <TouchableOpacity
                style={[styles.item, isUnread && styles.itemUnread]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.itemInner}>
                    <View style={styles.itemMainRow}>
                        {isUnread && <View style={styles.unreadDot} />}
                        <Text style={[styles.itemTitle, isUnread && styles.textBold]} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>

                    <Text style={styles.itemTime}>
                        {timeAgo(new Date(item.createdAt))}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const handleClearAll = () => {
        showConfirm({
            title: 'Clear All Notifications',
            message: 'Are you sure you want to delete ALL notifications? This cannot be undone.',
            confirmText: 'Clear All',
            danger: true,
            onConfirm: async () => {
                try {
                    const response = await clearNotifications().unwrap() as any;
                    dispatch(showToast({
                        message: response?.message || 'All notifications cleared',
                        type: response?.status ? 'success' : 'error'
                    }));
                } catch (error: any) {
                    dispatch(showToast({ message: error?.data?.message || 'Failed to clear notifications', type: 'error' }));
                }
            }
        });
    };

    const handleNextPage = () => {
        if (!data || isFetching) return;
        const totalPages = Math.ceil(data.total / data.limit);
        if (page < totalPages) {
            setPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (isFetching || page <= 1) return;
        setPage(prev => prev - 1);
    };

    const handleRefresh = () => {
        setPage(1);
        refetch();
    };

    useEffect(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [page]);

    const handleTabChange = (tabName: 'All' | 'Unread') => {
        setActiveStatus(tabName);
        setPage(1);
    };

    const handleCategoryChange = (val: string) => {
        setActiveCategory(val);
        setShowCategoryDropdown(false);
        setPage(1);
    };

    const selectedCategoryLabel = CATEGORIES.find(c => c.value === activeCategory)?.label || 'Every Category';

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
                <View>
                    <Text style={styles.title}>Notifications</Text>
                    {isLoggedIn && data?.unreadCount !== undefined && data.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{data.unreadCount} new</Text>
                        </View>
                    )}
                </View>
            </View>

            {isLoggedIn && (
                <View style={styles.topControls}>
                    <View style={styles.filterBar}>
                        <View style={styles.statusToggles}>
                            {statusTabs.map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.statusTab, activeStatus === tab && styles.statusTabActive]}
                                    onPress={() => handleTabChange(tab as any)}
                                >
                                    <Text style={[styles.statusTabText, activeStatus === tab && styles.statusTabTextActive]}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.categoryDropdown}
                            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <Filter size={16} color="#9ca3af" />
                            <Text style={styles.categoryDropdownText} numberOfLines={1}>
                                {selectedCategoryLabel}
                            </Text>
                            <ChevronDown size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {showCategoryDropdown && (
                        <View style={styles.dropdownMenu}>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.value}
                                        style={[styles.dropdownItem, activeCategory === cat.value && styles.dropdownItemActive]}
                                        onPress={() => handleCategoryChange(cat.value)}
                                    >
                                        <Text style={[styles.dropdownItemText, activeCategory === cat.value && styles.dropdownItemTextActive]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actionBarScroll}
                        style={styles.actionBarWrapper}
                    >
                        <TouchableOpacity
                            onPress={(data?.unreadCount || 0) > 0 ? handleMarkAllRead : undefined}
                            style={[
                                styles.headerActionBtn,
                                (data?.unreadCount || 0) === 0 && { opacity: 0.5, backgroundColor: '#f3f4f6' }
                            ]}
                            activeOpacity={(data?.unreadCount || 0) > 0 ? 0.2 : 1}
                        >
                            <CheckCheck size={16} color={(data?.unreadCount || 0) > 0 ? '#0e7490' : '#9ca3af'} />
                            <Text style={[styles.headerActionText, (data?.unreadCount || 0) === 0 && { color: '#9ca3af' }]}>Mark all as read</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleRefresh} style={styles.headerActionBtn}>
                            <RefreshCcw size={16} color="#0e7490" />
                            <Text style={styles.headerActionText}>Refresh</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={notifications.length > 0 ? handleClearAll : undefined}
                            style={[
                                styles.headerActionBtn,
                                notifications.length === 0 && { opacity: 0.5, backgroundColor: '#f3f4f6' }
                            ]}
                            activeOpacity={notifications.length > 0 ? 0.2 : 1}
                        >
                            <Trash2 size={16} color={notifications.length > 0 ? '#ef4444' : '#9ca3af'} />
                            <Text style={[styles.headerActionText, { color: notifications.length > 0 ? '#ef4444' : '#9ca3af' }]}>
                                Clear All
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
                refreshControl={
                    <RefreshControl refreshing={isFetching && page === 1} onRefresh={handleRefresh} tintColor="#0e7490" />
                }
                ListFooterComponent={() => {
                    if (isLoading || !data || data.total === 0) return null;
                    const totalPages = Math.ceil(data.total / data.limit);

                    return (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[styles.paginationButton, page <= 1 && styles.paginationButtonDisabled]}
                                onPress={handlePrevPage}
                                disabled={page <= 1 || isFetching}
                            >
                                <ChevronLeft size={16} color={page <= 1 ? '#9ca3af' : '#374151'} />
                                <Text style={[styles.paginationButtonText, page <= 1 && styles.paginationButtonTextDisabled]}>
                                    Previous
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                Page {page} of {totalPages || 1}
                            </Text>

                            <TouchableOpacity
                                style={[styles.paginationButton, page >= totalPages && styles.paginationButtonDisabled]}
                                onPress={handleNextPage}
                                disabled={page >= totalPages || isFetching}
                            >
                                <Text style={[styles.paginationButtonText, page >= totalPages && styles.paginationButtonTextDisabled]}>
                                    Next
                                </Text>
                                <ChevronRight size={16} color={page >= totalPages ? '#9ca3af' : '#374151'} />
                            </TouchableOpacity>
                        </View>
                    );
                }}
                ListHeaderComponent={isLoading || (isFetching && page === 1) ? (
                    <View style={{ paddingTop: 8 }}>
                        <NotificationSkeleton />
                        <NotificationSkeleton />
                        <NotificationSkeleton />
                    </View>
                ) : null}
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
                        ) : !isLoading && (
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
                            <TouchableOpacity style={[styles.modalCancelBtn, { flex: 1 }]} onPress={dismissConfirm}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, confirmModal?.danger && styles.modalDangerBtn, { flex: 1 }]}
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

            {/* ── Cross-Platform DETAILS Modal ── */}
            <Modal
                visible={!!detailsItem}
                transparent
                animationType="slide"
                onRequestClose={() => setDetailsItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { maxHeight: '80%' }]}>
                        {detailsItem && (
                            <>
                                <View style={styles.detailsHeader}>
                                    <View style={styles.iconBox}>
                                        {getIcon(detailsItem.type)}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalTitle}>{detailsItem.title}</Text>
                                        <View style={styles.timeAgoRow}>
                                            <Clock size={13} color="#9ca3af" />
                                            <Text style={styles.itemTime}>{timeAgo(new Date(detailsItem.createdAt))}</Text>
                                        </View>
                                    </View>
                                </View>
                                <ScrollView style={{ marginTop: 12 }}>
                                    <Text style={styles.detailsBody}>{detailsItem.body}</Text>

                                    {detailsItem.data?.meta?.eventTitle && (
                                        <View style={[styles.metaPill, { marginTop: 12 }]}>
                                            <Calendar size={14} color="#0e7490" />
                                            <Text style={styles.metaPillText}>{detailsItem.data.meta.eventTitle}</Text>
                                        </View>
                                    )}
                                    {detailsItem.data?.meta?.startTime && (
                                        <View style={[styles.metaPill, { marginTop: 8 }]}>
                                            <Clock size={14} color="#0e7490" />
                                            <Text style={styles.metaPillText}>
                                                {new Date(detailsItem.data.meta.startTime).toLocaleString()}
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                                <TouchableOpacity
                                    style={[styles.modalConfirmBtn, { marginTop: 16, alignSelf: 'stretch' }]}
                                    onPress={() => setDetailsItem(null)}
                                >
                                    <Text style={styles.modalConfirmText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    unreadBadge: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    unreadBadgeText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerActionText: {
        fontSize: 12,
        color: '#0e7490',
        fontWeight: '600',
    },
    topControls: {
        paddingBottom: 8,
        zIndex: 100,
        elevation: 10,
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 8,
        zIndex: 10,
    },
    actionBarWrapper: {
        marginTop: 8,
        marginBottom: 16,
        zIndex: 1,
    },
    actionBarScroll: {
        paddingLeft: 12,
        paddingRight: 24,
        gap: 8,
        alignItems: 'center',
    },
    statusToggles: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 4,
        borderRadius: 10,
    },
    statusTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusTabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statusTabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    statusTabTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    rightFilters: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        maxWidth: 160,
    },
    categoryDropdownText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        right: 16,
        left: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
        padding: 8,
        zIndex: 500,
    },
    dropdownItem: {
        padding: 12,
        borderRadius: 8,
    },
    dropdownItemActive: {
        backgroundColor: '#f0f9ff',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#4b5563',
    },
    dropdownItemTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    list: {
        flexGrow: 1,
    },
    item: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    itemUnread: {
        backgroundColor: '#e0f2fe',
    },
    itemInner: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    itemMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeAgoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemHeaderContent: {
        flex: 1,
        justifyContent: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    metaContainer: {
        flexDirection: 'column',
        gap: 8,
        marginTop: 4,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 8,
    },
    metaPillText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    viewDetailsText: {
        fontSize: 12,
        color: '#0e7490',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        letterSpacing: 0.5,
    },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginRight: 8,
    },
    itemTitle: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
        flex: 1,
    },
    textBold: {
        fontWeight: '700',
    },
    itemBody: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    itemTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    deleteButton: {
        padding: 4,
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
    // Skeleton Styles
    skeletonItem: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        height: 120,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    leftStripSkeleton: {
        width: 6,
        height: '100%',
        backgroundColor: '#e5e7eb',
    },
    skeletonIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#e5e7eb',
    },
    skeletonTitle: {
        width: '60%',
        height: 16,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonTime: {
        width: '40%',
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
    },
    skeletonBody: {
        width: '100%',
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        marginTop: 16,
    },
    skeletonBodyShort: {
        width: '70%',
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        marginTop: 8,
    },

    // ── Modal Styles ──────────────────────────────────────────
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
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    modalConfirmBtn: {
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDangerBtn: {
        backgroundColor: '#ef4444',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 4,
    },
    detailsBody: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 24,
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
        backgroundColor: '#f9fafb',
        borderColor: '#f3f4f6',
    },
    paginationButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    paginationButtonTextDisabled: {
        color: '#9ca3af',
    },
    paginationText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
});
