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

export const HomeScreen: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState('');
  const [expenses, setExpenses] = useState<Entry[]>([]);
  const [tasks, setTasks] = useState<Entry[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const { user } = useAuth();

  const loadEntries = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await entryRepository.getByDate(today);
      setEntries(data);
      
      const expenseList = data.filter(e => e.type === 'expense');
      const taskList = data.filter(e => e.type === 'activity');
      
      setExpenses(expenseList);
      setTasks(taskList);
      
      const total = expenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
      setTotalExpense(total);
    } catch (error: any) {
      console.error('Failed to load entries:', error);
      Alert.alert('Error', 'Failed to load entries. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [loadEntries, user]);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>Welcome!</Text>
        </View>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💧</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Today's Expenses</Text>
            <Text style={styles.expenseAmount}>₹{totalExpense.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tasks Logged</Text>
            <Text style={styles.taskCount}>{tasks.length}</Text>
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

        {/* Expenses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💸 Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add one by typing amount + description</Text>
            </View>
          ) : (
            expenses.map(expense => (
              <View key={expense.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemText}>{expense.title}</Text>
                  <Text style={styles.itemTime}>
                    {new Date(expense.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>₹{expense.amount?.toFixed(2)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteEntry(expense.id!)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteIcon}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tasks List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✓ Tasks</Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Add one by typing any text</Text>
            </View>
          ) : (
            tasks.map(task => (
              <View key={task.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.checkbox} />
                  <View>
                    <Text style={styles.itemText}>{task.title}</Text>
                    <Text style={styles.itemTime}>
                      {new Date(task.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteEntry(task.id!)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  summarySection: {
    marginBottom: 32,
  },
  summaryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5F7A6F',
    marginBottom: 8,
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A3A2E',
    letterSpacing: -2,
  },
  taskCount: {
    fontSize: 48,
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
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D4E8DD',
    borderRadius: 6,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#1A3A2E',
    fontWeight: '500',
    marginBottom: 4,
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