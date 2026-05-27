import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  HABITS: '@habit_tracker:habits',
  LOGS: '@habit_tracker:logs',
  STATS: '@habit_tracker:stats',
  CHALLENGES: '@habit_tracker:challenges',
  ACTIVE_THEME: '@habit_tracker:active_theme',
};

export async function saveData<T>(key: string, value: T): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    return false;
  }
}

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultValue;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}
