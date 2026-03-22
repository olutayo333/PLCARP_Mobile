/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useState, useEffect} from 'react';
import {Provider, useSelector} from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  Share,
} from 'react-native';

const {width} = Dimensions.get('window');
import {
  Heart,
  MessageCircle,
  LogIn,
  Search,
  Users,
  Plus,
  ArrowLeft,
  Share2,
  Send,
  Bell,
  Eye,
  X,
  ChevronDown,
  Settings,
  Shield,
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Camera,
  User,
  ShieldCheck,
  AlertCircle,
  Check,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Clock,
  ThumbsUp,
  Hash,
  Filter,
  Users2,
  Briefcase,
  Loader2,
  BookOpen,
  UserMinus,
  Building2,
  AtSign,
  Trash2,
  Flag,
  AlertTriangle,
  Pencil,
} from 'lucide-react-native';

const categoryFilters = [
  { name: 'Policy Advocacy', icon: ShieldCheck, color: '#2563eb', bg: '#eff6ff' },
  { name: 'Crisis Response', icon: AlertCircle, color: '#dc2626', bg: '#fef2f2' },
  { name: 'Project Management', icon: Check, color: '#059669', bg: '#ecfdf5' },
  { name: 'Community Outreach', icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
  { name: 'Capacity Building', icon: TrendingUp, color: '#d97706', bg: '#fffbeb' },
  { name: 'Grant Writing', icon: MessageSquare, color: '#4f46e5', bg: '#eef2ff' },
];
import {store} from './store';
import {NativeShell} from './components/NativeShell';
import {CreatePost} from './components/CreatePost';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLoginMutation} from './services/authApi';
import {
  useGetGlobalTopicsQuery,
  useToggleTopicLikeMutation,
  useGetCommunitiesQuery,
  useGetCommunityTopicsQuery,
  useGetCommunityAnalyticsQuery,
  useGetTopicByIdQuery,
  useAddCommentMutation,
  useGetMySubscriptionsQuery,
  useGetMentionsQuery,
  useReportTopicMutation,
  CommunitySearchResult,
  CommunityTopicDetail
} from './services/communityApi';
import {
  useGetUserProfileQuery,
  useGetExpertsQuery,
  useGetExpertByIdQuery,
  useGetOrgProfileQuery,
  useGetExpertProfileQuery,
  useUpdateUserProfileMutation,
  useUpdateExpertProfileMutation,
  useUpdateOrgProfileMutation,
  uploadAvatarApi,
} from './services/profileApi';

import {SplashScreen} from './screens/SplashScreen';
import {OnboardingScreen} from './screens/OnboardingScreen';
import {LoginScreen} from './screens/LoginScreen';
import {RegisterScreen} from './screens/RegisterScreen';
import {NGORegistrationScreen} from './screens/NGORegistrationScreen';
import {ExpertRegistrationScreen} from './screens/ExpertRegistrationScreen';
import {GuestRegistrationScreen} from './screens/GuestRegistrationScreen';
import {RegistrationCompleteScreen} from './screens/RegistrationCompleteScreen';

