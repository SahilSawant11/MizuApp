import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Entry } from '../models/Entry';
import { PhotoViewer } from './PhotoViewer';
import { fonts } from '../theme/typography';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress, onLongPress }) => {
  const isExpense = entry.type === 'expense';
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{entry.title}</Text>
            {entry.category && (
              <Text style={styles.category}>{entry.category}</Text>
            )}
          </View>
          
          {isExpense && entry.amount && (
            <Text style={styles.amount}>₹{entry.amount.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.metadata}>
          <View style={[styles.badge, isExpense ? styles.expenseBadge : styles.activityBadge]}>
            <Text style={[styles.badgeText, isExpense ? styles.expenseText : styles.activityText]}>
              {isExpense ? 'Expense' : 'Activity'}
            </Text>
          </View>

          {isExpense && entry.payment_mode && (
            <Text style={styles.paymentMode}>{entry.payment_mode}</Text>
          )}

          {entry.has_photo && (
            <View style={styles.photoBadge}>
              <Icon name="image" size={12} color="#6BCF9F" />
              <Text style={styles.photoBadgeText}>Photo</Text>
            </View>
          )}
        </View>

        {entry.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {entry.notes}
          </Text>
        )}

        {/* Photo Thumbnail */}
        {entry.has_photo && entry.photo_url && (
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => setPhotoViewerVisible(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: entry.photo_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.photoOverlay}>
              <Icon name="maximize-2" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.time}>
          {new Date(entry.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>

      {/* Full-screen Photo Viewer */}
      <PhotoViewer
        visible={photoViewerVisible}
        photoUrl={entry.photo_url || null}
        title={entry.title}
        onClose={() => setPhotoViewerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: fonts.semibold,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E63946',
    fontFamily: fonts.bold,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expenseBadge: {
    backgroundColor: '#FFE5E5',
  },
  activityBadge: {
    backgroundColor: '#E5F4FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },
  expenseText: {
    color: '#E63946',
  },
  activityText: {
    color: '#457B9D',
  },
  paymentMode: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    gap: 4,
  },
  photoBadgeText: {
    fontSize: 11,
    color: '#6BCF9F',
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  photoContainer: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#F0F0F0',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: fonts.regular,
  },
});