import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Entry } from '../models/Entry';
import { entryRepository } from '../database/entryRepo';
import { EntryCard } from '../components/EntryCard';

export const HomeScreen: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadEntries = useCallback(async () => {
    try {
      const data = await entryRepository.getByDate(selectedDate);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const handleEntryPress = (entry: Entry) => {
    // TODO: Navigate to edit screen
    console.log('Edit entry:', entry);
  };

  const handleEntryLongPress = (entry: Entry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await entryRepository.delete(entry.id!);
              loadEntries();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const handleAddEntry = () => {
    // TODO: Navigate to add entry screen
    console.log('Add new entry');
  };

  const getTodayStats = () => {
    const expenseCount = entries.filter(e => e.type === 'expense').length;
    const activityCount = entries.filter(e => e.type === 'activity').length;
    const totalExpense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return { expenseCount, activityCount, totalExpense };
  };

  const stats = getTodayStats();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.activityCount}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.expenseValue]}>
            ₹{stats.totalExpense.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyText}>No entries yet</Text>
      <Text style={styles.emptySubtext}>Tap below to add your first entry</Text>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
      <Text style={styles.addButtonIcon}>➕</Text>
      <Text style={styles.addButtonText}>Add new entry</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleBar}>
        <Text style={styles.appTitle}>Mizu</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id!.toString()}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => handleEntryPress(item)}
            onLongPress={() => handleEntryLongPress(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {renderAddButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  titleBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  expenseValue: {
    color: '#E63946',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#457B9D',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});