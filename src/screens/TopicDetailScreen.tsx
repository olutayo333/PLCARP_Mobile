import React, { useState, useEffect, useMemo } from 'react';
import { RootState } from '../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomAlert from '../utils/CustomAlert';
const Alert = CustomAlert;
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Share, Image, useWindowDimensions, Modal, StatusBar } from 'react-native';
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
    X,
    Quote,
    Reply,
    AlertCircle,
    ChevronUp,
    ChevronDown,
    Edit2,
} from 'lucide-react-native';
import {
    useGetTopicByIdQuery,
    useGetMentionsQuery,
    useAddCommentMutation,
    useToggleTopicLikeMutation,
    useToggleCommentLikeMutation,
    useReportTopicMutation,
    useReportCommentMutation,
    useDeleteTopicMutation,
    useDeleteCommentMutation,
    useUpdateCommentMutation,
    useSearchCommunityMembersQuery,
} from '../services/communityApi';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { Skeleton } from '../components/common/Skeleton';
import { ReportModal } from '../components/ReportModal';

interface TopicDetailScreenProps {
    communityId: string;
    topicId: string;
    quoteCommentId?: string;
    replyCommentId?: string;
    onBack: () => void;
}

export function TopicDetailScreen({ communityId, topicId, quoteCommentId, replyCommentId, onBack }: TopicDetailScreenProps) {
    const dispatch = useDispatch();
    const { height: screenHeight } = useWindowDimensions();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const insets = useSafeAreaInsets();
    const user = useSelector((state: RootState) => state.user.user);
    const { data: topic, isLoading } = useGetTopicByIdQuery({ communityId, topicId });
    const { data: mentions } = useGetMentionsQuery(undefined, { skip: !isLoggedIn });

    const [addComment, { isLoading: isPosting }] = useAddCommentMutation();
    const [toggleLike] = useToggleTopicLikeMutation();
    const [toggleCommentLike] = useToggleCommentLikeMutation();
    const [deleteTopic] = useDeleteTopicMutation();
    const [reportTopic] = useReportTopicMutation();
    const [reportComment] = useReportCommentMutation();
    const [deleteComment] = useDeleteCommentMutation();
    const [updateComment] = useUpdateCommentMutation();
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);

    // Mention States
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [debouncedMentionQuery, setDebouncedMentionQuery] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<{ id: string; fullName: string }[]>([]);

    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

    // Edit Comment States
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingComment, setEditingComment] = useState<any | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [isUpdatingComment, setIsUpdatingComment] = useState(false);
    const [processedIntentId, setProcessedIntentId] = useState<string | null>(null);

    // Threading & Quotes
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [unfoldedThreads, setUnfoldedThreads] = useState<Set<string>>(new Set());
    const [quotedComment, setQuotedComment] = useState<any | null>(null);
    const [replyToComment, setReplyToComment] = useState<any | null>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);

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

            // Handle navigation intent (Quote/Reply from Activities feed)
            const intentId = quoteCommentId || replyCommentId;
            if (intentId && processedIntentId !== intentId) {
                const findCommentRecursive = (comments: any[], target: string): any | null => {
                    for (const c of comments) {
                        if (c.id === target) return c;
                        if (c.replies && c.replies.length > 0) {
                            const found = findCommentRecursive(c.replies, target);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const comment = findCommentRecursive(topic.comments || [], intentId);
                if (comment) {
                    if (quoteCommentId) {
                        setQuotedComment(comment);
                        setReplyToComment(null);
                    } else {
                        setReplyToComment(comment);
                        setQuotedComment(null);
                    }
                    setIsCommentModalVisible(true);
                    setProcessedIntentId(intentId);
                }
            }
        }
    }, [topic, quoteCommentId, replyCommentId, processedIntentId]);

    // Reset intent when IDs change or on unmount
    useEffect(() => {
        return () => setProcessedIntentId(null);
    }, [quoteCommentId, replyCommentId]);

    const toggleReplies = (commentId: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

    const toggleThread = (commentId: string) => {
        setUnfoldedThreads(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

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
            return false;
        }
        if (!commentText.trim()) return false;

        try {
            const response = await addComment({
                communityId,
                topicId,
                data: {
                    body: commentText,
                    mentionedUserIds: mentionedUsers.length > 0 ? mentionedUsers.map(u => u.id) : undefined,
                    parentId: replyToComment?.id,
                    quoteId: quotedComment?.id
                }
            }).unwrap();

            if (response?.status) {
                setCommentText('');
                setMentionedUsers([]);
                setReplyToComment(null);
                setQuotedComment(null);
                Alert.alert('Success', response?.message || 'Comment posted');
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to post comment');
                return false;
            }
        } catch (error: any) {
            const serverError = error?.data?.message || 'Failed to post comment';
            Alert.alert('Error', serverError);
            return false;
        }
    };

    const handleInputChange = (text: string) => {
        setCommentText(text);
        const lastAt = text.lastIndexOf('@');
        if (lastAt !== -1) {
            const query = text.substring(lastAt + 1);
            if (!query.includes(' ')) {
                setMentionQuery(query);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
        setMentionQuery('');
    };

    const handleSelectMention = (member: { id: string; fullName: string }) => {
        // Find the last @ and remove it and the typed query
        const lastAt = commentText.lastIndexOf('@');
        // We append the selected member's full name, followed by a space, so they can keep typing.
        const newText = lastAt !== -1
            ? commentText.substring(0, lastAt) + `@${member.fullName} `
            : commentText + `@${member.fullName} `;

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

    const handleReport = (commentId?: string) => {
        if (!isLoggedIn) {
            handleGuestAction('report');
            return;
        }
        // Instead of triggering immediately, we just show the modal and set target
        setReportingCommentId(commentId || null);
        setIsReportModalVisible(true);
    };

    const submitReport = async (reason: string) => {
        setIsReporting(true);
        try {
            let response;
            if (reportingCommentId) {
                response = await reportComment({
                    communityId,
                    topicId,
                    commentId: reportingCommentId,
                    data: { reason }
                }).unwrap();
            } else {
                response = await reportTopic({ communityId, topicId, data: { reason } }).unwrap();
            }

            setIsReportModalVisible(false);
            setReportingCommentId(null);

            if (response?.status) {
                dispatch(showToast({ message: response?.message || 'Reported successfully', type: 'success' }));
            } else {
                Alert.alert('Error', response?.message || 'Failed to submit report');
            }
        } catch (error: any) {
            const serverError = error?.data?.message || 'Failed to submit report';
            Alert.alert('Error', serverError);
        } finally {
            setIsReporting(false);
        }
    };

    const handleDeleteComment = (commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response: any = await deleteComment({ communityId, topicId, commentId }).unwrap();
                            if (response?.status) {
                                dispatch(showToast({ message: 'Comment deleted', type: 'success' }));
                            } else {
                                Alert.alert('Error', response?.message || 'Failed to delete comment');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error?.data?.message || 'Failed to delete comment');
                        }
                    }
                }
            ]
        );
    };

    const handleEditComment = (comment: any) => {
        setEditingComment(comment);
        setEditCommentText(decodeHtmlEntities(comment.body));
        setIsEditModalVisible(true);
    };

    const submitEditComment = async () => {
        if (!editCommentText.trim()) return;
        setIsUpdatingComment(true);
        try {
            const response: any = await updateComment({
                communityId,
                topicId,
                commentId: editingComment.id,
                data: { body: editCommentText.trim() }
            }).unwrap();

            if (response?.status) {
                setIsEditModalVisible(false);
                setEditingComment(null);
                setEditCommentText('');
                dispatch(showToast({ message: 'Comment updated', type: 'success' }));
            } else {
                Alert.alert('Error', response?.message || 'Failed to update comment');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to update comment');
        } finally {
            setIsUpdatingComment(false);
        }
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
                            const response: any = await deleteTopic({ communityId, topicId }).unwrap();
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
        <View style={[styles.detailContainer, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) }]}>
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
    const decodeHtmlEntities = (text: string) => {
        if (!text) return '';
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');
    };

    const renderComment = (comment: any, depth = 0, parent: any = null) => {
        const isMentioned = user && (
            comment.mentionedUserId === user.id ||
            comment.mentionedUserIds?.includes(user.id) ||
            comment.body.toLowerCase().includes(`@${user?.fullName?.toLowerCase()}`) ||
            mentions?.some((m: any) => m.commentId === comment.id)
        );

        return (
            <View key={comment.id} style={{ marginLeft: depth > 0 ? 16 : 0, marginTop: depth > 0 ? 8 : 0, marginBottom: depth === 0 ? 24 : 0 }}>
                <View style={[styles.commentCard, isMentioned && styles.commentMentioned, depth > 0 && styles.replyCard]}>
                    <View style={styles.commentAuthorRow}>
                        <View style={styles.avatarTiny}>
                            {comment.author.avatarUrl ? (
                                <Image source={{ uri: comment.author.avatarUrl }} style={styles.avatarImageTiny} />
                            ) : (
                                <Text style={styles.avatarTextTiny}>{comment.author.fullName.charAt(0)}</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={styles.commentAuthor} numberOfLines={1} ellipsizeMode="tail">{comment.author.fullName}</Text>
                                <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                                {isMentioned && (
                                    <View style={styles.mentionBadge}>
                                        <Text style={styles.mentionBadgeText}>MENTIONED</Text>
                                    </View>
                                )}
                                {user?.id === comment.author.id && (
                                    <View style={styles.authorActions}>
                                        <TouchableOpacity onPress={() => handleEditComment(comment)}>
                                            <Text style={styles.authorActionText}>EDIT</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                                            <Text style={[styles.authorActionText, { color: '#ef4444' }]}>DELETE</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {isMentioned && user && (
                        <View style={styles.mentionAtPill}>
                            <Text style={styles.mentionAtPillText}>@{user.fullName}</Text>
                        </View>
                    )}

                    {comment.quote ? (
                        <View style={styles.quotedCommentBox}>
                            <Text style={styles.quotedCommentAuthor}>Quoting @{comment.quote.author.fullName}</Text>
                            <Text style={styles.quotedCommentBody} numberOfLines={2}>
                                {decodeHtmlEntities(comment.quote.body)}
                            </Text>
                        </View>
                    ) : (parent && (
                        <View style={styles.quotedCommentBox}>
                            <Text style={styles.quotedCommentAuthor}>Reply to @{parent.author.fullName}</Text>
                            <Text style={styles.quotedCommentBody} numberOfLines={2}>
                                {decodeHtmlEntities(parent.body)}
                            </Text>
                        </View>
                    ))}

                    <Text style={[styles.commentBody, depth > 0 && styles.replyBody]}>
                        {renderRichText(decodeHtmlEntities(comment.body))}
                    </Text>

                    {isLoggedIn ? (
                        <View style={styles.commentActions}>
                            <TouchableOpacity style={styles.commentAction} onPress={() => handleLikeComment(comment.id)}>
                                <Heart size={14} color={comment.hasLiked ? "#ef4444" : "#6b7280"} fill={comment.hasLiked ? "#ef4444" : "transparent"} />
                                <Text style={[styles.commentActionText, comment.hasLiked && { color: '#ef4444' }]}>
                                    {comment.likeCount}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => {
                                    setReplyToComment(comment);
                                    setQuotedComment(null);
                                    setIsCommentModalVisible(true);
                                }}
                            >
                                <Reply size={14} color="#6b7280" />
                                <Text style={styles.commentActionText}>Reply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => {
                                    setQuotedComment(comment);
                                    setReplyToComment(null);
                                    setIsCommentModalVisible(true);
                                }}
                            >
                                <Quote size={14} color="#6b7280" />
                                <Text style={styles.commentActionText}>Quote</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => handleReport(comment.id)}
                            >
                                <Flag size={14} color="#6b7280" />
                                <Text style={styles.commentActionText}>Report</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.commentLikeCountGuest}>{comment.likeCount > 0 ? `♡ ${comment.likeCount}` : ''}</Text>
                    )}
                </View>

                {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesWrapper}>
                        {!unfoldedThreads.has(comment.id) ? (
                            <TouchableOpacity style={styles.showMoreButton} onPress={() => toggleThread(comment.id)}>
                                <MessageCircle size={14} color="#0e7490" />
                                <Text style={styles.showMoreText}>Show {comment.replies.length} replies</Text>
                                <ChevronDown size={14} color="#0e7490" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={[styles.showMoreButton, { marginBottom: 12 }]} onPress={() => toggleThread(comment.id)}>
                                    <ChevronUp size={14} color="#6b7280" />
                                    <Text style={[styles.showMoreText, { color: '#6b7280' }]}>Fold replies</Text>
                                </TouchableOpacity>
                                {(expandedComments.has(comment.id) ? comment.replies : comment.replies.slice(0, 5)).map((reply: any) =>
                                    renderComment(reply, depth + 1, comment)
                                )}
                                {comment.replies.length > 5 && !expandedComments.has(comment.id) && (
                                    <TouchableOpacity style={styles.showMoreButton} onPress={() => toggleReplies(comment.id)}>
                                        <MessageCircle size={14} color="#0e7490" />
                                        <Text style={styles.showMoreText}>Show {comment.replies.length - 5} more</Text>
                                        <ChevronDown size={14} color="#0e7490" style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                )}
                                {expandedComments.has(comment.id) && (
                                    <TouchableOpacity style={styles.showMoreButton} onPress={() => toggleReplies(comment.id)}>
                                        <ChevronUp size={14} color="#6b7280" />
                                        <Text style={[styles.showMoreText, { color: '#6b7280' }]}>Show less</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>
        );
    };
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
    const renderReportModal = () => (
        <ReportModal
            visible={isReportModalVisible}
            onClose={() => setIsReportModalVisible(false)}
            onSubmit={submitReport}
            isSubmitting={isReporting}
        />
    );

    const renderEditModal = () => (
        <Modal
            visible={isEditModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsEditModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Comment</Text>
                        <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <TextInput
                            style={styles.reportInput}
                            value={editCommentText}
                            onChangeText={setEditCommentText}
                            multiline
                            placeholder="Edit your comment..."
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setIsEditModalVisible(false)}
                                disabled={isUpdatingComment}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.reportSubmitBtn, { backgroundColor: '#0e7490' }]}
                                onPress={submitEditComment}
                                disabled={isUpdatingComment || !editCommentText.trim()}
                            >
                                {isUpdatingComment ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.reportSubmitBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderCommentModal = () => (
        <Modal
            visible={isCommentModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsCommentModalVisible(false)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputModalOverlay}
            >
                <View style={styles.inputModalContent}>

                    <View style={styles.inputModalHeader}>
                        {(replyToComment || quotedComment) ? (
                            <TouchableOpacity
                                style={styles.clearQuoteBtn}
                                onPress={() => {
                                    setReplyToComment(null);
                                    setQuotedComment(null);
                                }}
                            >
                                <X size={14} color="#ef4444" />
                                <Text style={styles.clearQuoteText}>Clear quote</Text>
                            </TouchableOpacity>
                        ) : <View />}
                    </View>

                    <View style={styles.inputMainBox}>
                        {(replyToComment || quotedComment) && (
                            <View style={styles.inputQuoteBox}>
                                <Text style={styles.inputQuoteAuthor}>
                                    {replyToComment ? replyToComment.author.fullName : quotedComment?.author.fullName}
                                </Text>
                                <Text style={styles.inputQuoteBody} numberOfLines={2}>
                                    {decodeHtmlEntities(replyToComment ? replyToComment.body : quotedComment?.body || '')}
                                </Text>
                            </View>
                        )}
                        <TextInput
                            style={styles.modalTextInput}
                            placeholder="Type here..."
                            value={commentText}
                            onChangeText={handleInputChange}
                            multiline
                            autoFocus
                        />
                        {showMentions && filteredResults.length > 0 && (
                            <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 8, maxHeight: 150 }}>
                                <ScrollView keyboardShouldPersistTaps="handled">
                                    {filteredResults.map(member => (
                                        <TouchableOpacity
                                            key={member.id}
                                            style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                            onPress={() => handleSelectMention(member)}
                                        >
                                            {member.avatarUrl ? (
                                                <Image source={{ uri: member.avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                                            ) : (
                                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#0e7490', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{member.fullName.charAt(0)}</Text>
                                                </View>
                                            )}
                                            <Text style={{ fontSize: 14, color: '#1e293b' }}>{member.fullName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <Text style={styles.inputGuidelines}>
                        Be constructive · PLRCAP Community Guidelines apply
                    </Text>

                    <TouchableOpacity
                        style={styles.inputSubmitBtn}
                        onPress={async () => {
                            const success = await handlePostComment();
                            if (success) setIsCommentModalVisible(false);
                        }}
                        disabled={isPosting}
                    >
                        {isPosting ? <ActivityIndicator color="#fff" /> : <Text style={styles.inputSubmitBtnText}>Post reply</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    if (isLoading) return <DetailSkeleton />;
    if (!topic) return <View style={styles.centered}><Text>Topic not found</Text></View>;

    return (
        <View style={[styles.detailContainer, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0) }]}>
            {renderReportModal()}
            {renderEditModal()}
            {renderCommentModal()}
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

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.detailContent}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator
                >
                    <View style={styles.topicMain}>
                        <View style={styles.topicMeta}>
                            <Text style={styles.topicCategory}>Communications for Advocacy</Text>
                            <Text style={styles.topicTitleLarge}>{topic.title}</Text>

                            <View style={styles.authorRowMinimal}>
                                <Text style={styles.authorNameHeader}>{topic.author.fullName}</Text>
                                <Text style={styles.authorDateSeparator}>·</Text>
                                <Text style={styles.authorDateHeader}>
                                    {new Date(topic.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </View>

                            <View style={styles.headerBottomRow}>
                                <View style={styles.statsGroup}>
                                    <View style={styles.statItemMini}>
                                        <MessageCircle size={14} color="#9ca3af" />
                                        <Text style={styles.statTextMini}>{topic.comments.length} replies</Text>
                                    </View>
                                    <View style={styles.statItemMini}>
                                        <Text style={styles.statTextMini}>👁 124 views</Text>
                                    </View>
                                </View>

                                <View style={styles.subscribedPill}>
                                    <Text style={styles.checkIcon}>✓</Text>
                                    <Text style={styles.subscribedText}>Subscribed</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.topicBodyContainer}>
                            <Text style={styles.topicBodyText}>{renderRichText(topic.body)}</Text>

                            <View style={styles.parentActionsRow}>
                                <TouchableOpacity style={styles.parentActionBtn} onPress={handleLike}>
                                    <Heart size={16} color={isLiked ? "#ef4444" : "#64748b"} fill={isLiked ? "#ef4444" : "transparent"} />
                                    <Text style={[styles.parentActionText, isLiked && { color: '#ef4444' }]}>
                                        {likes > 0 ? `${likes} likes` : 'Like'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.parentActionBtn} onPress={() => handleReport()}>
                                    <Flag size={16} color="#64748b" />
                                    <Text style={styles.parentActionText}>Report</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.commentsSection}>

                        {topic.comments
                            .filter((c: any) => !c.parentId)
                            .map((comment: any) => renderComment(comment))}
                    </View>

                </ScrollView>

                {!isLoggedIn ? (
                    <View style={styles.guestInputBanner}>
                        <Text style={styles.guestInputText}>
                            <Text style={styles.guestInputBold}>Join the conversation!</Text>
                            {'  '}Login or register to like, reply, quote, and report comments.
                        </Text>
                        <TouchableOpacity
                            style={styles.guestLoginBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.guestLoginBtnText}>Login / Register</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.inputTriggerBar}
                        onPress={() => setIsCommentModalVisible(true)}
                    >
                        <Text style={styles.inputTriggerText}>Type here...</Text>
                        <Send size={20} color="#0e7490" />
                    </TouchableOpacity>
                )}
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
        marginTop: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#374151',
        borderRadius: 12,
        backgroundColor: '#fff',
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
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 8,
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
        fontWeight: '500',
    },
    commentInputWrapper: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
    },
    mentionChipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 8,
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
        color: '#0e7490', // Consistent teal brand color
        fontWeight: '600',
    },
    commentMentioned: {
        backgroundColor: '#f5f7ff',
    },
    mentionBadge: {
        backgroundColor: '#2a7da2', // Darker teal from screenshot
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    mentionBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '500',
    },
    mentionAtPill: {
        backgroundColor: '#ebf8ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#bee3f8',
    },
    mentionAtPillText: {
        fontSize: 12,
        color: '#2a7da2',
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalBody: {
        padding: 20,
    },
    modalSubTitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    reportInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 120,
        marginBottom: 20,
        ...Platform.select({
            web: { outlineStyle: 'none' } as any,
        }),
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: '600',
    },
    reportSubmitBtn: {
        flex: 1,
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportSubmitBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    quotedCommentBox: {
        backgroundColor: '#f9fafb',
        borderLeftWidth: 3,
        borderLeftColor: '#0e7490',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    quotedCommentAuthor: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0e7490',
        marginBottom: 2,
    },
    quotedCommentBody: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    quotePreviewContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f3f4f6',
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    quotePreviewContent: {
        flex: 1,
    },
    quotePreviewAuthor: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0e7490',
        marginBottom: 1,
    },
    quotePreviewText: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    quotePreviewClose: {
        marginLeft: 12,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quoteClearText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    repliesWrapper: {
        marginLeft: 24,
        borderLeftWidth: 1,
        borderLeftColor: '#d1d5db',
        paddingLeft: 12,
    },
    showMoreText: {
        fontSize: 12,
        color: '#0e7490',
        fontWeight: '600',
        marginLeft: 6,
    },
    replyCard: {
        padding: 12,
        marginBottom: 8,
    },
    replyBody: {
        fontSize: 13,
        fontWeight: '400',
        marginBottom: 4,
    },
    commentLikeCountGuest: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    authorActions: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 'auto',
    },
    authorActionText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#0e7490',
        letterSpacing: 0.5,
    },
    guestInputBanner: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 12,
    },
    guestInputText: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    guestInputBold: {
        fontWeight: 'bold',
        color: '#374151',
    },
    guestLoginBtn: {
        backgroundColor: '#0e7490',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    guestLoginBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    // New Comment Input Styles
    inputTriggerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputTriggerText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    inputModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    inputModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    inputHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    inputModalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: 24,
        marginBottom: 8,
    },
    clearQuoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearQuoteText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '600',
    },
    inputToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 16,
    },
    toolbarDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#e2e8f0',
    },
    inputMainBox: {
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        padding: 12,
        minHeight: 180,
    },
    inputQuoteBox: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 12,
    },
    inputQuoteAuthor: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0e7490',
        marginBottom: 4,
    },
    inputQuoteBody: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    modalTextInput: {
        fontSize: 15,
        color: '#1e293b',
        textAlignVertical: 'top',
        flex: 1,
        ...Platform.select({
            web: { outlineStyle: 'none' } as any,
        }),
    },
    inputGuidelines: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 16,
        marginBottom: 20,
        textAlign: 'left',
    },
    inputSubmitBtn: {
        backgroundColor: '#0e7490',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputSubmitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Redesigned Header Styles
    authorRowMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    authorNameHeader: {
        color: '#0e7490', // Teal
        fontSize: 14,
        fontWeight: '600',
    },
    authorDateSeparator: {
        color: '#9ca3af',
        marginHorizontal: 6,
        fontSize: 14,
    },
    authorDateHeader: {
        color: '#9ca3af',
        fontSize: 14,
    },
    headerBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    statsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statItemMini: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statTextMini: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
    },
    subscribedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: '#4b5563',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
    },
    checkIcon: {
        color: '#10b981', // Green
        fontSize: 14,
    },
    subscribedText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    parentActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    parentActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    parentActionText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '500',
    },
});
