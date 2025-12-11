import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Entry } from '../models/Entry';
import { entryRepository } from '../database/entryRepo';
import { useAuth } from '../contexts/AuthContext';
import { BudgetProgress } from '../components/BudgetProgress';
import { BudgetSettingsModal } from '../components/BudgetSettingsModal';
import { budgetStorage, BudgetSettings } from '../utils/budgetStorage';
import { fonts } from '../theme/typography';

export const HomeScreen: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState('');
  const [totalExpense, setTotalExpense] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const { user } = useAuth();

  const loadBudgetSettings = useCallback(async () => {
    const settings = await budgetStorage.loadBudget();
    setBudgetSettings(settings);
  }, []);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (!budgetSettings) return { start: today, end: today };

    switch (budgetSettings.type) {
      case 'daily':
        return { start: today, end: today };
      
      case 'weekly': {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        const startOfWeek = monday.toISOString().split('T')[0];
        return { start: startOfWeek, end: today };
      }
      
      case 'monthly': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth.toISOString().split('T')[0], end: today };
      }
    }
  }, [budgetSettings]);

  const loadEntries = useCallback(async () => {
    try {
      const { start, end } = getDateRange();
      
      let data: Entry[];
      if (start === end) {
        data = await entryRepository.getByDate(start);
      } else {
        data = await entryRepository.getByDateRange(start, end);
      }

      setEntries(data);
      
      const expenseList = data.filter(e => e.type === 'expense');
      const taskList = data.filter(e => e.type === 'activity');
      
      setTaskCount(taskList.length);
      
      const total = expenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
      setTotalExpense(total);
    } catch (error: any) {
      console.error('Failed to load entries:', error);
      Alert.alert('Error', 'Failed to load entries. Please try again.');
    }
  }, [getDateRange]);

  useEffect(() => {
    if (user) {
      loadBudgetSettings();
    }
  }, [user, loadBudgetSettings]);

  useEffect(() => {
    if (user && budgetSettings) {
      loadEntries();
    }
  }, [user, budgetSettings, loadEntries]);

  const parseInput = (text: string) => {
    const expenseMatch = text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    
    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      let title = expenseMatch[2].trim();
      title = title.replace(/₹\s*$/, '').trim();
      
      return {
        type: 'expense' as const,
        amount: amount,
        title: title,
      };
    }
    
    return {
      type: 'activity' as const,
      title: text.trim(),
    };
  };

  const handleAddEntry = async () => {
    if (!inputText.trim()) return;

    try {
      const parsed = parseInput(inputText);
      
      await entryRepository.create({
        title: parsed.title,
        type: parsed.type,
        amount: parsed.type === 'expense' ? parsed.amount : undefined,
      });

      setInputText('');
      loadEntries();
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await entryRepository.delete(id);
      loadEntries();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  const handleBudgetSave = () => {
    loadBudgetSettings();
    loadEntries();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>Welcome!</Text>
        </View>
        <View style={styles.logoContainer}>
          <MaterialIcon name="leaf" size={28} color="#6BCF9F" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Budget Progress */}
        {budgetSettings && budgetSettings.enabled ? (
          <BudgetProgress
            budget={budgetSettings.amount}
            spent={totalExpense}
            type={budgetSettings.type}
            onSettingsPress={() => setShowBudgetModal(true)}
          />
        ) : (
          <View style={styles.noBudgetCard}>
            <MaterialIcon name="wallet-outline" size={48} color="#6BCF9F" />
            <Text style={styles.noBudgetTitle}>Set Your Budget</Text>
            <Text style={styles.noBudgetText}>
              Track your spending and stay on top of your finances
            </Text>
            <TouchableOpacity
              style={styles.setBudgetButton}
              onPress={() => setShowBudgetModal(true)}
            >
              <Text style={styles.setBudgetButtonText}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Section - Side by Side */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Icon name="trending-down" size={24} color="#FF6B6B" style={styles.summaryIcon} />
            <Text style={styles.summaryLabel}>
              {budgetSettings?.type === 'daily' ? "Today's" : 
               budgetSettings?.type === 'weekly' ? "This Week's" : 
               "This Month's"} Expenses
            </Text>
            <Text style={styles.expenseAmount}>₹{totalExpense.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.taskCard]}>
            <Icon name="check-circle" size={24} color="#6BCF9F" style={styles.summaryIcon} />
            <Text style={styles.summaryLabel}>Tasks Logged</Text>
            <Text style={styles.taskCount}>{taskCount}</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputWrapper}>
            <Icon name="edit-3" size={20} color="#9DB4A8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="50 groceries or buy milk"
              placeholderTextColor="#9DB4A8"
              onSubmitEditing={handleAddEntry}
              returnKeyType="done"
            />
            {inputText.length > 0 && (
              <TouchableOpacity onPress={handleAddEntry} style={styles.sendButton}>
                <Icon name="send" size={20} color="#6BCF9F" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.hintRow}>
            <Icon name="info" size={14} color="#9DB4A8" />
            <Text style={styles.hint}>
              Include amount for expenses, or just text for tasks
            </Text>
          </View>
        </View>

        {/* Combined List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {budgetSettings?.type === 'daily' ? "Today's Activity" : 
             budgetSettings?.type === 'weekly' ? "This Week's Activity" : 
             "This Month's Activity"}
          </Text>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#9DB4A8" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start adding expenses or tasks</Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <View style={[
                    styles.iconBadge,
                    entry.type === 'expense' ? styles.expenseBadge : styles.activityBadge
                  ]}>
                    <Icon 
                      name={entry.type === 'expense' ? 'dollar-sign' : 'check'} 
                      size={16} 
                      color={entry.type === 'expense' ? '#FF6B6B' : '#6BCF9F'} 
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemText}>{entry.title}</Text>
                    <View style={styles.itemMeta}>
                      <Icon name="clock" size={12} color="#9DB4A8" />
                      <Text style={styles.itemTime}>
                        {new Date(entry.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  {entry.type === 'expense' && entry.amount && (
                    <Text style={styles.itemAmount}>₹{entry.amount.toFixed(2)}</Text>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteEntry(entry.id!)}
                    style={styles.deleteButton}
                  >
                    <Icon name="x" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Budget Settings Modal */}
      <BudgetSettingsModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={handleBudgetSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5EE',
  },
  greeting: {
    fontSize: 14,
    color: '#5F7A6F',
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3A2E',
    fontFamily: fonts.bold,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  noBudgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  noBudgetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: fonts.bold,
  },
  noBudgetText: {
    fontSize: 14,
    color: '#5F7A6F',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fonts.regular,
  },
  setBudgetButton: {
    backgroundColor: '#6BCF9F',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  setBudgetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  taskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6BCF9F',
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#5F7A6F',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },
  expenseAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
    letterSpacing: -1,
    fontFamily: fonts.bold,
  },
  taskCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
    fontFamily: fonts.bold,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A3A2E',
    paddingVertical: 16,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  sendButton: {
    padding: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 4,
  },
  hint: {
    fontSize: 13,
    color: '#9DB4A8',
    marginLeft: 6,
    fontFamily: fonts.regular,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 16,
    fontFamily: fonts.bold,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F7A6F',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: fonts.semibold,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9DB4A8',
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: 'rgba(107, 207, 159, 0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseBadge: {
    backgroundColor: '#FFE5E5',
  },
  activityBadge: {
    backgroundColor: '#E8F5EE',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#1A3A2E',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: fonts.medium,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTime: {
    fontSize: 12,
    color: '#9DB4A8',
    marginLeft: 4,
    fontFamily: fonts.regular,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A2E',
    marginRight: 12,
    fontFamily: fonts.bold,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});