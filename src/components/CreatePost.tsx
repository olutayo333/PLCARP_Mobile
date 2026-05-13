import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Platform, Modal, KeyboardAvoidingView, Image, PanResponder, Animated, Dimensions } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronDown, Search } from 'lucide-react-native';
import { useGetCommunitiesQuery, useCreateCommunityTopicMutation, useSearchCommunityMembersQuery, CommunitySearchResult } from '../services/communityApi';

interface CreatePostProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreatePost({ onCancel, onSuccess }: CreatePostProps) {
  const route = useRoute<RouteProp<RootStackParamList, 'CreatePost'>>();
  const initialCommunityId = route.params?.communityId;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunitySearchResult | null>(null);
  const insets = useSafeAreaInsets();
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Mention States
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [debouncedMentionQuery, setDebouncedMentionQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMentionQuery(mentionQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [debouncedCommunityQuery, setDebouncedCommunityQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCommunityQuery(communitySearchQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [communitySearchQuery]);

  const { data: communitiesData, isLoading: loadingCommunities } = useGetCommunitiesQuery({
    search: debouncedCommunityQuery
  });

  // Effect to handle pre-selection of community
  useEffect(() => {
    if (initialCommunityId && communitiesData?.communities) {
      const comm = communitiesData.communities.find(c => c.id === initialCommunityId);
      if (comm) {
        setSelectedCommunity(comm);
      }
    }
  }, [initialCommunityId, communitiesData]);

  const [createTopic] = useCreateCommunityTopicMutation();

  const { data: memberResults } = useSearchCommunityMembersQuery(
    { communityId: selectedCommunity?.id || '', query: debouncedMentionQuery },
    { skip: !showMentions || !debouncedMentionQuery || !selectedCommunity }
  );

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  // ── Drag-to-close (must live before any early return) ────────────────────────
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const CLOSE_THRESHOLD = 150; // px dragged down to trigger close
  const VELOCITY_THRESHOLD = 0.5; // downward velocity to trigger close

  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      // Capture touch immediately on the handle
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      // Also capture during move so we beat ScrollView / navigation gestures
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 2,
      onMoveShouldSetPanResponderCapture: (_, gs) => gs.dy > 2,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose =
          gestureState.dy > CLOSE_THRESHOLD ||
          gestureState.vy > VELOCITY_THRESHOLD;

        if (shouldClose) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onCancel());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // If gesture is stolen, snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    })
  ).current;
  // ─────────────────────────────────────────────────────────────────────────────

  const handleInputChange = (text: string) => {
    setBody(text);
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
    const newText = body.replace(/@\w*$/, `@${member.fullName} `);
    setBody(newText);
    setShowMentions(false);
    setMentionQuery('');
  };

  const handlePost = async () => {
    if (!selectedCommunity) {
      showConfirm({ title: 'Error', message: 'Please select a community', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }
    if (!title.trim() || !body.trim()) {
      showConfirm({ title: 'Error', message: 'Please fill in title and body', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }
    if (!termsAccepted) {
      showConfirm({ title: 'Accept Terms', message: 'You must agree to the Community Guidelines before posting.', confirmText: 'OK', hideCancel: true, onConfirm: () => { } });
      return;
    }
    setUploading(true);
    try {
      const response = await createTopic({
        communityId: selectedCommunity.id,
        data: {
          title: title.trim(),
          body: body.trim()
        }
      }).unwrap();
      if (response?.status) {
        showConfirm({
          title: 'Success',
          message: response.message || 'Topic created successfully!',
          confirmText: 'Done',
          hideCancel: true,
          onConfirm: () => onSuccess()
        });
      } else {
        showConfirm({ title: 'Error', message: response.message || 'Failed to create topic', confirmText: 'Retry', hideCancel: true, onConfirm: () => { } });
      }
    } catch (error: any) {
      showConfirm({ title: 'Error', message: error.data?.message || 'Failed to create topic', confirmText: 'Retry', hideCancel: true, onConfirm: () => { } });
    } finally {
      setUploading(false);
    }
  };

  if (showCommunityPicker) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
          <TouchableOpacity onPress={() => setShowCommunityPicker(false)}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Community</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor="#9ca3af"
            value={communitySearchQuery}
            onChangeText={setCommunitySearchQuery}
          />
        </View>
        <FlatList
          data={communitiesData?.communities || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.communityOption}
              onPress={() => {
                setSelectedCommunity(item);
                setShowCommunityPicker(false);
              }}
            >
              <Image source={{ uri: item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100` }} style={styles.communityThumb} />
              <Text style={styles.communityOptionText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loadingCommunities ? <ActivityIndicator style={{ marginTop: 20 }} /> : <Text style={styles.emptyText}>No communities found</Text>
          }
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }, { transform: [{ translateY }] }]}>
        {/* Drag handle — drag down to dismiss, tap does nothing */}
        <View
          style={styles.dragHandleWrapper}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
        </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start a New Discussion</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.label}>Community</Text>
            <TouchableOpacity
              style={[styles.communitySelector, !!initialCommunityId && styles.communitySelectorDisabled]}
              onPress={() => !initialCommunityId && setShowCommunityPicker(true)}
              disabled={!!initialCommunityId}
            >
              <Text style={[styles.communitySelectorText, !selectedCommunity && { color: '#9ca3af' }]}>
                {selectedCommunity ? selectedCommunity.name : 'Select a community'}
              </Text>
              {!initialCommunityId && <ChevronDown size={20} color="#6b7280" />}
            </TouchableOpacity>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Topic title..."
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            <Text style={styles.label}>Discussion Content</Text>
            <View style={styles.bodyInputContainer}>
              <TextInput
                style={styles.bodyInput}
                placeholder="Provide details about your discussion topic... (type @ to mention someone)"
                placeholderTextColor="#9ca3af"
                multiline
                value={body}
                onChangeText={handleInputChange}
              />

              {/* Mentions Overlay */}
              {showMentions && memberResults && memberResults.length > 0 && (
                <View style={styles.mentionsOverlay}>
                  {memberResults.map((member) => (
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
            </View>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Community Guidelines</Text> and zero-tolerance policy against objectionable content.
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postButton, uploading && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Post Topic</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Cross-Platform CONFIRM Modal ── */}
        <Modal
          visible={!!confirmModal}
          transparent
          animationType="fade"
          onRequestClose={dismissConfirm}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>{confirmModal?.title}</Text>
              <Text style={styles.confirmMessage}>{confirmModal?.message}</Text>
              <View style={styles.confirmActions}>
                {!confirmModal?.hideCancel && (
                  <TouchableOpacity style={styles.confirmCancelBtn} onPress={dismissConfirm}>
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.confirmOkBtn, confirmModal?.danger && styles.confirmDangerBtn]}
                  onPress={() => {
                    dismissConfirm();
                    confirmModal?.onConfirm();
                  }}
                >
                  <Text style={styles.confirmOkText}>{confirmModal?.confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
  },
  dragHandleWrapper: {
    alignSelf: 'stretch',        // full width for easier touch targeting
    alignItems: 'center',
    paddingVertical: 16,         // bigger hit area
    paddingHorizontal: 24,
    ...Platform.select({
      web: { cursor: 'grab' } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1e293b',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  communitySelectorText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  communitySelectorDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  titleInput: {
    fontSize: 16,
    color: '#1e293b',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  bodyInputContainer: {
    position: 'relative',
    zIndex: 1,
  },
  bodyInput: {
    fontSize: 16,
    color: '#1e293b',
    minHeight: 180,
    textAlignVertical: 'top',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  mentionsOverlay: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: 200,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    color: '#334155',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0e7490',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#0e7490',
    fontSize: 16,
    fontWeight: '700',
  },
  postButton: {
    flex: 2,
    backgroundColor: '#0e7490',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#a5f3fc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  communityThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  communityOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6b7280',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
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
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmOkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0e7490',
    alignItems: 'center',
  },
  confirmDangerBtn: {
    backgroundColor: '#ef4444',
  },
  confirmOkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0e7490',
    marginRight: 12,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0e7490',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  termsLink: {
    color: '#0e7490',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
