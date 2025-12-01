import AsyncStorage from '@react-native-async-storage/async-storage';

export type BudgetType = 'daily' | 'weekly' | 'monthly';

export interface BudgetSettings {
  amount: number;
  type: BudgetType;
  enabled: boolean;
}

const BUDGET_STORAGE_KEY = '@mizu_budget_settings';

export const budgetStorage = {
  // Save budget settings
  saveBudget: async (settings: BudgetSettings): Promise<void> => {
    try {
      await AsyncStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(settings));
      console.log('✅ Budget saved:', settings);
    } catch (error) {
      console.error('❌ Error saving budget:', error);
      throw error;
    }
  },

  // Load budget settings
  loadBudget: async (): Promise<BudgetSettings | null> => {
    try {
      const data = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
      if (data) {
        const settings = JSON.parse(data) as BudgetSettings;
        console.log('✅ Budget loaded:', settings);
        return settings;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading budget:', error);
      return null;
    }
  },

  // Clear budget settings
  clearBudget: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(BUDGET_STORAGE_KEY);
      console.log('✅ Budget cleared');
    } catch (error) {
      console.error('❌ Error clearing budget:', error);
      throw error;
    }
  },

  // Check if budget is set
  hasBudget: async (): Promise<boolean> => {
    try {
      const data = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
      return data !== null;
    } catch (error) {
      console.error('❌ Error checking budget:', error);
      return false;
    }
  },
};