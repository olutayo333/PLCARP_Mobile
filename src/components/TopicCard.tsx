import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  Image,
} from 'react-native';
import { Heart, MessageCircle, Share2, Bell, Eye } from 'lucide-react-native';
import {
  useToggleTopicLikeMutation,
  CommunityTopicDetail
} from '../services/communityApi';

interface TopicCardProps {
  topic: CommunityTopicDetail;
  readOnly?: boolean;
  onTopicPress?: (id: string) => void;
}

export function TopicCard({ topic, readOnly, onTopicPress }: TopicCardProps) {
  const [toggleLike] = useToggleTopicLikeMutation();
  const [isLiked, setIsLiked] = useState(topic.hasLiked || false);
  const [likes, setLikes] = useState(topic.likeCount || 0);

  const handleLike = async () => {
    if (readOnly) {
      Alert.alert('Authentication Required', 'Please log in to like topics');
      return;
    }
    try {
      const newLiked = !isLiked;
      setIsLiked(newLiked);
      setLikes(prev => newLiked ? prev + 1 : prev - 1);

      await toggleLike({
        communityId: topic.communityId,
        topicId: topic.id
      }).unwrap();
    } catch (error) {
      setIsLiked(topic.hasLiked || false);
      setLikes(topic.likeCount || 0);
      Alert.alert('Error', 'Failed to like topic');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this topic on PLRCAP community: ${topic.title}`,
        title: topic.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share topic');
    }
  };

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => onTopicPress?.(topic.id)}
      disabled={readOnly}
      activeOpacity={readOnly ? 1 : 0.7}
    >
      <View style={styles.topicCardTop}>
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
        <View style={styles.topicCardInfo}>
          <Text style={styles.topicCardTitle} numberOfLines={3}>{topic.title}</Text>
          <Text style={styles.topicCardMeta} numberOfLines={1}>
            by <Text style={!readOnly && styles.authorNameLink}>{topic.author.fullName}</Text> • {new Date(topic.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.topicCardActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.iconAction} onPress={handleLike}>
            <Heart size={16} color={isLiked ? "#ef4444" : "#9ca3af"} fill={isLiked ? "#ef4444" : "transparent"} />
            <Text style={[styles.actionText, isLiked && { color: '#ef4444' }]}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
            <Share2 size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}>
            <Bell size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <View style={styles.rightActions}>
          <View style={styles.statItemRow}>
            <MessageCircle size={14} color="#9ca3af" />
            <Text style={styles.statTextSmall}>{topic.comments?.length || 0}</Text>
          </View>
          <View style={styles.statItemRow}>
            <Eye size={14} color="#9ca3af" />
            <Text style={styles.statTextSmall}>124</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  topicCardTop: {
    flexDirection: 'row',
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
  topicCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  topicCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  topicCardMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  authorNameLink: {
    color: '#0e7490',
    fontWeight: '500',
  },
  topicCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
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
});
