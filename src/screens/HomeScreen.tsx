// src/screens/HomeScreen.tsx

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

export const HomeScreen: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState('');
  const [expenses, setExpenses] = useState<Entry[]>([]);
  const [tasks, setTasks] = useState<Entry[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);

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
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const parseInput = (text: string) => {
  // More flexible expense detection
  const expenseMatch = text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    let title = expenseMatch[2].trim();
    
    // Remove ₹ symbol if user included it
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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.expenseAmount}>₹{totalExpense.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tasks</Text>
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
            placeholderTextColor="#999"
            onSubmitEditing={handleAddEntry}
            returnKeyType="done"
          />
          <Text style={styles.hint}>
            Include amount for expenses, or just text for tasks
          </Text>
        </View>

        {/* Expenses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses</Text>
          ) : (
            expenses.map(expense => (
              <View key={expense.id} style={styles.listItem}>
                <Text style={styles.itemText}>{expense.title}</Text>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>₹{expense.amount?.toFixed(2)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteEntry(expense.id!)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tasks List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks</Text>
          ) : (
            tasks.map(task => (
              <View key={task.id} style={styles.listItem}>
                <View style={styles.checkbox} />
                <Text style={styles.itemText}>{task.title}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteEntry(task.id!)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryItem: {
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 56,
    fontWeight: '300',
    color: '#000',
    letterSpacing: -2,
  },
  taskCount: {
    fontSize: 56,
    fontWeight: '300',
    color: '#000',
  },
  inputSection: {
    marginBottom: 32,
  },
  input: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    paddingLeft: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 16,
    color: '#000',
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
});