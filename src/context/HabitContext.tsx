import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { saveData, loadData, STORAGE_KEYS } from '@/utils/storage';
import { scheduleHabitReminder, cancelHabitReminder } from '@/utils/notifications';

// Types Definition
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  timeBlock: 'Morning' | 'Afternoon' | 'Evening';
  targetTime?: string; // HH:MM
  reminderId?: string; // Expo notification ID
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  note?: string; // Optional 1-sentence note
}

export interface UserStats {
  skipTokensRemaining: number;
  lastTokenRefreshedMonth: string; // YYYY-MM
  currentStreak: number;
  longestStreak: number;
  unlockedBadges: string[]; // List of Badge IDs: 'first_habit', 'streak_3', 'streak_7', 'streak_21', 'skip_master'
}

export interface Challenge {
  id: string;
  name: string;
  durationDays: 3 | 7 | 21;
  description: string;
  completed: boolean;
  unlockedBadgeId: string;
}

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  stats: UserStats;
  challenges: Challenge[];
  addHabit: (name: string, emoji: string, timeBlock: 'Morning' | 'Afternoon' | 'Evening', targetTime?: string, enableReminder?: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitComplete: (habitId: string, date: string, note?: string) => Promise<void>;
  skipHabit: (habitId: string, date: string, note?: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  isTodayCompleted: boolean;
  getLocalDateString: (date?: Date) => string;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

// Helper to get local date string YYYY-MM-DD
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Pre-built default challenges
const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'challenge_3',
    name: '3-Day Jumpstart',
    durationDays: 3,
    description: 'Complete any habit for 3 consecutive days to build initial momentum. Unlocks Sunset Breeze Theme.',
    completed: false,
    unlockedBadgeId: 'streak_3',
  },
  {
    id: 'challenge_7',
    name: '7-Day Consistency',
    durationDays: 7,
    description: 'Keep your streak going for a full week. Unlocks Forest Glow Theme.',
    completed: false,
    unlockedBadgeId: 'streak_7',
  },
  {
    id: 'challenge_21',
    name: '21-Day Habit Former',
    durationDays: 21,
    description: 'Complete habits for 21 consecutive days to wire them into your routine. Unlocks Midnight Sleek Theme.',
    completed: false,
    unlockedBadgeId: 'streak_21',
  },
];

