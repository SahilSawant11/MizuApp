import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { pickImageFromCamera, pickImageFromGallery, PickedImage, validateImageSize } from '../utils/imagePickerHelper';
import { fonts } from '../theme/typography';

interface PhotoPickerProps {
  photoUri: string | null;
  onPhotoSelected: (image: PickedImage) => void;
  onPhotoRemoved: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  loading = false,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickerChoice = () => {
    Alert.alert(
      'Add Photo',
      'Choose how to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: handleCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleCamera = async () => {
    if (disabled || loading) return;
    
    setIsProcessing(true);
    try {
      const image = await pickImageFromCamera();
      if (image) {
        if (validateImageSize(image.fileSize)) {
          onPhotoSelected(image);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallery = async () => {
    if (disabled || loading) return;
    
    setIsProcessing(true);
    try {
      const image = await pickImageFromGallery();
      if (image) {
        if (validateImageSize(image.fileSize)) {
          onPhotoSelected(image);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onPhotoRemoved,
        },
      ]
    );
  };

  if (photoUri) {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>Photo</Text>
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          {(loading || isProcessing) && (
            <View style={styles.photoOverlay}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <Text style={styles.uploadingText}>
                {loading ? 'Uploading...' : 'Processing...'}
              </Text>
            </View>
          )}
          {!loading && !isProcessing && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemovePhoto}
              disabled={disabled}
            >
              <Icon name="x" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Photo (Optional)</Text>
      <TouchableOpacity
        style={[styles.addPhotoButton, (disabled || loading || isProcessing) && styles.addPhotoButtonDisabled]}
        onPress={handlePickerChoice}
        disabled={disabled || loading || isProcessing}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator color="#6BCF9F" size="small" style={styles.addPhotoIcon} />
            <Text style={styles.addPhotoText}>Processing...</Text>
          </>
        ) : (
          <>
            <Icon name="camera" size={24} color="#6BCF9F" style={styles.addPhotoIcon} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
            <Text style={styles.addPhotoSubtext}>Take a photo or choose from gallery</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    fontFamily: fonts.semibold,
  },
  addPhotoButton: {
    backgroundColor: '#F8FFF9',
    borderWidth: 2,
    borderColor: '#E8F5EE',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoIcon: {
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6BCF9F',
    marginBottom: 4,
    fontFamily: fonts.semibold,
  },
  addPhotoSubtext: {
    fontSize: 12,
    color: '#9DB4A8',
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    fontFamily: fonts.semibold,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});