function TopicCard({topic, readOnly, onTopicPress}: {topic: CommunityTopicDetail; readOnly?: boolean; onTopicPress?: (id: string) => void}) {
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
    <TouchableOpacity style={styles.postCard} onPress={() => onTopicPress?.(topic.id)}>
      <View style={styles.topicCardTop}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarTextSmall}>{topic.author.fullName.charAt(0)}</Text>
        </View>
        <View style={styles.topicCardInfo}>
          <Text style={styles.topicCardTitle}>{topic.title}</Text>
          <Text style={styles.topicCardMeta}>
            by <Text style={styles.authorNameLink}>{topic.author.fullName}</Text> • {new Date(topic.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.topicCardActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.iconAction} onPress={handleLike}>
            <Heart size={16} color={isLiked ? "#ef4444" : "#9ca3af"} fill={isLiked ? "#ef4444" : "transparent"} />
            <Text style={[styles.actionText, isLiked && {color: '#ef4444'}]}>{likes}</Text>
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

function ActivityCard({activity}: {activity: any}) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle} numberOfLines={1}>Re: {activity.topicTitle}</Text>
        <Text style={styles.activityMeta}>by <Text style={styles.authorNameLink}>{activity.authorName}</Text> • {activity.date}</Text>
      </View>
      <Text style={styles.activityBody}>{activity.body}</Text>
      <View style={styles.activityActions}>
        <TouchableOpacity style={styles.activityAction}>
          <MessageCircle size={14} color="#6b7280" />
          <Text style={styles.activityActionText}>Quote</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.activityAction}>
          <Heart size={14} color="#6b7280" />
          <Text style={styles.activityActionText}>{activity.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.activityAction}>
          <Text style={styles.activityActionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CommunityCard({community}: {community: any}) {
  return (
    <View style={styles.communityListItem}>
      <View style={styles.communityListInfo}>
        <Text style={styles.communityCategoryLabel}>{community.category || 'Advocacy'}</Text>
        <Text style={styles.communityListName}>{community.name}</Text>
        <View style={styles.communityListActions}>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Bell size={14} color="#0ea5e9" />
            <Text style={styles.subscribeBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.communityListStats}>
        <View style={styles.subStat}>
          <MessageCircle size={14} color="#6b7280" />
          <Text style={styles.subStatText}>{community.topicCount || 8}</Text>
        </View>
        <View style={styles.subStat}>
          <Users size={14} color="#6b7280" />
          <Text style={styles.subStatText}>{community.memberCount || 124}</Text>
        </View>
      </View>
    </View>
  );
}

function FeedScreen({isLoggedIn, onTabChange}: {isLoggedIn: boolean; onTabChange: (tab: string) => void}) {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('topics');
  const [activeFilter, setActiveFilter] = useState('recents');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Fetch communities for authenticated users
  const {data: communitiesData, isLoading: isLoadingCommunities} = useGetCommunitiesQuery({}, {skip: !isLoggedIn});
  
  // Fetch global topics for unauthenticated users
  const {data: globalTopics, isLoading: isLoadingGlobal, refetch: refetchGlobal} = useGetGlobalTopicsQuery({}, {skip: isLoggedIn});
  
  // Fetch community topics for authenticated users
  const {data: communityTopics, isLoading: isLoadingCommunityTopics, refetch: refetchCommunity} = useGetCommunityTopicsQuery(
    {
      communityId: selectedCommunityId || '',
      filters: {
        search: categorySearch || undefined,
        filter: activeFilter === 'recents' ? 'Recents' : 'Trending'
      }
    }, 
    {skip: !isLoggedIn || !selectedCommunityId || activeSubTab !== 'topics'}
  );

  // Fetch community analytics
  const {data: analytics} = useGetCommunityAnalyticsQuery(selectedCommunityId || '', {skip: !isLoggedIn || !selectedCommunityId});

  // Fetch subscriptions
  const {data: subscriptions} = useGetMySubscriptionsQuery(undefined, {skip: !isLoggedIn || activeSubTab !== 'subscribed'});

  // Fetch mentions
  const {data: mentions, isLoading: isLoadingMentions} = useGetMentionsQuery(undefined, {skip: !isLoggedIn || activeSubTab !== 'mentions'});

  useEffect(() => {
    if (isLoggedIn && communitiesData?.communities?.length && !selectedCommunityId) {
      setSelectedCommunityId(communitiesData.communities[0].id);
    }
  }, [isLoggedIn, communitiesData, selectedCommunityId]);

  const isLoading = isLoggedIn ? (isLoadingCommunities || isLoadingCommunityTopics) : isLoadingGlobal;
  const topics = isLoggedIn ? communityTopics?.topics : globalTopics?.topics;
  const refetch = isLoggedIn ? refetchCommunity : refetchGlobal;

  if (selectedTopicId && selectedCommunityId) {
    return (
      <TopicDetailScreen 
        communityId={selectedCommunityId} 
        topicId={selectedTopicId} 
        onBack={() => setSelectedTopicId(null)} 
      />
    );
  }

  if (isLoading && !topics && activeSubTab === 'topics') {
    return <ActivityIndicator style={{marginTop: 50}} color="#4f46e5" />;
  }

  const renderHeader = () => {
    return (
      <View style={styles.feedHeaderContainer}>
        {isLoggedIn && (
          <View style={styles.analyticsBar}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsLabel}>TOTAL TOPICS</Text>
              <Text style={styles.analyticsValue}>{analytics?.totalTopics || 0}</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsLabel}>MEMBERS</Text>
              <Text style={styles.analyticsValue}>{analytics?.totalMembers || 0}</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsLabel}>ONLINE</Text>
              <Text style={styles.analyticsValue}>{analytics?.onlineMembers || 0}</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsLabel}>JOINED</Text>
              <Text style={styles.analyticsValue}>12</Text>
            </View>
          </View>
        )}

        <View style={styles.subTabs}>
          {['Topics', 'Activities', 'Communities', 'Mentions', 'Subscribed'].map((tab) => {
            const tabKey = tab.toLowerCase();
            if (!isLoggedIn && (tabKey === 'mentions' || tabKey === 'subscribed')) return null;
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
        </View>

        {activeSubTab === 'topics' && (
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

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryScroller}
              contentContainerStyle={styles.categoryScrollerContent}
            >
              {categoryFilters.map((cat) => (
                <TouchableOpacity 
                  key={cat.name}
                  style={[
                    styles.categoryPill, 
                    categorySearch === cat.name && {backgroundColor: cat.bg, borderColor: cat.color}
                  ]}
                  onPress={() => setCategorySearch(prev => prev === cat.name ? '' : cat.name)}
                >
                  <cat.icon size={14} color={categorySearch === cat.name ? cat.color : '#6b7280'} />
                  <Text style={[
                    styles.categoryPillText,
                    categorySearch === cat.name && {color: cat.color, fontWeight: 'bold'}
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderMentions = () => {
    if (isLoadingMentions) return <ActivityIndicator style={{marginTop: 20}} color="#4f46e5" />;
    if (!mentions?.length) {
      return (
        <View style={styles.emptyContainer}>
          <AtSign size={40} color="#9ca3af" style={{marginBottom: 10}} />
          <Text style={styles.emptyText}>No mentions yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.mentionsList}>
        {mentions.map(mention => (
          <TouchableOpacity 
            key={mention.id} 
            style={styles.mentionItem}
            onPress={() => {
              setSelectedTopicId(mention.topicId);
              setActiveSubTab('topics');
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
        ))}
      </View>
    );
  };

  const renderSubscribed = () => {
    return (
      <View style={styles.subscribedContainer}>
        {subscriptions?.map(community => (
          <TouchableOpacity 
            key={community.id} 
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
        ))}
      </View>
    );
  };

  const renderActivities = () => {
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

    return (
      <View style={styles.activitiesContainer}>
        {mockActivities.map(activity => (
          <View key={activity.id}>
            <ActivityCard activity={activity} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#f9fafb'}}>
      {isLoggedIn && communitiesData?.communities && (
        <View style={styles.communitySelectorContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.communitySelector}
            contentContainerStyle={styles.communitySelectorContent}
          >
            {communitiesData.communities.map((community) => (
              <TouchableOpacity 
                key={community.id} 
                style={[
                  styles.communityTab, 
                  selectedCommunityId === community.id && styles.communityTabActive
                ]}
                onPress={() => setSelectedCommunityId(community.id)}
              >
                <Text style={[
                  styles.communityTabText, 
                  selectedCommunityId === community.id && styles.communityTabTextActive
                ]}>
                  {community.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={activeSubTab === 'topics' ? (topics || []) : []}
        renderItem={({item}) => (
          <TopicCard 
            topic={item} 
            readOnly={!isLoggedIn} 
            onTopicPress={(id) => setSelectedTopicId(id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feed}
        onRefresh={refetch}
        refreshing={isLoading && activeSubTab === 'topics'}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => {
          if (activeSubTab === 'mentions') return renderMentions();
          if (activeSubTab === 'subscribed') return renderSubscribed();
          if (activeSubTab === 'activities') return renderActivities();
          if (activeSubTab === 'communities') return <CommunitiesScreen />;
          return null;
        }}
        ListEmptyComponent={() => {
          if (activeSubTab === 'topics' && !isLoading) {
            return (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No topics found</Text>
              </View>
            );
          }
          return null;
        }}
      />

      {isLoggedIn && activeSubTab === 'topics' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => onTabChange('post')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function TopicDetailScreen({communityId, topicId, onBack}: {communityId: string; topicId: string; onBack: () => void}) {
  const {data: topic, isLoading} = useGetTopicByIdQuery({communityId, topicId});
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
        data: {body: commentText}
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
      await toggleLike({communityId, topicId}).unwrap();
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
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Report',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await reportTopic({communityId, topicId, data: {reason}}).unwrap();
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

  if (isLoading) return <ActivityIndicator style={{marginTop: 50}} color="#4f46e5" />;
  if (!topic) return <Text>Topic not found</Text>;

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

      <ScrollView style={styles.detailContent}>
        <View style={styles.topicMain}>
          <View style={styles.topicMeta}>
            <Text style={styles.topicCategory}>Communications for Advocacy</Text>
            <Text style={styles.topicTitleLarge}>{topic.title}</Text>
            <View style={styles.authorRow}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>{topic.author.fullName.charAt(0)}</Text>
              </View>
              <View style={{marginLeft: 8}}>
                <Text style={styles.authorNameDetail}>{topic.author.fullName}</Text>
                <Text style={styles.dateDetail}>{new Date(topic.createdAt).toLocaleDateString()} at {new Date(topic.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
              </View>
            </View>
            
            <View style={styles.topicStatsDetail}>
              <TouchableOpacity style={styles.statDetail} onPress={handleLike}>
                <Heart size={18} color={isLiked ? "#ef4444" : "#9ca3af"} fill={isLiked ? "#ef4444" : "transparent"} />
                <Text style={[styles.statDetailText, isLiked && {color: '#ef4444'}]}>{likes} likes</Text>
              </TouchableOpacity>
              <View style={styles.statDetail}>
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
                  <Text style={styles.avatarTextTiny}>{comment.author.fullName.charAt(0)}</Text>
                </View>
                <View style={{marginLeft: 8}}>
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
function CommunitiesScreen() {
  const {data, isLoading, refetch} = useGetCommunitiesQuery({});
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Advocacy (2)', 'Effective programming', 'Humanitarian Policy'];

  if (isLoading) {
    return <ActivityIndicator style={{marginTop: 50}} color="#4f46e5" />;
  }

  return (
    <View style={{flex: 1}}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Communities</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categorySelector}
        contentContainerStyle={styles.categorySelectorContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={data?.communities || []}
        renderItem={({item}) => <CommunityCard community={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.communityList}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </View>
  );
}

function ExpertCard({expert, onPress}: {expert: any; onPress: (id: string) => void}) {
  return (
    <TouchableOpacity style={styles.expertCard} onPress={() => onPress(expert.id)}>
      <View style={styles.expertCardHeader}>
        <View style={styles.expertAvatar}>
          <Text style={styles.expertAvatarText}>
            {expert.fullName?.charAt(0) || 'E'}
          </Text>
        </View>
        <View style={styles.expertInfo}>
          <Text style={styles.expertName}>{expert.fullName}</Text>
          <Text style={styles.expertTitle}>{expert.expertProfile?.title || 'Expert'}</Text>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>
      <View style={styles.expertMeta}>
        <View style={styles.expertBadge}>
          <ShieldCheck size={12} color="#4f46e5" />
          <Text style={styles.expertBadgeText}>Verified</Text>
        </View>
        <Text style={styles.expertExperience}>{expert.expertProfile?.yearsOfExperience || 0} years exp.</Text>
      </View>
      <Text style={styles.expertAbout} numberOfLines={2}>
        {expert.expertProfile?.about || 'No description available.'}
      </Text>
      <View style={styles.expertTags}>
        {expert.expertProfile?.areasOfExpertise?.slice(0, 3).map((tag: string) => (
          <View key={tag} style={styles.expertTag}>
            <Text style={styles.expertTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState('forum');
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);

  const {data: expertsData, isLoading: isLoadingExperts} = useGetExpertsQuery(
    {search: searchQuery},
    {skip: !isSearching || activeSearchTab !== 'experts'}
  );

  const recentSearches = ['Policy Advocacy', 'Leadership', 'Human Resources', 'Environmental'];
  const trendingTopics = [
    'Communication and Advocacy strategies for rural NGOs',
    'Communication and Advocacy strategies for rural NGOs',
    'Communication and Advocacy strategies for rural NGOs'
  ];

  if (selectedExpertId) {
    return <ExpertDetailScreen expertId={selectedExpertId} onBack={() => setSelectedExpertId(null)} />;
  }

  const renderInitialView = () => (
    <ScrollView style={styles.searchInitial}>
      <View style={styles.searchSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
          <TouchableOpacity><Text style={styles.clearAll}>Clear all</Text></TouchableOpacity>
        </View>
        {recentSearches.map(item => (
          <View key={item} style={styles.recentItem}>
            <Text style={styles.recentText}>{item}</Text>
            <X size={16} color="#9ca3af" />
          </View>
        ))}
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>TRENDING IN FORUM</Text>
        {trendingTopics.map((item, idx) => (
          <View key={idx} style={styles.trendingItem}>
            <View style={styles.trendingIcon}><Text style={styles.trendingIconText}>AJ</Text></View>
            <View style={styles.trendingContent}>
              <Text style={styles.trendingTitle} numberOfLines={1}>{item}</Text>
              <View style={styles.trendingMeta}>
                <Share2 size={12} color="#9ca3af" />
                <View style={styles.statItemRow}>
                  <MessageCircle size={12} color="#9ca3af" />
                  <Text style={styles.statTextSmall}>8</Text>
                </View>
                <View style={styles.statItemRow}>
                  <Eye size={12} color="#9ca3af" />
                  <Text style={styles.statTextSmall}>124</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>POPULAR COMMUNITIES</Text>
        <View style={styles.popularCommunitiesList}>
          <CommunityCard community={{id: '1', name: 'Policy Advocacy', category: 'Advocacy', memberCount: 124, topicCount: 8} as any} />
          <CommunityCard community={{id: '2', name: 'Communications for Advocacy', category: 'Advocacy', memberCount: 124, topicCount: 8} as any} />
          <TouchableOpacity style={styles.loadMoreBtn}>
            <Text style={styles.loadMoreBtnText}>Load more results</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderResultsView = () => (
    <View style={styles.searchResults}>
      <View style={styles.searchSubTabs}>
        <TouchableOpacity 
          style={[styles.searchSubTab, activeSearchTab === 'forum' && styles.searchSubTabActive]}
          onPress={() => setActiveSearchTab('forum')}
        >
          <Text style={[styles.searchSubTabText, activeSearchTab === 'forum' && styles.searchSubTabTextActive]}>Forum</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.searchSubTab, activeSearchTab === 'experts' && styles.searchSubTabActive]}
          onPress={() => setActiveSearchTab('experts')}
        >
          <Text style={[styles.searchSubTabText, activeSearchTab === 'experts' && styles.searchSubTabTextActive]}>Experts</Text>
        </TouchableOpacity>
      </View>

      {activeSearchTab === 'forum' ? (
        <View style={styles.resultsList}>
          <View style={styles.resultsHeader}>
            <TouchableOpacity style={styles.filterToggle}>
              <Plus size={16} color="#374151" />
              <Text style={styles.filterToggleText}>Filters</Text>
            </TouchableOpacity>
            <View style={styles.sortInfo}>
              <Text style={styles.sortLabel}>Sort: <Text style={styles.sortValue}>Relevance</Text></Text>
              <ChevronDown size={16} color="#374151" />
            </View>
          </View>
          <Text style={styles.resultsCount}>SEARCH RESULTS</Text>
          <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
        </View>
      ) : (
        <View style={styles.resultsList}>
          <Text style={styles.resultsCount}>EXPERT DIRECTORY</Text>
          {isLoadingExperts ? (
            <ActivityIndicator style={{marginTop: 20}} color="#4f46e5" />
          ) : (
            <FlatList
              data={expertsData?.experts || []}
              renderItem={({item}) => (
                <ExpertCard expert={item} onPress={(id) => setSelectedExpertId(id)} />
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>No experts found for "{searchQuery}"</Text>
              )}
            />
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.searchContainer}>
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
            <TouchableOpacity onPress={() => {setSearchQuery(''); setIsSearching(false);}}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isSearching ? renderResultsView() : renderInitialView()}
    </View>
  );
}

function ExpertDetailScreen({expertId, onBack}: {expertId: string; onBack: () => void}) {
  const {data: expert, isLoading} = useGetExpertByIdQuery(expertId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.centered}>
        <Text>Expert not found</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.expertDetailContainer}>
      <View style={styles.expertDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backIconBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>Expert Profile</Text>
        <TouchableOpacity>
          <Share2 size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.expertDetailContent}>
        <View style={styles.detailProfileCard}>
          <View style={styles.detailAvatar}>
            <Text style={styles.detailAvatarText}>
              {expert.fullName?.charAt(0) || 'E'}
            </Text>
          </View>
          <Text style={styles.detailName}>{expert.fullName}</Text>
          <Text style={styles.detailExpertTitle}>{expert.expertProfile?.title || 'Expert'}</Text>
          
          <View style={styles.detailStats}>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatValue}>{expert.expertProfile?.yearsOfExperience || 0}</Text>
              <Text style={styles.detailStatLabel}>Years Exp.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatValue}>Verified</Text>
              <Text style={styles.detailStatLabel}>Status</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.connectBtn}>
            <Text style={styles.connectBtnText}>Connect with Expert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>About</Text>
          <Text style={styles.detailAboutText}>
            {expert.expertProfile?.about || 'No description available.'}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Areas of Expertise</Text>
          <View style={styles.detailTags}>
            {expert.expertProfile?.areasOfExpertise?.map((tag: string) => (
              <View key={tag} style={styles.detailTag}>
                <Text style={styles.detailTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {expert.expertProfile?.education && expert.expertProfile.education.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Education</Text>
            {expert.expertProfile.education.map((edu: any, idx: number) => (
              <View key={idx} style={styles.eduItem}>
                <BookOpen size={16} color="#4f46e5" />
                <View style={styles.eduContent}>
                  <Text style={styles.eduTitle}>{edu.certification}</Text>
                  <Text style={styles.eduSub}>{edu.institution} • {edu.year}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = [
    { name: 'All', count: 2 },
    { name: 'Replies' },
    { name: 'Likes', count: 2 },
    { name: 'System' }
  ];

  const notifications = [
    { id: '1', type: 'Likes', user: 'Miriam Okafor', action: 'liked your reply', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: true },
    { id: '2', type: 'Likes', user: 'Miriam Okafor', action: 'liked your reply', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: true },
    { id: '3', type: 'Replies', user: 'Miriam Okafor', action: 'replied to your topic', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: false },
    { id: '4', type: 'Replies', user: 'Miriam Okafor', action: 'replied to your topic', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: false },
    { id: '5', type: 'Replies', user: 'Miriam Okafor', action: 'replied to your topic', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: false },
    { id: '6', type: 'Replies', user: 'Miriam Okafor', action: 'replied to your topic', content: '"Community radio has been particularly effective in our work in Borno State..."', time: '2 hours ago', unread: false },
    { id: '7', type: 'System', action: 'You earned 10 forum points!', content: 'Keep engaging to unlock more rewards', time: 'Yesterday • 8:45 AM', unread: false },
  ];

  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  return (
    <View style={styles.alertsContainer}>
      <View style={styles.alertsHeader}>
        <Text style={styles.alertsTitle}>Alerts</Text>
        <TouchableOpacity>
          <Text style={styles.markAllRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertsTabs}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab.name} 
            style={[styles.alertTab, activeTab === tab.name && styles.alertTabActive]}
            onPress={() => setActiveTab(tab.name)}
          >
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.alertTabText, activeTab === tab.name && styles.alertTabTextActive]}>
                {tab.name}
              </Text>
              {tab.count && (
                <View style={[styles.tabBadge, activeTab === tab.name && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.name && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={[styles.notificationItem, item.unread && styles.notificationUnread]}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeaderRow}>
                {item.unread && <View style={styles.unreadDot} />}
                <Text style={styles.notificationActionText}>
                  {item.user && <Text style={styles.notificationUser}>{item.user} </Text>}
                  {item.action}
                </Text>
              </View>
              <Text style={styles.notificationSnippet} numberOfLines={2}>{item.content}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.notificationList}
      />
    </View>
  );
}

function EditProfileScreen({onBack}: {onBack: () => void}) {
  const {data: profile} = useGetUserProfileQuery();
  const [updateProfile, {isLoading: isUpdating}] = useUpdateUserProfileMutation();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');

  const handleSave = async () => {
    try {
      await updateProfile({fullName, phoneNumber}).unwrap();
      onBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.editProfileContainer}>
      <View style={styles.editProfileHeader}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.editProfileTitle}>Edit Profile</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.editProfileContent}>
        <View style={styles.avatarEditContainer}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>
              {fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Text style={styles.editAvatarText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Full name</Text>
          <TextInput 
            style={styles.profileInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder="User Name"
          />
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Phone number</Text>
          <TextInput 
            style={styles.profileInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+234..."
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveChangesBtn, isUpdating && {opacity: 0.7}]} 
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveChangesText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function OrgProfileScreen({onBack}: {onBack: () => void}) {
  const {data: org} = useGetOrgProfileQuery();
  const [updateOrg, {isLoading: isUpdating}] = useUpdateOrgProfileMutation();
  const [name, setName] = useState(org?.name || '');
  const [description, setDescription] = useState(org?.description || '');
  const [website, setWebsite] = useState(org?.website || '');

  const handleSave = async () => {
    try {
      await updateOrg({name, description, website}).unwrap();
      onBack();
    } catch (error) {
      console.error('Failed to update org profile:', error);
      Alert.alert('Error', 'Failed to update organization profile.');
    }
  };

  return (
    <View style={styles.editProfileContainer}>
      <View style={styles.editProfileHeader}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.editProfileTitle}>Organization Profile</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.editProfileContent}>
        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Organization Name</Text>
          <TextInput 
            style={styles.profileInput}
            value={name}
            onChangeText={setName}
            placeholder="NGO Name"
          />
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Description</Text>
          <TextInput 
            style={[styles.profileInput, {height: 100, textAlignVertical: 'top'}]}
            value={description}
            onChangeText={setDescription}
            placeholder="About the NGO..."
            multiline
          />
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Website</Text>
          <TextInput 
            style={styles.profileInput}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://..."
            keyboardType="url"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveChangesBtn, isUpdating && {opacity: 0.7}]} 
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveChangesText}>Save Organization Info</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ExpertProfileScreen({onBack}: {onBack: () => void}) {
  const {data: expert} = useGetExpertProfileQuery();
  const [updateExpert, {isLoading: isUpdating}] = useUpdateExpertProfileMutation();
  const [title, setTitle] = useState(expert?.title || '');
  const [about, setAbout] = useState(expert?.about || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(String(expert?.yearsOfExperience || ''));

  const handleSave = async () => {
    try {
      await updateExpert({
        title, 
        about, 
        yearsOfExperience: parseInt(yearsOfExperience) || 0
      }).unwrap();
      onBack();
    } catch (error) {
      console.error('Failed to update expert profile:', error);
      Alert.alert('Error', 'Failed to update expert profile.');
    }
  };

  return (
    <View style={styles.editProfileContainer}>
      <View style={styles.editProfileHeader}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.editProfileTitle}>Expert Profile</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.editProfileContent}>
        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Professional Title</Text>
          <TextInput 
            style={styles.profileInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Senior Policy Consultant"
          />
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>Years of Experience</Text>
          <TextInput 
            style={styles.profileInput}
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            placeholder="e.g. 10"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.profileInputGroup}>
          <Text style={styles.profileInputLabel}>About / Bio</Text>
          <TextInput 
            style={[styles.profileInput, {height: 120, textAlignVertical: 'top'}]}
            value={about}
            onChangeText={setAbout}
            placeholder="Tell us about your expertise..."
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveChangesBtn, isUpdating && {opacity: 0.7}]} 
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveChangesText}>Save Expert Info</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfileScreen({onLogout}: {onLogout: () => void}) {
  const {data: profile, isLoading} = useGetUserProfileQuery();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentSubScreen, setCurrentSubScreen] = useState('main');

  if (currentSubScreen === 'edit') {
    return <EditProfileScreen onBack={() => setCurrentSubScreen('main')} />;
  }

  if (currentSubScreen === 'org') {
    return <OrgProfileScreen onBack={() => setCurrentSubScreen('main')} />;
  }

  if (currentSubScreen === 'expert') {
    return <ExpertProfileScreen onBack={() => setCurrentSubScreen('main')} />;
  }

  const MenuItem = ({icon: Icon, label, subLabel, onPress, color = "#111827", isLogout = false}: any) => (
    <TouchableOpacity style={styles.profileMenuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, isLogout && styles.logoutIconContainer]}>
          <Icon size={20} color={isLogout ? "#ef4444" : "#6b7280"} />
        </View>
        <View>
          <Text style={[styles.menuItemLabel, isLogout && styles.logoutLabel]}>{label}</Text>
          {subLabel && <Text style={styles.menuItemSubLabel}>{subLabel}</Text>}
        </View>
      </View>
      {!isLogout && <ChevronRight size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  if (isLoading) return <ActivityIndicator style={{marginTop: 50}} color="#4f46e5" />;

  const userRole = profile?.role || 'Guest';
  const roleColor = userRole === 'Expert' ? '#4f46e5' : userRole === 'NGO' ? '#059669' : '#6b7280';

  return (
    <View style={styles.profileContainer}>
      <ScrollView contentContainerStyle={styles.profileScrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarRow}>
            <View style={[styles.mediumAvatar, {backgroundColor: roleColor + '20'}]}>
              <Text style={[styles.mediumAvatarText, {color: roleColor}]}>{profile?.fullName?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileName}>{profile?.fullName || 'User Name'}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                <View style={[styles.roleBadge, {backgroundColor: roleColor}]}>
                  <Text style={styles.roleBadgeText}>{userRole}</Text>
                </View>
                <Text style={styles.profileEmail}>{profile?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionHeader}>METRICS</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Topics started</Text>
              <Text style={styles.metricValue}>{profile?.metrics?.topicsCount || 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Replies posted</Text>
              <Text style={styles.metricValue}>{profile?.metrics?.repliesPosted || 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Replies received</Text>
              <Text style={styles.metricValue}>{profile?.metrics?.repliesReceived || 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Likes received</Text>
              <Text style={styles.metricValue}>{profile?.metrics?.likesReceived || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionHeader}>ACCOUNT</Text>
          <MenuItem 
            icon={User} 
            label="Edit profile" 
            subLabel="Change name and phone" 
            onPress={() => setCurrentSubScreen('edit')}
          />
          {userRole === 'NGO' && (
            <MenuItem 
              icon={Building2} 
              label="Organization Profile" 
              subLabel={profile?.organization?.name || "Manage NGO details"} 
              onPress={() => setCurrentSubScreen('org')}
            />
          )}
          {userRole === 'Expert' && (
            <MenuItem 
              icon={Briefcase} 
              label="Expert Profile" 
              subLabel={profile?.expertProfile?.title || "Manage expertise"} 
              onPress={() => setCurrentSubScreen('expert')}
            />
          )}
          <MenuItem 
            icon={Shield} 
            label="Password & Security" 
            subLabel="Change password" 
          />
          <MenuItem 
            icon={CreditCard} 
            label="My Subscriptions" 
            subLabel="Manage your plans" 
          />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionHeader}>PREFERENCE</Text>
          <MenuItem 
            icon={Bell} 
            label="Notifications" 
            subLabel="Push notifications, emails, etc" 
          />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionHeader}>OTHER</Text>
          <MenuItem icon={HelpCircle} label="Help & Support" />
          <MenuItem icon={FileText} label="Community guidelines" />
          <MenuItem icon={FileText} label="Terms of service" />
          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            isLogout 
            onPress={() => setShowLogoutModal(true)}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.logoutModalTitle}>Are you sure you want to log out?</Text>
            <TouchableOpacity style={styles.confirmLogoutBtn} onPress={onLogout}>
              <Text style={styles.confirmLogoutText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLogoutBtn} onPress={() => setShowLogoutModal(false)}>
              <Text style={styles.cancelLogoutText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'post') {
      setIsCreatingPost(true);
    } else {
      setActiveTab(tab);
      setIsCreatingPost(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentScreen('login');
    setActiveTab('home');
  };

  if (isLoggedIn === null) return <ActivityIndicator style={{flex: 1}} />;

  if (isLoggedIn) {
    if (isCreatingPost) {
      return (
        <CreatePost 
          onCancel={() => setIsCreatingPost(false)} 
          onSuccess={() => {
            setIsCreatingPost(false);
            setActiveTab('home');
          }} 
        />
      );
    }

    const renderContent = () => {
      switch (activeTab) {
        case 'home':
          return <FeedScreen isLoggedIn={!!isLoggedIn} onTabChange={handleTabChange} />;
        case 'communities':
          return <CommunitiesScreen />;
        case 'search':
          return <SearchScreen />;
        case 'notification':
          return <NotificationScreen />;
        case 'profile':
          return <ProfileScreen onLogout={handleLogout} />;
        default:
          return <FeedScreen isLoggedIn={!!isLoggedIn} onTabChange={handleTabChange} />;
      }
    };

    return (
      <NativeShell activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </NativeShell>
    );
  }

  // Auth Flow
  switch (currentScreen) {
    case 'splash':
      return <SplashScreen onFinish={() => setCurrentScreen('onboarding')} />;
    case 'onboarding':
      return <OnboardingScreen onGetStarted={() => setCurrentScreen('login')} />;
    case 'login':
      return (
        <LoginScreen 
          onLoginSuccess={() => setIsLoggedIn(true)}
          onRegisterPress={() => setCurrentScreen('register')}
          onVisitorPress={() => setIsLoggedIn(true)} // Mock visitor login
        />
      );
    case 'register':
      return (
        <RegisterScreen 
          onBackToLogin={() => setCurrentScreen('login')}
          onSelectType={(type) => {
            if (type === 'ngo') setCurrentScreen('ngo_register');
            else if (type === 'expert') setCurrentScreen('expert_register');
            else if (type === 'guest') setCurrentScreen('guest_register');
          }}
        />
      );
    case 'ngo_register':
      return (
        <NGORegistrationScreen 
          onBack={() => setCurrentScreen('register')}
          onComplete={() => setCurrentScreen('register_complete')}
        />
      );
    case 'expert_register':
      return (
        <ExpertRegistrationScreen 
          onBack={() => setCurrentScreen('register')}
          onComplete={() => setCurrentScreen('register_complete')}
        />
      );
    case 'guest_register':
      return (
        <GuestRegistrationScreen 
          onBack={() => setCurrentScreen('register')}
          onComplete={() => setCurrentScreen('register_complete')}
        />
      );
    case 'register_complete':
      return <RegistrationCompleteScreen onGoHome={() => setCurrentScreen('login')} />;
    default:
      return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} onRegisterPress={() => setCurrentScreen('register')} onVisitorPress={() => setIsLoggedIn(true)} />;
  }
}

import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

export default function App() {
  const RootView = GestureHandlerRootView as any;
  return (
    <RootView style={{flex: 1}}>
      <SafeAreaProvider>
        <Provider store={store}>
          <View style={styles.root}>
            <AppContent />
          </View>
        </Provider>
      </SafeAreaProvider>
    </RootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feed: {
    padding: 16,
    paddingBottom: 100,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicCardInfo: {
    flex: 1,
    gap: 4,
  },
  topicCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  topicCardMeta: {
    fontSize: 11,
    color: '#6b7280',
  },
  authorNameLink: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  topicCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
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
    padding: 2,
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
  activityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  activityHeader: {
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 11,
    color: '#6b7280',
  },
  activityBody: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 16,
  },
  activityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityActionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  postContent: {
    gap: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  postBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  loginButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  communitySelector: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  communitySelectorContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  communityTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  communityTabActive: {
    backgroundColor: '#4f46e5',
  },
  communityTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  communityTabTextActive: {
    color: '#fff',
  },
  communityHeader: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 16,
  },
  communityHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  communityHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  communityBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  communityBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0e7490',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  subTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  subTabTextActive: {
    color: '#4f46e5',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#e0f2fe',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#0369a1',
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  communityListItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  communityListInfo: {
    flex: 1,
    gap: 4,
  },
  communityCategoryLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  communityListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  communityListActions: {
    marginTop: 8,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  subscribeBtnText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  communityListStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  screenHeader: {
    padding: 16,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  categorySelector: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categorySelectorContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  categoryTabActive: {
    backgroundColor: '#e0f2fe',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#0369a1',
  },
  communityList: {
    paddingBottom: 100,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    padding: 16,
    gap: 16,
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
    backgroundColor: '#0ea5e9',
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
  searchResults: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
  resultsList: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  alertsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  alertsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllRead: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  alertsTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  alertTab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  alertTabActive: {
    borderBottomColor: '#0ea5e9',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  alertTabTextActive: {
    color: '#111827',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#ef4444',
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  notificationList: {
    flexGrow: 1,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  notificationUnread: {
    backgroundColor: '#f0f9ff',
  },
  notificationContent: {
    gap: 4,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  notificationActionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  notificationUser: {
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationSnippet: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
  authorNameDetail: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    color: '#9ca3af',
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
    gap: 4,
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#4f46e5',
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
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribedContainer: {
    padding: 16,
  },
  subscribedTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subscribedTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  subscribedTabActive: {
    backgroundColor: '#e0f2fe',
  },
  subscribedTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  subscribedTabTextActive: {
    color: '#0369a1',
  },
  subscriptionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  subscriptionInfo: {
    marginBottom: 12,
  },
  subscriptionCategory: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  subscribedBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
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
    padding: 40,
    alignItems: 'center',
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
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  communityImage: {
    width: '100%',
    height: 150,
  },
  communityInfo: {
    padding: 16,
    gap: 8,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  communityDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  communityMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  profileScrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mediumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediumAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  profileNameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  profileSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  profileSectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconContainer: {
    backgroundColor: '#fef2f2',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  logoutLabel: {
    color: '#ef4444',
  },
  menuItemSubLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmLogoutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmLogoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelLogoutBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  cancelLogoutText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  editProfileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  editProfileContent: {
    padding: 20,
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  editAvatarBtn: {
    marginTop: 12,
  },
  editAvatarText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  profileInputGroup: {
    marginBottom: 20,
  },
  profileInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  profileInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  saveChangesBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveChangesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedHeaderContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  analyticsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  analyticsLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    padding: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  filterPillText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#4f46e5',
  },
  categoryScroller: {
    marginTop: 4,
  },
  categoryScrollerContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  mentionsList: {
    padding: 16,
  },
  mentionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 12,
  },
  mentionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionContent: {
    flex: 1,
    gap: 4,
  },
  mentionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  mentionSnippet: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  mentionDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  communitySelectorContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarTiny: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextTiny: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  expertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e520',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expertAvatarText: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  expertTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  expertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e510',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
  },
  expertBadgeText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    marginLeft: 4,
  },
  expertExperience: {
    fontSize: 12,
    color: '#6b7280',
  },
  expertAbout: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  expertTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  expertTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  expertTagText: {
    fontSize: 12,
    color: '#374151',
  },
  searchSubTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  searchSubTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  searchSubTabActive: {
    borderBottomColor: '#4f46e5',
  },
  searchSubTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  searchSubTabTextActive: {
    color: '#4f46e5',
  },
  expertDetailContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  expertDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIconBtn: {
    padding: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  expertDetailContent: {
    flex: 1,
  },
  detailProfileCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e520',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailAvatarText: {
    color: '#4f46e5',
    fontSize: 32,
    fontWeight: 'bold',
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detailExpertTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  detailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailStatItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  connectBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  detailAboutText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  detailTagText: {
    fontSize: 14,
    color: '#374151',
  },
  eduItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eduContent: {
    marginLeft: 12,
    flex: 1,
  },
  eduTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  eduSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  backBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
});
