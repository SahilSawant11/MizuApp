import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { Alert, Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  type: string;
  fileName: string;
  fileSize: number;
}

export const pickImageFromCamera = async (): Promise<PickedImage | null> => {
  try {
    const result: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: false,
      cameraType: 'back',
    });

    if (result.didCancel) {
      console.log('User cancelled camera');
      return null;
    }

    if (result.errorCode) {
      handleImagePickerError(result.errorCode, result.errorMessage);
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset) return null;

    return formatAsset(asset);
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert('Error', 'Failed to open camera');
    return null;
  }
};

export const pickImageFromGallery = async (): Promise<PickedImage | null> => {
  try {
    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      console.log('User cancelled gallery');
      return null;
    }

    if (result.errorCode) {
      handleImagePickerError(result.errorCode, result.errorMessage);
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset) return null;

    return formatAsset(asset);
  } catch (error) {
    console.error('Gallery error:', error);
    Alert.alert('Error', 'Failed to open gallery');
    return null;
  }
};

const formatAsset = (asset: Asset): PickedImage => {
  return {
    uri: asset.uri || '',
    type: asset.type || 'image/jpeg',
    fileName: asset.fileName || `photo_${Date.now()}.jpg`,
    fileSize: asset.fileSize || 0,
  };
};

const handleImagePickerError = (code: string, message?: string) => {
  switch (code) {
    case 'camera_unavailable':
      Alert.alert('Error', 'Camera is not available on this device');
      break;
    case 'permission':
      Alert.alert(
        'Permission Denied',
        'Please grant camera and photo library permissions in Settings'
      );
      break;
    default:
      Alert.alert('Error', message || 'Failed to pick image');
  }
};

// Check file size (5MB limit for now)
export const validateImageSize = (fileSize: number): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileSize > maxSize) {
    Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
    return false;
  }
  return true;
};