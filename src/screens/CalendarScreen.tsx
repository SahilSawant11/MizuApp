import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Entry } from '../models/Entry';
import { entryRepository } from '../database/entryRepo';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

interface DayData {
  date: string;
  totalExpenses: number;
  entryCount: number;
}

export const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [selectedDayEntries, setSelectedDayEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Format date consistently
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadMonthData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first and last day of month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = formatDate(firstDay);
      const endDate = formatDate(lastDay);
      
      console.log('📅 Loading month data:', { startDate, endDate, userId: user.id });
      
      const entries = await entryRepository.getByDateRange(startDate, endDate);
      
      console.log('📊 Entries loaded:', entries.length);
      
      // Group by date
      const dataMap = new Map<string, DayData>();
      entries.forEach(entry => {
        const existing = dataMap.get(entry.date);
        if (existing) {
          existing.entryCount++;
          if (entry.type === 'expense' && entry.amount) {
            existing.totalExpenses += entry.amount;
          }
        } else {
          dataMap.set(entry.date, {
            date: entry.date,
            totalExpenses: entry.type === 'expense' && entry.amount ? entry.amount : 0,
            entryCount: 1,
          });
        }
      });
      
      console.log('📈 Days with entries:', dataMap.size);
      setMonthData(dataMap);
    } catch (error) {
      console.error('❌ Failed to load month data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [currentDate, user]);

  const loadSelectedDayEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      const dateStr = formatDate(selectedDate);
      console.log('📝 Loading entries for date:', dateStr, 'user:', user.id);
      
      const entries = await entryRepository.getByDate(dateStr);
      console.log('✅ Entries loaded for selected day:', entries.length);
      
      setSelectedDayEntries(entries);
    } catch (error) {
      console.error('❌ Failed to load day entries:', error);
    }
  }, [selectedDate, user]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadMonthData();
        loadSelectedDayEntries();
      }
    }, [user, loadMonthData, loadSelectedDayEntries])
  );

  // Load month data when currentDate changes
  useEffect(() => {
    if (user) {
      loadMonthData();
    }
  }, [user, currentDate, loadMonthData]);

  // Load selected day entries when selectedDate changes
  useEffect(() => {
    if (user) {
      loadSelectedDayEntries();
    }
  }, [user, selectedDate, loadSelectedDayEntries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMonthData(), loadSelectedDayEntries()]);
    setRefreshing(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDeleteEntry = async (id: number) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await entryRepository.delete(id);
              await Promise.all([loadSelectedDayEntries(), loadMonthData()]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const getDotColor = (amount: number): string => {
    if (amount === 0) return '#6BCF9F'; // No expenses (tasks only)
    if (amount < 100) return '#6BCF9F'; // Low
    if (amount < 500) return '#FFD166'; // Medium
    return '#FF6B6B'; // High
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date: Date): boolean => {
    return formatDate(date) === formatDate(selectedDate);
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const selectedDateStr = formatDate(selectedDate);
  const selectedDayData = monthData.get(selectedDateStr);
  const selectedTotal = selectedDayData?.totalExpenses || 0;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view calendar</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Calendar</Text>
        <View style={styles.headerRight}>
          {loading && <ActivityIndicator size="small" color="#6BCF9F" style={{ marginRight: 12 }} />}
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6BCF9F"
          />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {/* Day headers */}
          <View style={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.daysContainer}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const dateStr = formatDate(day);
              const dayData = monthData.get(dateStr);
              const hasEntries = dayData && dayData.entryCount > 0;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday(day) && styles.todayCell,
                    isSelected(day) && styles.selectedCell,
                  ]}
                  onPress={() => handleDatePress(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) && styles.todayText,
                      isSelected(day) && styles.selectedText,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {hasEntries && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: getDotColor(dayData.totalExpenses) },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Details */}
        <View style={styles.selectedDaySection}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {selectedTotal > 0 && (
              <Text style={styles.selectedDayTotal}>₹{selectedTotal.toFixed(2)}</Text>
            )}
          </View>

          {selectedDayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No entries for this day</Text>
              <Text style={styles.emptySubtext}>
                {isToday(selectedDate) ? 'Start tracking your day!' : 'Select another date'}
              </Text>
            </View>
          ) : (
            selectedDayEntries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  <View style={[styles.entryBadge, entry.type === 'expense' ? styles.expenseBadge : styles.activityBadge]}>
                    <Text style={styles.entryBadgeText}>
                      {entry.type === 'expense' ? '💸' : '✓'}
                    </Text>
                  </View>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    {entry.category && (
                      <Text style={styles.entryCategory}>{entry.category}</Text>
                    )}
                    <Text style={styles.entryTime}>
                      {new Date(entry.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryRight}>
                  {entry.type === 'expense' && entry.amount && (
                    <Text style={styles.entryAmount}>₹{entry.amount.toFixed(2)}</Text>
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

        {/* Debug info (remove in production) */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>User: {user.email}</Text>
          <Text style={styles.debugText}>Entries this month: {monthData.size} days</Text>
          <Text style={styles.debugText}>Selected day: {selectedDayEntries.length} entries</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5EE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3A2E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#6BCF9F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonText: {
    fontSize: 20,
    color: '#1A3A2E',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9DB4A8',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#E8F5EE',
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#6BCF9F',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#1A3A2E',
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '700',
    color: '#6BCF9F',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedDaySection: {
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
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5EE',
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3A2E',
    flex: 1,
  },
  selectedDayTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FFF9',
  },
  entryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  entryBadgeText: {
    fontSize: 16,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A2E',
    marginBottom: 2,
  },
  entryCategory: {
    fontSize: 12,
    color: '#9DB4A8',
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: '#9DB4A8',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3A2E',
    marginRight: 12,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: '300',
  },
  debugInfo: {
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#5F7A6F',
    marginBottom: 4,
  },
});