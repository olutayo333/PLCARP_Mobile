import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, Image } from 'react-native';
import { Heart, MessageCircle, Share2, Bell, Clock } from 'lucide-react-native';
import { decodeHtmlEntities } from '../utils/textUtils';
import {
  useToggleTopicLikeMutation,
  CommunityTopicDetail
} from '../services/communityApi';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { showToast } from '../store/slices/uiSlice';

const formatTimeAgo = (date: Date) => {
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

interface TopicCardProps {
  topic: CommunityTopicDetail;
  isLoggedIn?: boolean;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function TopicCard({ topic, isLoggedIn, onPress, isFirst, isLast }: TopicCardProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [toggleLike] = useToggleTopicLikeMutation();

  const renderRichText = (text: string) => {
    if (!text) return null;
    const decoded = decodeHtmlEntities(text);
    return <Text style={styles.title}>{decoded}</Text>;
  };

  const [isLiked, setIsLiked] = useState(topic.hasLiked || false);
  const [likes, setLikes] = useState(topic.likeCount || 0);

  const handleLike = async () => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }

    try {
      const newLiked = !isLiked;
      setIsLiked(newLiked);
      setLikes(prev => newLiked ? prev + 1 : prev - 1);

      const response = await toggleLike({
        communityId: topic.communityId,
        topicId: topic.id
      }).unwrap();

      if (!response?.status) {
        setIsLiked(topic.hasLiked || false);
        setLikes(topic.likeCount || 0);
        dispatch(showToast({ message: response?.message || 'Failed to like topic', type: 'error' }));
      }
    } catch (error: any) {
      setIsLiked(topic.hasLiked || false);
      setLikes(topic.likeCount || 0);
      dispatch(showToast({ message: error?.data?.message || 'Failed to like topic', type: 'error' }));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this topic on PLRCAP community: ${topic.title}`,
        title: topic.title,
      });
    } catch (error) {
      dispatch(showToast({ message: 'Failed to share topic', type: 'error' }));
    }
  };

  const timeAgo = topic.createdAt
    ? formatTimeAgo(new Date(topic.createdAt))
    : '';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFirst && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        isLast && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
        { overflow: 'hidden' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.authorSection}>
          <View style={styles.avatar}>
            {topic.author.avatarUrl ? (
              <Image source={{ uri: topic.author.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{topic.author.fullName.charAt(0)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.authorName}>{topic.author.fullName}</Text>
            <View style={styles.metaRow}>
              <Clock size={12} color="#9ca3af" />
              <Text style={styles.timeText}>{timeAgo}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {decodeHtmlEntities(topic.body || '')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Heart
              size={18}
              color={isLiked ? "#ef4444" : "#64748b"}
              fill={isLiked ? "#ef4444" : "transparent"}
            />
            <Text style={[styles.actionText, isLiked && styles.activeActionText]}>
              {likes}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionBtn}>
            <MessageCircle size={18} color="#64748b" />
            <Text style={styles.actionText}>{topic.comments?.length || 0}</Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 0,
    marginVertical: 0,
    marginTop: 0.1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
   
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0e7490',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeActionText: {
    color: '#ef4444',
  },
});

