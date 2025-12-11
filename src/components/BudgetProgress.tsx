import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { BudgetType } from '../utils/budgetStorage';
import { fonts } from '../theme/typography';

interface BudgetProgressProps {
  budget: number;
  spent: number;
  type: BudgetType;
  onSettingsPress: () => void;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  budget,
  spent,
  type,
  onSettingsPress,
}) => {
  const remaining = budget - spent;
  const percentage = Math.min((spent / budget) * 100, 100);
  const isOverBudget = spent > budget;
  const isWarning = percentage >= 80 && !isOverBudget;

  const getStatusColor = () => {
    if (isOverBudget) return '#FF6B6B';
    if (isWarning) return '#FFD166';
    return '#6BCF9F';
  };

  const getStatusText = () => {
    if (isOverBudget) return 'Over Budget';
    if (isWarning) return 'Almost There';
    return 'On Track';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return 'alert-triangle';
    if (isWarning) return 'zap';
    return 'check-circle';
  };

  const getPeriodText = () => {
    switch (type) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget {getPeriodText()}</Text>
        <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
          <Icon name="settings" size={18} color="#6BCF9F" />
        </TouchableOpacity>
      </View>

      {/* Amount Display */}
      <View style={styles.amountRow}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Budget</Text>
          <Text style={styles.budgetAmount}>₹{budget.toFixed(0)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Spent</Text>
          <Text style={[styles.spentAmount, isOverBudget && styles.overBudget]}>
            ₹{spent.toFixed(0)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Left</Text>
          <Text style={[styles.remainingAmount, isOverBudget && styles.overBudget]}>
            ₹{remaining.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
      </View>

      {/* Status */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
        <Icon name={getStatusIcon()} size={16} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: 'rgba(107, 207, 159, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A2E',
    fontFamily: fonts.bold,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8F5EE',
  },
  amountLabel: {
    fontSize: 12,
    color: '#9DB4A8',
    marginBottom: 6,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A2E',
    fontFamily: fonts.bold,
  },
  spentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5F7A6F',
    fontFamily: fonts.bold,
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6BCF9F',
    fontFamily: fonts.bold,
  },
  overBudget: {
    color: '#FF6B6B',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E8F5EE',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3A2E',
    minWidth: 40,
    textAlign: 'right',
    fontFamily: fonts.bold,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: fonts.semibold,
  },
});