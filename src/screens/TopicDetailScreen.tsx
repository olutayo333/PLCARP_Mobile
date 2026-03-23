import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Share,
    Image,
    useWindowDimensions,
} from 'react-native';
import {
    ArrowLeft,
    Share2,
    Heart,
    MessageCircle,
    Flag,
    Send,
} from 'lucide-react-native';
import {
    useGetTopicByIdQuery,
    useAddCommentMutation,
    useToggleTopicLikeMutation,
    useReportTopicMutation,
} from '../services/communityApi';
import { Skeleton } from '../components/common/Skeleton';

interface TopicDetailScreenProps {
    communityId: string;
    topicId: string;
    onBack: () => void;
}

export function TopicDetailScreen({ communityId, topicId, onBack }: TopicDetailScreenProps) {
    const { height: screenHeight } = useWindowDimensions();
    const { data: topic, isLoading } = useGetTopicByIdQuery({ communityId, topicId });
    const [addComment] = useAddCommentMutation();
    const [toggleLike] = useToggleTopicLikeMutation();
    const [reportTopic] = useReportTopicMutation();
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);

    useEffect(() => {
        if (topic) {
            setIsLiked(topic.hasLiked || false);
            setLikes(topic.likeCount || 0);
        }
    }, [topic]);

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        try {
            await addComment({
                communityId,
                topicId,
                data: { body: commentText }
            }).unwrap();
            setCommentText('');
            Alert.alert('Success', 'Comment posted');
        } catch (error) {
            Alert.alert('Error', 'Failed to post comment');
        }
    };

    const handleLike = async () => {
        try {
            const newLiked = !isLiked;
            setIsLiked(newLiked);
            setLikes(prev => newLiked ? prev + 1 : prev - 1);
            await toggleLike({ communityId, topicId }).unwrap();
        } catch (error) {
            setIsLiked(topic?.hasLiked || false);
            setLikes(topic?.likeCount || 0);
            Alert.alert('Error', 'Failed to like topic');
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
                            await reportTopic({ communityId, topicId, data: { reason } }).unwrap();
                            Alert.alert('Success', 'Topic reported successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to report topic');
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

    if (isLoading) return <DetailSkeleton />;
    if (!topic) return <View style={styles.centered}><Text>Topic not found</Text></View>;

    return (
        <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle} numberOfLines={1}>{topic.title}</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Share2 size={24} color="#374151" />
                </TouchableOpacity>
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
                        <Text style={styles.topicBodyText}>{topic.body}</Text>
                    </View>
                </View>

                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Participation</Text>
                    {topic.comments.map((comment) => (
                        <View key={comment.id} style={styles.commentCard}>
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
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={styles.commentAuthor}>{comment.author.fullName}</Text>
                                    <Text style={styles.commentDate}>{new Date(topic.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <Text style={styles.commentBody}>{comment.body}</Text>
                            <View style={styles.commentActions}>
                                <TouchableOpacity style={styles.commentAction}>
                                    <Heart size={14} color="#6b7280" />
                                    <Text style={styles.commentActionText}>{comment.likeCount}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.commentAction}>
                                    <Text style={styles.commentActionText}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.commentInputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Write a comment..."
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handlePostComment}>
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
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
    commentInputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
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
});
