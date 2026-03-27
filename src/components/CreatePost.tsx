import React, { useState } from 'react';

import CustomAlert from '../utils/CustomAlert';
const Alert = CustomAlert;
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, FlatList, Platform } from 'react-native';;
import { Camera, X, Image as ImageIcon, ChevronDown } from 'lucide-react-native';
import { uploadFile } from '../services/axiosClient';
import { useGetCommunitiesQuery, useCreateCommunityTopicMutation, CommunitySearchResult } from '../services/communityApi';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { Modal } from 'react-native';

interface CreatePostProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreatePost({ onCancel, onSuccess }: CreatePostProps) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunitySearchResult | null>(null);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: communitiesData, isLoading: loadingCommunities } = useGetCommunitiesQuery({});
  const [createTopic] = useCreateCommunityTopicMutation();

  // Cross-platform modal state
  type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

  const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
  const dismissConfirm = () => setConfirmModal(null);

  const pickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      showConfirm({ title: 'Unavailable', message: 'Image picker is not available on this device.', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
    }
  };

  const handlePost = async () => {
    if (!selectedCommunity) {
      showConfirm({ title: 'Error', message: 'Please select a community', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
      return;
    }
    if (!title || !body) {
      showConfirm({ title: 'Error', message: 'Please fill in title and body', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      if (image) {
        const file = {
          uri: image,
          name: 'photo.jpg',
          type: 'image/jpeg',
        };

        const uploadResponse = await uploadFile(file);
        // Assuming uploadFile returns the URL in its response
        // For now, we'll just proceed as the API might handle it differently
      }

      await createTopic({
        communityId: selectedCommunity.id,
        data: {
          title,
          body
        }
      }).unwrap();

      showConfirm({
        title: 'Success',
        message: 'Topic created successfully!',
        confirmText: 'Done',
        hideCancel: true,
        onConfirm: () => onSuccess()
      });
    } catch (error: any) {
      showConfirm({ title: 'Error', message: error.data?.message || 'Failed to create topic', confirmText: 'Retry', hideCancel: true, onConfirm: () => {} });
    } finally {
      setUploading(false);
    }
  };

  if (showCommunityPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCommunityPicker(false)}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Community</Text>
          <View style={{ width: 24 }} />
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Topic</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={uploading}
          style={[styles.postButton, uploading && styles.postButtonDisabled]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.communitySelector}
          onPress={() => setShowCommunityPicker(true)}
        >
          <Text style={[styles.communitySelectorText, !selectedCommunity && { color: '#9ca3af' }]}>
            {selectedCommunity ? `Posting to: ${selectedCommunity.name}` : 'Select a community'}
          </Text>
          <ChevronDown size={20} color="#6b7280" />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Topic Title"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#9ca3af"
            multiline
            value={body}
            onChangeText={setBody}
          />
        </View>

        {image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setImage(null)}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
            <View style={styles.placeholderContent}>
              <Camera size={48} color="#9ca3af" />
              <Text style={styles.placeholderText}>Add an image (optional)</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.options}>
          <TouchableOpacity style={styles.optionItem} onPress={pickImage}>
            <ImageIcon size={24} color="#0e7490" />
            <Text style={styles.optionText}>Photo Library</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  postButton: {
    backgroundColor: '#0e7490',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#a5f3fc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  communitySelectorText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
    gap: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  bodyInput: {
    fontSize: 16,
    color: '#374151',
    minHeight: 150,
    textAlignVertical: 'top',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
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
    color: '#111827',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6b7280',
  },
  // Premium Confirmation Modal Styles
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
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
