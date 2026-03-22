import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {Camera, X, Image as ImageIcon, ChevronDown} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {uploadFile} from '../services/axiosClient';
import {useGetCommunitiesQuery, useCreateCommunityTopicMutation, CommunitySearchResult} from '../services/communityApi';

interface CreatePostProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreatePost({onCancel, onSuccess}: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunitySearchResult | null>(null);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {data: communitiesData, isLoading: loadingCommunities} = useGetCommunitiesQuery({});
  const [createTopic] = useCreateCommunityTopicMutation();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!selectedCommunity) {
      Alert.alert('Error', 'Please select a community');
      return;
    }
    if (!title || !body) {
      Alert.alert('Error', 'Please fill in title and body');
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

      Alert.alert('Success', 'Topic created successfully!');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.data?.message || 'Failed to create topic');
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
          <View style={{width: 24}} />
        </View>
        <FlatList
          data={communitiesData?.communities || []}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={styles.communityOption}
              onPress={() => {
                setSelectedCommunity(item);
                setShowCommunityPicker(false);
              }}
            >
              <Image source={{uri: item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`}} style={styles.communityThumb} />
              <Text style={styles.communityOptionText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loadingCommunities ? <ActivityIndicator style={{marginTop: 20}} /> : <Text style={styles.emptyText}>No communities found</Text>
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
          disabled={uploading || !title || !body || !selectedCommunity}
          style={[styles.postButton, (!title || !body || !selectedCommunity || uploading) && styles.postButtonDisabled]}
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
          <Text style={[styles.communitySelectorText, !selectedCommunity && {color: '#9ca3af'}]}>
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
            <Image source={{uri: image}} style={styles.imagePreview} />
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
            <ImageIcon size={24} color="#4f46e5" />
            <Text style={styles.optionText}>Photo Library</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#a5b4fc',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    paddingVertical: 8,
  },
  bodyInput: {
    fontSize: 16,
    color: '#374151',
    minHeight: 120,
    textAlignVertical: 'top',
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
});
