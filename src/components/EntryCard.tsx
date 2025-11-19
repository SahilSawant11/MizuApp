import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Entry } from '../models/Entry';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress, onLongPress }) => {
  const isExpense = entry.type === 'expense';

  return (
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
            {isExpense ? '💸 Expense' : '📝 Activity'}
          </Text>
        </View>

        {isExpense && entry.payment_mode && (
          <Text style={styles.paymentMode}>{entry.payment_mode}</Text>
        )}
      </View>

      {entry.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {entry.notes}
        </Text>
      )}

      <Text style={styles.time}>
        {new Date(entry.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
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
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E63946',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
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
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});