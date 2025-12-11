import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { budgetStorage, BudgetType, BudgetSettings } from '../utils/budgetStorage';
import { fonts } from '../theme/typography';

interface BudgetSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<BudgetType>('daily');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const settings = await budgetStorage.loadBudget();
    if (settings) {
      setAmount(settings.amount.toString());
      setType(settings.type);
      setEnabled(settings.enabled);
    }
  };

  const handleSave = async () => {
    const budgetAmount = parseFloat(amount);

    if (!amount || isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount');
      return;
    }

    try {
      const settings: BudgetSettings = {
        amount: budgetAmount,
        type,
        enabled,
      };

      await budgetStorage.saveBudget(settings);
      Alert.alert('Success', 'Budget settings saved!');
      onSave();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget settings');
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Budget',
      'Are you sure you want to remove your budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await budgetStorage.clearBudget();
            setAmount('');
            setType('daily');
            setEnabled(true);
            Alert.alert('Success', 'Budget cleared!');
            onSave();
            onClose();
          },
        },
      ]
    );
  };

  const getPeriodInfo = () => {
    switch (type) {
      case 'daily':
        return {
          icon: 'sun',
          text: 'Track your spending against a daily budget limit',
        };
      case 'weekly':
        return {
          icon: 'calendar',
          text: 'Monitor your expenses for the entire week',
        };
      case 'monthly':
        return {
          icon: 'calendar',
          text: 'Keep your monthly spending under control',
        };
    }
  };

  const periodInfo = getPeriodInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Enable/Disable Budget */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={styles.iconCircle}>
                  <Icon name="toggle-right" size={20} color="#6BCF9F" />
                </View>
                <Text style={styles.label}>Enable Budget Tracking</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: '#D4E8DD', true: '#6BCF9F' }}
                thumbColor={enabled ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Budget Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Budget Amount</Text>
            <View style={styles.inputContainer}>
              <Icon name="dollar-sign" size={20} color="#1A3A2E" style={styles.currencyIcon} />
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9DB4A8"
                keyboardType="decimal-pad"
                editable={enabled}
              />
            </View>
          </View>

          {/* Budget Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Budget Period</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'daily' && styles.typeButtonActive,
                  !enabled && styles.typeButtonDisabled,
                ]}
                onPress={() => enabled && setType('daily')}
                disabled={!enabled}
              >
                <Icon 
                  name="sun" 
                  size={20} 
                  color={type === 'daily' ? '#FFFFFF' : '#5F7A6F'} 
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'daily' && styles.typeButtonTextActive,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'weekly' && styles.typeButtonActive,
                  !enabled && styles.typeButtonDisabled,
                ]}
                onPress={() => enabled && setType('weekly')}
                disabled={!enabled}
              >
                <Icon 
                  name="calendar" 
                  size={20} 
                  color={type === 'weekly' ? '#FFFFFF' : '#5F7A6F'} 
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'weekly' && styles.typeButtonTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'monthly' && styles.typeButtonActive,
                  !enabled && styles.typeButtonDisabled,
                ]}
                onPress={() => enabled && setType('monthly')}
                disabled={!enabled}
              >
                <Icon 
                  name="calendar" 
                  size={20} 
                  color={type === 'monthly' ? '#FFFFFF' : '#5F7A6F'} 
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'monthly' && styles.typeButtonTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Text */}
          <View style={styles.infoBox}>
            <Icon name={periodInfo.icon} size={20} color="#6BCF9F" />
            <Text style={styles.infoText}>{periodInfo.text}</Text>
          </View>

          {/* Clear Budget Button */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="trash-2" size={18} color="#FF6B6B" style={styles.clearIcon} />
            <Text style={styles.clearButtonText}>Clear Budget Settings</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5EE',
  },
  cancelButton: {
    fontSize: 16,
    color: '#5F7A6F',
    fontFamily: fonts.regular,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A3A2E',
    fontFamily: fonts.semibold,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6BCF9F',
    fontFamily: fonts.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A2E',
    marginBottom: 12,
    fontFamily: fonts.semibold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    paddingHorizontal: 16,
  },
  currencyIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1A3A2E',
    paddingVertical: 16,
    fontFamily: fonts.semibold,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#6BCF9F',
    borderColor: '#6BCF9F',
  },
  typeButtonDisabled: {
    opacity: 0.5,
  },
  typeIcon: {
    marginBottom: 6,
  },
  typeButtonText: {
    fontSize: 15,
    color: '#5F7A6F',
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5EE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5F7A6F',
    lineHeight: 20,
    marginLeft: 12,
    fontFamily: fonts.regular,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
    fontFamily: fonts.semibold,
  },
});