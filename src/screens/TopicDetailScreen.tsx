import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import CustomAlert from '../utils/CustomAlert';
const Alert = CustomAlert;
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Share, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

import {
    ArrowLeft,
    Share2,
    Heart,
    MessageCircle,
    Flag,
    Send,
    Trash2,
} from 'lucide-react-native';
import {
    useGetTopicByIdQuery,
    useGetMentionsQuery,
    useAddCommentMutation,
    useToggleTopicLikeMutation,
    useToggleCommentLikeMutation,
    useReportTopicMutation,
    useDeleteTopicMutation,
    useSearchCommunityMembersQuery,
} from '../services/communityApi';
import { Skeleton } from '../components/common/Skeleton';

interface TopicDetailScreenProps {
    communityId: string;
    topicId: string;
    onBack: () => void;
}

export function TopicDetailScreen({ communityId, topicId, onBack }: TopicDetailScreenProps) {
    const { height: screenHeight } = useWindowDimensions();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const user = useSelector((state: RootState) => state.user.user);
    const { data: topic, isLoading } = useGetTopicByIdQuery({ communityId, topicId });
    const { data: mentions } = useGetMentionsQuery(undefined, { skip: !isLoggedIn });

    const [addComment] = useAddCommentMutation();
    const [toggleLike] = useToggleTopicLikeMutation();
    const [toggleCommentLike] = useToggleCommentLikeMutation();
    const [deleteTopic] = useDeleteTopicMutation();
    const [reportTopic] = useReportTopicMutation();
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);

    // Mention States
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [debouncedMentionQuery, setDebouncedMentionQuery] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<{ id: string; fullName: string }[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedMentionQuery(mentionQuery);
        }, 600); // Faster debounce as requested by performance
        return () => clearTimeout(timer);
    }, [mentionQuery]);

    const { data: memberResults } = useSearchCommunityMembersQuery(
        { communityId, query: debouncedMentionQuery },
        { skip: !showMentions || !debouncedMentionQuery }
    );

    // Filter out already-selected users from the suggestions using useMemo for reliability
    const filteredResults = useMemo(() => {
        return (memberResults || []).filter(
            (m) => !mentionedUsers.some((u) => u.id === m.id)
        );
    }, [memberResults, mentionedUsers]);


    const isAuthor = user?.id === topic?.author?.id;

    useEffect(() => {
        if (topic) {
            setIsLiked(topic.hasLiked || false);
            setLikes(topic.likeCount || 0);
        }
    }, [topic]);

    const handleGuestAction = (action: string) => {
        Alert.alert(
            'Participation Required',
            `Please login or register to ${action} on this topic.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Login',
                    onPress: () => navigation.navigate('Login')
                }
            ]
        );
    };

    const handlePostComment = async () => {
        if (!isLoggedIn) {
            handleGuestAction('post a comment');
            return;
        }
        if (!commentText.trim()) return;

        try {
            const response = await addComment({
                communityId,
                topicId,
                data: {
                    body: commentText,
                    mentionedUserIds: mentionedUsers.length > 0 ? mentionedUsers.map(u => u.id) : undefined
                }
            }).unwrap();
            if (response?.status) {
                setCommentText('');
                setMentionedUsers([]);
                Alert.alert('Success', response?.message || 'Comment posted');
            }
            else {
                Alert.alert('Error', response?.message || 'Failed to post comment');
            }
        } catch (error: any) {
            const serverError = error?.data?.message || 'Failed to post comment';
            Alert.alert('Error', serverError);
        }
    };

    const handleInputChange = (text: string) => {
        setCommentText(text);
        const match = text.match(/@(\w*)$/);
        if (match) {
            setMentionQuery(match[1]);
            setShowMentions(true);
        } else {
            setShowMentions(false);
            setMentionQuery('');
        }
    };

    const handleSelectMention = (member: { id: string; fullName: string }) => {
        // Strip the @trigger from the text (keep comment body clean)
        const newText = commentText.replace(/@\w*$/, '');
        setCommentText(newText);
        setShowMentions(false);
        setMentionQuery('');
        setMentionedUsers(prev => [...prev, member]);
    };

    const handleRemoveMention = (userId: string) => {
        setMentionedUsers(prev => prev.filter(u => u.id !== userId));
    };


    const handleLike = async () => {
        if (!isLoggedIn) {
            handleGuestAction('like');
            return;
        }
        try {
            const newLiked = !isLiked;
            setIsLiked(newLiked);
            setLikes(prev => newLiked ? prev + 1 : prev - 1);
            const response = await toggleLike({ communityId, topicId }).unwrap();
            if (!response?.status) {
                // Revert state if server failed
                setIsLiked(topic?.hasLiked || false);
                setLikes(topic?.likeCount || 0);
                Alert.alert('Error', response?.message || 'Failed to like topic');
            }
        } catch (error: any) {
            setIsLiked(topic?.hasLiked || false);
            setLikes(topic?.likeCount || 0);
            const serverError = error?.data?.message || 'Failed to like topic';
            Alert.alert('Error', serverError);
        }
    };

    const handleReport = () => {
        Alert.prompt(
            'Report Topic',
            'Please enter the reason for reporting this topic:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Report',
                    onPress: async (reason) => {
                        if (!reason) return;
                        try {
                            const response = await reportTopic({ communityId, topicId, data: { reason } }).unwrap();
                            if (response?.status) {
                                Alert.alert('Success', response.message || 'Topic reported successfully');
                            } else {
                                Alert.alert('Error', response?.message || 'Failed to report topic');
                            }
                        } catch (error: any) {
                            const serverError = error?.data?.message || 'Failed to report topic';
                            Alert.alert('Error', serverError);
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        if (!topic) return;
        try {
            await Share.share({
                message: `Check out this topic on PLRCAP community: ${topic.title}`,
                title: topic.title,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share topic');
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            const response = await toggleCommentLike({ communityId, topicId, commentId }).unwrap();
            if (!response?.status) {
                Alert.alert('Error', response?.message || 'Failed to like comment');
            }
        } catch (error: any) {
            const serverError = error?.data?.message || 'Failed to like comment';
            Alert.alert('Error', serverError);
        }
    };

    const handleDeleteTopic = async () => {
        Alert.alert(
            'Delete Topic',
            'Are you sure you want to delete this topic? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deleteTopic({ communityId, topicId }).unwrap();
                            if (response?.status) {
                                onBack(); // Navigate back on success
                            } else {
                                Alert.alert('Error', response?.message || 'Failed to delete topic');
                            }
                        } catch (error: any) {
                            const serverError = error?.data?.message || 'Failed to delete topic';
                            Alert.alert('Error', serverError);
                        }
                    }
                }
            ]
        );
    };

    const DetailSkeleton = () => (
        <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width="60%" height={20} />
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>
            <ScrollView style={styles.detailContent}>
                <View style={styles.topicMain}>
                    <View style={styles.topicMeta}>
                        <Skeleton width={120} height={12} style={{ marginBottom: 8 }} />
                        <Skeleton width="90%" height={24} style={{ marginBottom: 12 }} />
                        <View style={styles.authorRow}>
                            <Skeleton width={36} height={36} borderRadius={18} />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                                <Skeleton width="40%" height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width="30%" height={12} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.topicBodyContainer}>
                        <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
                        <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
                        <Skeleton width="80%" height={16} style={{ marginBottom: 10 }} />
                        <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
                        <Skeleton width="60%" height={16} />
                    </View>
                </View>
                <View style={styles.commentsSection}>
                    <Skeleton width={100} height={20} style={{ marginBottom: 16 }} />
                    {[1, 2].map(i => (
                        <View key={i} style={styles.commentCard}>
                            <View style={styles.commentAuthorRow}>
                                <Skeleton width={24} height={24} borderRadius={12} />
                                <Skeleton width={100} height={14} style={{ marginLeft: 8 }} />
                            </View>
                            <Skeleton width="100%" height={12} style={{ marginTop: 8, marginBottom: 4 }} />
                            <Skeleton width="70%" height={12} />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
    const renderRichText = (text: string) => {
        if (!text) return null;
        // Simple regex to match @Name patterns. 
        // We match @ followed by word characters and spaces, but avoid trailing spaces/punctuation
        const parts = text.split(/(@[A-Za-z0-9_]+(?:\s[A-Za-z0-9_]+)*)/g);

        return (
            <Text>
                {parts.map((part, index) => {
                    if (part.startsWith('@')) {
                        return <Text key={index} style={styles.mentionHighlight}>{part}</Text>;
                    }
                    return part;
                })}
            </Text>
        );
    };

    if (isLoading) return <DetailSkeleton />;
    if (!topic) return <View style={styles.centered}><Text>Topic not found</Text></View>;

    return (
        <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle} numberOfLines={1}>{topic.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {isAuthor && (
                        <TouchableOpacity onPress={handleDeleteTopic}>
                            <Trash2 size={22} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleShare}>
                        <Share2 size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={[styles.detailContent, { maxHeight: screenHeight - 130 }]}
                showsVerticalScrollIndicator
            >
                <View style={styles.topicMain}>
                    <View style={styles.topicMeta}>
                        <Text style={styles.topicCategory}>Communications for Advocacy</Text>
                        <Text style={styles.topicTitleLarge}>{topic.title}</Text>
                        <View style={styles.authorRow}>
                            <View style={styles.avatarSmall}>
                                {topic.author.avatarUrl ? (
                                    <Image
                                        source={{ uri: topic.author.avatarUrl }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarTextSmall}>{topic.author.fullName.charAt(0)}</Text>
                                )}
                            </View>
                            <View style={{ marginLeft: 8 }}>
                                <Text style={styles.authorNameDetail}>{topic.author.fullName}</Text>
                                <Text style={styles.dateDetail}>{new Date(topic.createdAt).toLocaleDateString()} at {new Date(topic.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>

                        <View style={styles.topicStatsDetail}>
                            <TouchableOpacity style={styles.statDetail} onPress={handleLike}>
                                <Heart size={18} color={isLiked ? "#ef4444" : "#9ca3af"} fill={isLiked ? "#ef4444" : "transparent"} />
                                <Text style={[styles.statDetailText, isLiked && { color: '#ef4444' }]}>{likes} likes</Text>
                            </TouchableOpacity>
                            <View style={styles.statDetail as any}>
                                <MessageCircle size={18} color="#9ca3af" />
                                <Text style={styles.statDetailText}>{topic.comments.length} replies</Text>
                            </View>
                            <TouchableOpacity style={styles.statDetail} onPress={handleReport}>
                                <Flag size={18} color="#9ca3af" />
                                <Text style={styles.statDetailText}>Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.topicBodyContainer}>
                        <Text style={styles.topicBodyText}>{renderRichText(topic.body)}</Text>
                    </View>

                </View>

                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Participation</Text>
                    {topic.comments.map((comment) => {
                        const isMentioned = user && (
                            comment.mentionedUserId === user.id ||
                            comment.mentionedUserIds?.includes(user.id) ||
                            comment.body.toLowerCase().includes(`@${user?.fullName?.toLowerCase()}`) ||
                            mentions?.some(m => m.commentId === comment.id)
                        );

                        return (
                            <View key={comment.id} style={[styles.commentCard, isMentioned && styles.commentMentioned]}>
                                <View style={styles.commentAuthorRow}>

                                    <View style={styles.avatarTiny}>
                                        {comment.author.avatarUrl ? (
                                            <Image
                                                source={{ uri: comment.author.avatarUrl }}
                                                style={styles.avatarImageTiny}
                                            />
                                        ) : (
                                            <Text style={styles.avatarTextTiny}>{comment.author.fullName.charAt(0)}</Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.commentAuthor}>{comment.author.fullName}</Text>
                                            {isMentioned && (
                                                <View style={styles.mentionBadge}>
                                                    <Text style={styles.mentionBadgeText}>Mentioned</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.commentBody}>{renderRichText(comment.body)}</Text>
                                <View style={styles.commentActions}>

                                    <TouchableOpacity
                                        style={styles.commentAction}
                                        onPress={() => handleLikeComment(comment.id)}
                                    >
                                        <Heart
                                            size={14}
                                            color={comment.hasLiked ? "#ef4444" : "#6b7280"}
                                            fill={comment.hasLiked ? "#ef4444" : "transparent"}
                                        />
                                        <Text style={[styles.commentActionText, comment.hasLiked && { color: '#ef4444' }]}>
                                            {comment.likeCount}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                </View>

            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.commentInputWrapper}>
                    {/* Mention suggestions dropdown */}
                    {showMentions && filteredResults.length > 0 && (
                        <View style={styles.mentionsOverlay}>
                            {filteredResults.map((member) => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={styles.mentionItem}
                                    onPress={() => handleSelectMention(member)}
                                >
                                    <View style={styles.mentionAvatar}>
                                        <Text style={styles.mentionAvatarText}>{member.fullName.charAt(0)}</Text>
                                    </View>
                                    <Text style={styles.mentionName}>{member.fullName}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {/* Mention chips strip */}
                    {mentionedUsers.length > 0 && (
                        <View style={styles.mentionChipsRow}>
                            <Text style={styles.mentionChipsLabel}>Mentions:</Text>
                            {mentionedUsers.map((user) => (
                                <View key={user.id} style={styles.mentionChip}>
                                    <Text style={styles.mentionChipText}>@{user.fullName}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveMention(user.id)}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        <Text style={styles.mentionChipRemove}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment... (type @ to mention)"
                            value={commentText}
                            onChangeText={handleInputChange}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handlePostComment}>
                            <Send size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContainer: {
        flex: 1,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailHeaderTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 16,
        color: '#111827',
    },
    detailContent: {
        flex: 1,
    },
    topicMain: {
        padding: 16,
    },
    topicMeta: {
        backgroundColor: '#111827',
        padding: 20,
        borderRadius: 12,
    },
    topicCategory: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 8,
    },
    topicTitleLarge: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    authorNameDetail: {
        color: '#0e7490',
        fontSize: 14,
        fontWeight: '600',
    },
    dateDetail: {
        color: '#9ca3af',
        fontSize: 14,
    },
    topicStatsDetail: {
        flexDirection: 'row',
        gap: 16,
    },
    statDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statDetailText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    topicBodyContainer: {
        paddingVertical: 20,
    },
    topicBodyText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
    },
    commentsSection: {
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#111827',
    },
    commentCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    commentAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    avatarTiny: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTextTiny: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    avatarImageTiny: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    commentAuthor: {
        color: '#0e7490',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentDate: {
        color: '#9ca3af',
        fontSize: 12,
    },
    commentBody: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    commentActions: {
        flexDirection: 'row',
        gap: 16,
    },
    commentAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentActionText: {
        fontSize: 12,
        color: '#6b7280',
    },
    commentInputWrapper: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    mentionChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8,
        alignItems: 'center',
    },
    mentionChipsLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 4,
    },
    mentionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
    },
    mentionChipText: {
        fontSize: 12,
        color: '#0e7490',
        fontWeight: 'bold',
    },
    mentionChipRemove: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    commentInputContainer: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
    },
    mentionsOverlay: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        maxHeight: 200,
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
        gap: 12,
    },
    mentionAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mentionAvatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    mentionName: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: 14,
        color: '#111827',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mentionHighlight: {
        color: '#4f46e5', // Brand indigo for highlight
        fontWeight: '700',
    },
    commentMentioned: {
        borderColor: '#4f46e5',
        borderLeftWidth: 4,
        backgroundColor: '#f5f7ff',
    },
    mentionBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    mentionBadgeText: {
        fontSize: 10,
        color: '#4f46e5',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});



