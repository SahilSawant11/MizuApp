import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Entry, EntryType, Category, PaymentMode } from '../models/Entry';
import { entryRepository } from '../database/entryRepo';
import { PhotoPicker } from '../components/PhotoPicker';
import { uploadPhoto } from '../utils/supabaseStorage';
import { PickedImage } from '../utils/imagePickerHelper';
import { useAuth } from '../contexts/AuthContext';

interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editEntry?: Entry | null;
}

const CATEGORIES: Category[] = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Bills & Utilities',
  'Education',
  'Other',
];

const PAYMENT_MODES: PaymentMode[] = [
  'Cash',
  'UPI',
  'Card',
  'Net Banking',
  'Other',
];

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  editEntry,
}) => {
  const { user } = useAuth();
  const [type, setType] = useState<EntryType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [notes, setNotes] = useState('');
  
  // Photo state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<PickedImage | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  useEffect(() => {
    if (editEntry) {
      setType(editEntry.type);
      setTitle(editEntry.title);
      setAmount(editEntry.amount?.toString() || '');
      setCategory(editEntry.category || null);
      setPaymentMode(editEntry.payment_mode || null);
      setNotes(editEntry.notes || '');
      setPhotoUri(editEntry.photo_url || null);
      setPhotoPath(editEntry.photo_path || null);
    } else {
      resetForm();
    }
  }, [editEntry, visible]);

  const resetForm = () => {
    setType('expense');
    setTitle('');
    setAmount('');
    setCategory(null);
    setPaymentMode(null);
    setNotes('');
    setPhotoUri(null);
    setPhotoData(null);
    setPhotoPath(null);
    setUploadingPhoto(false);
  };

  const handlePhotoSelected = (image: PickedImage) => {
    setPhotoUri(image.uri);
    setPhotoData(image);
  };

  const handlePhotoRemoved = () => {
    setPhotoUri(null);
    setPhotoData(null);
    setPhotoPath(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (type === 'expense' && !amount) {
      Alert.alert('Error', 'Please enter an amount for expenses');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      let finalPhotoUrl = photoUri;
      let finalPhotoPath = photoPath;

      // Upload new photo if selected
      if (photoData && photoData.uri !== photoUri) {
        setUploadingPhoto(true);
        try {
          const uploadResult = await uploadPhoto(
            photoData.uri,
            user.id,
            photoData.fileName
          );
          finalPhotoUrl = uploadResult.publicUrl;
          finalPhotoPath = uploadResult.path;
          console.log('✅ Photo uploaded:', uploadResult);
        } catch (uploadError) {
          console.error('❌ Photo upload failed:', uploadError);
          Alert.alert(
            'Photo Upload Failed',
            'Do you want to save the entry without the photo?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save Anyway', 
                onPress: () => {
                  finalPhotoUrl = null;
                  finalPhotoPath = null;
                }
              },
            ]
          );
          setUploadingPhoto(false);
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      if (editEntry) {
        // Update existing entry
        await entryRepository.update({
          id: editEntry.id!,
          title: title.trim(),
          type,
          amount: amount ? parseFloat(amount) : undefined,
          category: type === 'expense' ? (category ?? undefined) : undefined,
          payment_mode: type === 'expense' ? (paymentMode ?? undefined) : undefined,
          notes: notes.trim() || undefined,
          photo_url: finalPhotoUrl || undefined,
          photo_path: finalPhotoPath || undefined,
          has_photo: !!finalPhotoUrl,
        });
      } else {
        // Create new entry
        await entryRepository.create({
          title: title.trim(),
          type,
          amount: amount ? parseFloat(amount) : undefined,
          category: type === 'expense' ? category || undefined : undefined,
          payment_mode: type === 'expense' ? paymentMode || undefined : undefined,
          notes: notes.trim() || undefined,
          photo_url: finalPhotoUrl || undefined,
          photo_path: finalPhotoPath || undefined,
          has_photo: !!finalPhotoUrl,
        });
      }

      resetForm();
      onSave();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
      console.error(error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editEntry ? 'Edit Entry' : 'New Entry'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={uploadingPhoto}>
            <Text style={[styles.saveButton, uploadingPhoto && styles.saveButtonDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => setType('expense')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  💸 Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'activity' && styles.typeButtonActive,
                ]}
                onPress={() => setType('activity')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'activity' && styles.typeButtonTextActive,
                  ]}
                >
                  📝 Task
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor="#999"
            />
          </View>

          {/* Amount Input (Expenses Only) */}
          {type === 'expense' && (
            <View style={styles.section}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Category Selector (Expenses Only) */}
          {type === 'expense' && (
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      category === cat && styles.chipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === cat && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment Mode (Expenses Only) */}
          {type === 'expense' && (
            <View style={styles.section}>
              <Text style={styles.label}>Payment Mode</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {PAYMENT_MODES.map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.chip,
                      paymentMode === mode && styles.chipActive,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        paymentMode === mode && styles.chipTextActive,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Photo Picker */}
          <PhotoPicker
            photoUri={photoUri}
            onPhotoSelected={handlePhotoSelected}
            onPhotoRemoved={handlePhotoRemoved}
            loading={uploadingPhoto}
            disabled={uploadingPhoto}
          />

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#457B9D',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  typeButtonActive: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
  typeButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});