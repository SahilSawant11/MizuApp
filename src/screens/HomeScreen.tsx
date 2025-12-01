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
import { Entry } from '../models/Entry';
import { entryRepository } from '../database/entryRepo';
import { useAuth } from '../contexts/AuthContext';
import { BudgetProgress } from '../components/BudgetProgress';
import { BudgetSettingsModal } from '../components/BudgetSettingsModal';
import { budgetStorage, BudgetSettings } from '../utils/budgetStorage';

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
        // Get start of week (Monday)
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust when day is Sunday
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        const startOfWeek = monday.toISOString().split('T')[0];
        return { start: startOfWeek, end: today };
      }
      
      case 'monthly': {
        // Get start of month
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
        // For daily, use the simpler getByDate
        data = await entryRepository.getByDate(start);
      } else {
        // For weekly/monthly, use date range
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
          <Text style={styles.logo}>☘️</Text>
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
            <Text style={styles.noBudgetIcon}>💰</Text>
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
            <Text style={styles.summaryLabel}>
              {budgetSettings?.type === 'daily' ? "Today's" : 
               budgetSettings?.type === 'weekly' ? "This Week's" : 
               "This Month's"} Expenses
            </Text>
            <Text style={styles.expenseAmount}>₹{totalExpense.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.taskCard]}>
            <Text style={styles.summaryLabel}>Tasks Logged</Text>
            <Text style={styles.taskCount}>{taskCount}</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="50 groceries or buy milk"
            placeholderTextColor="#9DB4A8"
            onSubmitEditing={handleAddEntry}
            returnKeyType="done"
          />
          <Text style={styles.hint}>
            💡 Include amount for expenses, or just text for tasks
          </Text>
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
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start adding expenses or tasks</Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  {/* {entry.type === 'activity' && <View style={styles.checkbox} />} */}
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemText}>{entry.title}</Text>
                        <Text style={[styles.badgeText, entry.type === 'expense' ? styles.expenseText : styles.activityText]}>
                          {entry.type === 'expense' ? '' : ''}
                        </Text>
                    </View>
                    <Text style={styles.itemTime}>
                      {new Date(entry.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
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
                    <Text style={styles.deleteIcon}>×</Text>
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
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3A2E',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
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
  noBudgetIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noBudgetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 8,
  },
  noBudgetText: {
    fontSize: 14,
    color: '#5F7A6F',
    textAlign: 'center',
    marginBottom: 20,
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
  summaryLabel: {
    fontSize: 12,
    color: '#5F7A6F',
    marginBottom: 8,
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
    letterSpacing: -1,
  },
  taskCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2E',
  },
  inputSection: {
    marginBottom: 32,
  },
  input: {
    fontSize: 16,
    color: '#1A3A2E',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5EE',
    marginBottom: 8,
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    color: '#9DB4A8',
    paddingLeft: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F7A6F',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9DB4A8',
    textAlign: 'center',
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
  // checkbox: {
  //   width: 20,
  //   height: 20,
  //   borderWidth: 2,
  //   borderColor: '#D4E8DD',
  //   borderRadius: 6,
  //   marginRight: 12,
  // },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#1A3A2E',
    fontWeight: '500',
    marginRight: 8,
  },
  // badge: {
  //   width: 24,
  //   height: 24,
  //   borderRadius: 12,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // expenseBadge: {
  //   backgroundColor: '#FFE5E5',
  // },
  // activityBadge: {
  //   backgroundColor: '#E8F5EE',
  // },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expenseText: {
    color: '#FF6B6B',
  },
  activityText: {
    color: '#6BCF9F',
  },
  itemTime: {
    fontSize: 12,
    color: '#9DB4A8',
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
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 24,
    color: '#FF6B6B',
    fontWeight: '300',
  },
});