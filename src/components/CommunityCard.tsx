import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, ScrollView, Platform } from 'react-native';
import { Bell, MessageCircle, Users, Check, X, Calendar, User as UserIcon } from 'lucide-react-native';

export function CommunityCard({
    community,
    isLoggedIn,
    onPress
}: {
    community: any;
    isLoggedIn?: boolean;
    onPress?: () => void;
}) {
    const [showDetail, setShowDetail] = useState(false);
    const isJoined = community.joined === true;

    // Format date: "14th Feb, 2026"
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };

    return (
        <View style={styles.communityListItem}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDetail(true)}
                style={styles.cardHeaderArea}
            >
                <View style={styles.communityHeaderRow}>
                    {community.imageUrl ? (
                        <Image source={{ uri: community.imageUrl }} style={styles.communityImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>{community.name?.charAt(0) || 'C'}</Text>
                        </View>
                    )}

                    <View style={styles.communityListInfo}>
                        <Text style={styles.communityListName} numberOfLines={1}>{community.name}</Text>
                        <View style={styles.communityListStatsRow}>
                            <View style={styles.subStat}>
                                <Users size={12} color="#6b7280" />
                                <Text style={styles.subStatText}>{community.memberCount || 0} Members</Text>
                            </View>
                            <View style={styles.subStat}>
                                <MessageCircle size={12} color="#6b7280" />
                                <Text style={styles.subStatText}>{community.topicCount || 0} Topics</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {community.description ? (
                    <Text style={styles.communityDescription} numberOfLines={2}>
                        {community.description}
                    </Text>
                ) : null}
            </TouchableOpacity>

            <View style={styles.communityListActions}>
                <TouchableOpacity
                    style={[styles.subscribeBtn, isJoined && styles.joinedBtn]}
                    onPress={onPress}
                    activeOpacity={0.7}
                >
                    {isJoined ? (
                        <Check size={14} color="#059669" />
                    ) : (
                        <Bell size={14} color="#0e7490" />
                    )}
                    <Text style={[styles.subscribeBtnText, isJoined && styles.joinedBtnText]}>
                        {isJoined ? 'Subscribed' : (isLoggedIn ? 'Subscribe' : 'Join Community')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Community Detail Modal */}
            <Modal
                visible={showDetail}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowDetail(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                        {/* Modal Header / Cover */}
                        <View style={styles.modalHeader}>
                            {community.imageUrl ? (
                                <Image source={{ uri: community.imageUrl }} style={styles.modalCoverImage} />
                            ) : (
                                <View style={[styles.modalCoverPlaceholder, { backgroundColor: '#0e7490' }]}>
                                    <Text style={styles.modalCoverPlaceholderText}>{community.name?.charAt(0) || 'C'}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowDetail(false)}
                            >
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        <View style={styles.modalContent}>
                            <View style={styles.titleSection}>
                                <Text style={styles.modalName}>{community.name}</Text>
                                {community.category && (
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{community.category}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.modalStatsRow}>
                                <View style={styles.modalStatItem}>
                                    <Users size={20} color="#0e7490" />
                                    <View>
                                        <Text style={styles.modalStatValue}>{community.memberCount || 0}</Text>
                                        <Text style={styles.modalStatLabel}>Members</Text>
                                    </View>
                                </View>
                                <View style={styles.modalStatItem}>
                                    <MessageCircle size={20} color="#0e7490" />
                                    <View>
                                        <Text style={styles.modalStatValue}>{community.topicCount || 0}</Text>
                                        <Text style={styles.modalStatLabel}>Topics</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.sectionDivider} />

                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>About</Text>
                                <Text style={styles.modalDescription}>
                                    {community.description || 'No description provided.'}
                                </Text>
                            </View>

                            <View style={styles.metadataSection}>
                                <View style={styles.metadataItem}>
                                    <Calendar size={16} color="#6b7280" />
                                    <Text style={styles.metadataText}>Created on {formatDate(community.createdAt)}</Text>
                                </View>
                                {community.createdBy && (
                                    <View style={styles.metadataItem}>
                                        <UserIcon size={16} color="#6b7280" />
                                        <Text style={styles.metadataText}>Managed by {community.createdBy.fullName}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.modalActionArea}>
                                <TouchableOpacity
                                    style={[styles.modalActionBtn, isJoined && styles.modalJoinedBtn]}
                                    onPress={() => {
                                        onPress?.();
                                        // Update local state if needed elsewhere, but for now just trigger action
                                    }}
                                    activeOpacity={0.8}
                                >
                                    {isJoined ? (
                                        <Check size={20} color="#fff" />
                                    ) : (
                                        <Bell size={20} color="#fff" />
                                    )}
                                    <Text style={styles.modalActionBtnText}>
                                        {isJoined ? 'Already Subscribed' : (isLoggedIn ? 'Subscribe Now' : 'Join to Participate')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    communityListItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardHeaderArea: {
        marginBottom: 8,
    },
    communityHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    communityImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#f3f4f6',
    },
    placeholderImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    communityListInfo: {
        flex: 1,
    },
    communityListName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    communityListStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    communityDescription: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    communityListActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    subscribeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    subscribeBtnText: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: '600',
    },
    joinedBtn: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
        borderWidth: 1,
    },
    joinedBtnText: {
        color: '#059669',
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        position: 'relative',
        height: 250,
        width: '100%',
    },
    modalCoverImage: {
        width: '100%',
        height: '100%',
    },
    modalCoverPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCoverPlaceholderText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.3)',
    },
    closeBtn: {
        position: 'absolute',
        top: 40,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalContent: {
        padding: 24,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        backgroundColor: '#fff',
    },
    titleSection: {
        marginBottom: 20,
    },
    modalName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    categoryBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    categoryText: {
        color: '#0e7490',
        fontSize: 12,
        fontWeight: '600',
    },
    modalStatsRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    modalStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalStatLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 24,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
    },
    metadataSection: {
        marginBottom: 32,
        gap: 12,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metadataText: {
        fontSize: 14,
        color: '#6b7280',
    },
    modalActionArea: {
        marginTop: 8,
        marginBottom: 40,
    },
    modalActionBtn: {
        backgroundColor: '#0e7490',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#0e7490',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalJoinedBtn: {
        backgroundColor: '#059669',
        shadowColor: '#059669',
    },
    modalActionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
