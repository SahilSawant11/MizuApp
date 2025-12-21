import React from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Text,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { fonts } from '../theme/typography';

interface PhotoViewerProps {
  visible: boolean;
  photoUrl: string | null;
  title?: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  photoUrl,
  title,
  onClose,
}) => {
  if (!photoUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <TouchableOpacity 
          style={styles.imageContainer} 
          activeOpacity={1}
          onPress={onClose}
        >
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Footer with hint */}
        <View style={styles.footer}>
          <Text style={styles.hint}>Tap anywhere to close</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  image: {
    width: width,
    height: height,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: fonts.regular,
  },
});