const INITIAL_STATS: UserStats = {
  skipTokensRemaining: 2,
  lastTokenRefreshedMonth: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })(),
  currentStreak: 0,
  longestStreak: 0,
  unlockedBadges: [],
};

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const [loading, setLoading] = useState(true);

  // Initialize and load data from AsyncStorage on mount
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedHabits = await loadData<Habit[]>(STORAGE_KEYS.HABITS, []);
        const storedLogs = await loadData<HabitLog[]>(STORAGE_KEYS.LOGS, []);
        const storedStats = await loadData<UserStats>(STORAGE_KEYS.STATS, INITIAL_STATS);
        const storedChallenges = await loadData<Challenge[]>(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);

        setHabits(storedHabits);
        setLogs(storedLogs);
        setChallenges(storedChallenges);

        // Process monthly token refresh on load
        const refreshedStats = checkAndRefreshTokens(storedStats);
        setStats(refreshedStats);
      } catch (err) {
        console.error('Failed to load local data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStoredData();
  }, []);

  // Helper to refresh skip tokens if a new month has started
  function checkAndRefreshTokens(currentStats: UserStats): UserStats {
    const now = new Date();
    const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (currentStats.lastTokenRefreshedMonth !== currentMonthString) {
      return {
        ...currentStats,
        skipTokensRemaining: 2, // Reset to 2 tokens per month
        lastTokenRefreshedMonth: currentMonthString,
      };
    }
    return currentStats;
  }

  // Calculate streaks whenever logs are updated
  const calculateStreak = (allLogs: HabitLog[]): { current: number; longest: number } => {
    if (allLogs.length === 0) return { current: 0, longest: 0 };

    // Get unique dates that have at least one completion or skip
    const activeDates = Array.from(
      new Set(allLogs.map((log) => log.date))
    ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    if (activeDates.length === 0) return { current: 0, longest: 0 };

    const todayStr = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // If today is not completed and yesterday is not completed, streak is 0
    const hasToday = activeDates.includes(todayStr);
    const hasYesterday = activeDates.includes(yesterdayStr);

    if (!hasToday && !hasYesterday) {
      return { current: 0, longest: stats.longestStreak };
    }

    let currentStreak = 0;
    let tempStreak = 0;
    let longestStreak = stats.longestStreak;

    // We start verification from whichever date is present (today or yesterday)
    let checkDate = hasToday ? new Date() : yesterday;

    while (true) {
      const dateStr = getLocalDateString(checkDate);
      if (activeDates.includes(dateStr)) {
        tempStreak++;
        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    currentStreak = tempStreak;

    // Compute longest streak by scanning all logs consecutively
    // Let's sort dates ascending (oldest first)
    const ascDates = [...activeDates].reverse();
    let maxStreak = 0;
    let runningStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of ascDates) {
      const currentDate = new Date(dStr);
      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
      prevDate = currentDate;
    }

    longestStreak = Math.max(maxStreak, longestStreak);

    return { current: currentStreak, longest: longestStreak };
  };

  // Helper to check and unlock challenges and badges
  const checkChallengesAndBadges = (
    currentStreak: number,
    unlockedBadges: string[],
    allLogs: HabitLog[]
  ) => {
    let updatedBadges = [...unlockedBadges];
    let badgesChanged = false;

    // 1. "First Step" Badge: Completed first habit ever
    if (!updatedBadges.includes('first_habit') && allLogs.some((l) => l.status === 'completed')) {
      updatedBadges.push('first_habit');
      badgesChanged = true;
      Alert.alert('🏆 Achievement Unlocked!', 'First Step: You successfully completed your first habit log!');
    }

    // 2. "3-Day Jumpstart"
    if (currentStreak >= 3 && !updatedBadges.includes('streak_3')) {
      updatedBadges.push('streak_3');
      badgesChanged = true;
      Alert.alert('🌅 Achievement Unlocked!', '3-Day Jumpstart: Unlocked the Sunset Breeze Theme!');
    }

    // 3. "7-Day Consistency"
    if (currentStreak >= 7 && !updatedBadges.includes('streak_7')) {
      updatedBadges.push('streak_7');
      badgesChanged = true;
      Alert.alert('🌿 Achievement Unlocked!', '7-Day Consistency: Unlocked the Forest Glow Theme!');
    }

    // 4. "21-Day Habit Former"
    if (currentStreak >= 21 && !updatedBadges.includes('streak_21')) {
      updatedBadges.push('streak_21');
      badgesChanged = true;
      Alert.alert('🌌 Achievement Unlocked!', '21-Day Habit Former: Unlocked the Midnight Sleek Theme!');
    }

    // Map challenges completion state based on unlocked badges
    const updatedChallenges = challenges.map((challenge) => {
      if (updatedBadges.includes(challenge.unlockedBadgeId) && !challenge.completed) {
        return { ...challenge, completed: true };
      }
      return challenge;
    });

    if (badgesChanged) {
      saveData(STORAGE_KEYS.CHALLENGES, updatedChallenges);
      setChallenges(updatedChallenges);
    }

    return updatedBadges;
  };

  // 1. Add Habit
  const addHabit = async (
    name: string,
    emoji: string,
    timeBlock: 'Morning' | 'Afternoon' | 'Evening',
    targetTime?: string,
    enableReminder = false
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    let reminderId: string | undefined = undefined;

    if (enableReminder && targetTime) {
      reminderId = await scheduleHabitReminder(id, name, emoji, targetTime);
    }

    const newHabit: Habit = {
      id,
      name,
      emoji,
      timeBlock,
      targetTime,
      reminderId,
      createdAt: new Date().toISOString(),
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await saveData(STORAGE_KEYS.HABITS, updatedHabits);
  };

  // 2. Delete Habit
  const deleteHabit = async (id: string) => {
    const habitToDelete = habits.find((h) => h.id === id);
    if (habitToDelete?.reminderId) {
      await cancelHabitReminder(habitToDelete.reminderId);
    }

    const updatedHabits = habits.filter((h) => h.id !== id);
    setHabits(updatedHabits);
    await saveData(STORAGE_KEYS.HABITS, updatedHabits);

    // Clean up logs related to this deleted habit
    const updatedLogs = logs.filter((l) => l.habitId !== id);
    setLogs(updatedLogs);
    await saveData(STORAGE_KEYS.LOGS, updatedLogs);
  };

  // 3. Toggle Habit Complete
  const toggleHabitComplete = async (habitId: string, date: string, note?: string) => {
    const existingLogIdx = logs.findIndex((log) => log.habitId === habitId && log.date === date);
    let updatedLogs = [...logs];

    if (existingLogIdx >= 0) {
      // Toggle off: remove completion log
      updatedLogs.splice(existingLogIdx, 1);
    } else {
      // Add completion log
      const newLog: HabitLog = {
        id: Math.random().toString(36).substring(2, 9),
        habitId,
        date,
        status: 'completed',
        note,
      };
      updatedLogs.push(newLog);
    }

    setLogs(updatedLogs);
    await saveData(STORAGE_KEYS.LOGS, updatedLogs);

    // Calculate updated stats
    const { current, longest } = calculateStreak(updatedLogs);
    const updatedBadges = checkChallengesAndBadges(current, stats.unlockedBadges, updatedLogs);

    const updatedStats = {
      ...stats,
      currentStreak: current,
      longestStreak: longest,
      unlockedBadges: updatedBadges,
    };

    setStats(updatedStats);
    await saveData(STORAGE_KEYS.STATS, updatedStats);
  };

  // 4. Skip Habit (Using Skip Token)
  const skipHabit = async (habitId: string, date: string, note?: string) => {
    if (stats.skipTokensRemaining <= 0) {
      Alert.alert('No Tokens Left', 'You have used all skip tokens for this month.');
      return;
    }

    const existingLogIdx = logs.findIndex((log) => log.habitId === habitId && log.date === date);
    if (existingLogIdx >= 0 && logs[existingLogIdx].status === 'skipped') {
      // If already skipped, toggle off skip: restore skip token and remove log
      let updatedLogs = [...logs];
      updatedLogs.splice(existingLogIdx, 1);
      setLogs(updatedLogs);
      await saveData(STORAGE_KEYS.LOGS, updatedLogs);

      const { current, longest } = calculateStreak(updatedLogs);
      const updatedStats = {
        ...stats,
        skipTokensRemaining: Math.min(stats.skipTokensRemaining + 1, 2),
        currentStreak: current,
        longestStreak: longest,
      };
      setStats(updatedStats);
      await saveData(STORAGE_KEYS.STATS, updatedStats);
      return;
    }

    // Skip: consume token and add skip log
    const newLog: HabitLog = {
      id: Math.random().toString(36).substring(2, 9),
      habitId,
      date,
      status: 'skipped',
      note: note || 'Emergency Skip used',
    };

    let updatedLogs = [...logs];
    if (existingLogIdx >= 0) {
      // Replace completed log with skipped log
      updatedLogs[existingLogIdx] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    setLogs(updatedLogs);
    await saveData(STORAGE_KEYS.LOGS, updatedLogs);

    // Calculate stats (skips preserve streak)
    const { current, longest } = calculateStreak(updatedLogs);
    let updatedBadges = [...stats.unlockedBadges];
    if (!updatedBadges.includes('skip_master')) {
      updatedBadges.push('skip_master');
      Alert.alert('🩺 Achievement Unlocked!', 'Strategic Respite: Used an emergency skip token to save your streak!');
    }

    const updatedStats = {
      ...stats,
      skipTokensRemaining: stats.skipTokensRemaining - 1,
      unlockedBadges: updatedBadges,
      currentStreak: current,
      longestStreak: longest,
    };

    setStats(updatedStats);
    await saveData(STORAGE_KEYS.STATS, updatedStats);
  };

  // 5. Reset All Data
  const resetAllData = async () => {
    // Clear all scheduled notifications first
    for (const habit of habits) {
      if (habit.reminderId) {
        await cancelHabitReminder(habit.reminderId);
      }
    }
    setHabits([]);
    setLogs([]);
    setStats(INITIAL_STATS);
    setChallenges(DEFAULT_CHALLENGES);

    await saveData(STORAGE_KEYS.HABITS, []);
    await saveData(STORAGE_KEYS.LOGS, []);
    await saveData(STORAGE_KEYS.STATS, INITIAL_STATS);
    await saveData(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
  };

  // Helper check: is today completed?
  // Today is completed if:
  // - There is at least 1 habit
  // - Every habit has a log (completed or skipped) for today's date.
  const todayStr = getLocalDateString();
  const todaysLogs = logs.filter((l) => l.date === todayStr);
  const isTodayCompleted =
    habits.length > 0 &&
    habits.every((habit) => todaysLogs.some((log) => log.habitId === habit.id));

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        stats,
        challenges,
        addHabit,
        deleteHabit,
        toggleHabitComplete,
        skipHabit,
        resetAllData,
        isTodayCompleted,
        getLocalDateString,
      }}
    >
      {!loading && children}
    </HabitContext.Provider>
  );
}

export function useHabitContext() {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabitContext must be used within a HabitProvider');
  }
  return context;
}
