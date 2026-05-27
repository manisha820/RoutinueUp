import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
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
  unlockedBadges: string[]; // List of Badge IDs
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

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: 'challenge_3', name: '3-Day Jumpstart', durationDays: 3, description: 'Complete any habit for 3 consecutive days to build initial momentum. Unlocks Sunset Breeze Theme.', completed: false, unlockedBadgeId: 'streak_3' },
  { id: 'challenge_7', name: '7-Day Consistency', durationDays: 7, description: 'Keep your streak going for a full week. Unlocks Forest Glow Theme.', completed: false, unlockedBadgeId: 'streak_7' },
  { id: 'challenge_21', name: '21-Day Habit Former', durationDays: 21, description: 'Complete habits for 21 consecutive days to wire them into your routine. Unlocks Midnight Sleek Theme.', completed: false, unlockedBadgeId: 'streak_21' },
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
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSupabase() {
      const { data: { session } } = await supabase.auth.getSession();
      let currentUser = session?.user?.id;

      if (!currentUser) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Auth error:", error);
          setLoading(false);
          return;
        }
        currentUser = data.user?.id;
      }

      if (currentUser) {
        setUserId(currentUser);
        await fetchAllData(currentUser);
      }
      setLoading(false);
    }
    initSupabase();
  }, []);

  async function fetchAllData(uid: string) {
    try {
      const { data: hData } = await supabase.from('habits').select('*').eq('user_id', uid);
      const mappedHabits = (hData || []).map(h => ({
        id: h.id, name: h.name, emoji: h.emoji, timeBlock: h.time_block,
        targetTime: h.target_time, reminderId: h.reminder_id, createdAt: h.created_at,
      }));
      setHabits(mappedHabits);

      const { data: lData } = await supabase.from('habit_logs').select('*').eq('user_id', uid);
      const mappedLogs = (lData || []).map(l => ({
        id: l.id, habitId: l.habit_id, date: l.date, status: l.status, note: l.note,
      }));
      setLogs(mappedLogs);

      const { data: sData } = await supabase.from('user_stats').select('*').eq('user_id', uid).single();
      let currentStats = INITIAL_STATS;
      if (sData) {
        currentStats = {
          skipTokensRemaining: sData.skip_tokens_remaining,
          lastTokenRefreshedMonth: sData.last_token_refreshed_month,
          currentStreak: sData.current_streak,
          longestStreak: sData.longest_streak,
          unlockedBadges: sData.unlocked_badges || [],
        };
      } else {
        await supabase.from('user_stats').insert({
          user_id: uid, skip_tokens_remaining: INITIAL_STATS.skipTokensRemaining,
          last_token_refreshed_month: INITIAL_STATS.lastTokenRefreshedMonth,
          current_streak: INITIAL_STATS.currentStreak, longest_streak: INITIAL_STATS.longestStreak,
          unlocked_badges: INITIAL_STATS.unlockedBadges,
        });
      }
      
      const refreshedStats = await checkAndRefreshTokens(currentStats, uid);
      setStats(refreshedStats);

      const { data: cData } = await supabase.from('user_challenges').select('*').eq('user_id', uid);
      const completedChallengeIds = (cData || []).filter(c => c.completed).map(c => c.challenge_id);
      
      const mappedChallenges = DEFAULT_CHALLENGES.map(c => ({
        ...c, completed: completedChallengeIds.includes(c.id),
      }));
      setChallenges(mappedChallenges);

    } catch (err) {
      console.error('Fetch error', err);
    }
  }

  async function checkAndRefreshTokens(currentStats: UserStats, uid: string): Promise<UserStats> {
    const now = new Date();
    const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (currentStats.lastTokenRefreshedMonth !== currentMonthString) {
      const newStats = { ...currentStats, skipTokensRemaining: 2, lastTokenRefreshedMonth: currentMonthString };
      await supabase.from('user_stats').update({
        skip_tokens_remaining: 2, last_token_refreshed_month: currentMonthString,
      }).eq('user_id', uid);
      return newStats;
    }
    return currentStats;
  }

  const calculateStreak = (allLogs: HabitLog[]): { current: number; longest: number } => {
    if (allLogs.length === 0) return { current: 0, longest: 0 };
    const activeDates = Array.from(new Set(allLogs.map((log) => log.date))).sort((a, b) => b.localeCompare(a));
    if (activeDates.length === 0) return { current: 0, longest: 0 };

    const todayStr = getLocalDateString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const hasToday = activeDates.includes(todayStr);
    const hasYesterday = activeDates.includes(yesterdayStr);

    if (!hasToday && !hasYesterday) return { current: 0, longest: stats.longestStreak };

    let currentStreak = 0; let tempStreak = 0; let longestStreak = stats.longestStreak;
    let checkDate = hasToday ? new Date() : yesterday;

    while (true) {
      const dateStr = getLocalDateString(checkDate);
      if (activeDates.includes(dateStr)) {
        tempStreak++; checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    currentStreak = tempStreak;

    const ascDates = [...activeDates].reverse();
    let maxStreak = 0; let runningStreak = 0; let prevDate: Date | null = null;
    for (const dStr of ascDates) {
      const currentDate = new Date(dStr);
      if (!prevDate) runningStreak = 1;
      else {
        const diffDays = Math.ceil(Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) runningStreak++;
        else if (diffDays > 1) runningStreak = 1;
      }
      if (runningStreak > maxStreak) maxStreak = runningStreak;
      prevDate = currentDate;
    }
    longestStreak = Math.max(maxStreak, longestStreak);
    return { current: currentStreak, longest: longestStreak };
  };

  const updateSupabaseStats = async (newStats: UserStats, updatedBadges: string[]) => {
    if (!userId) return;
    await supabase.from('user_stats').update({
      current_streak: newStats.currentStreak,
      longest_streak: newStats.longestStreak,
      skip_tokens_remaining: newStats.skipTokensRemaining,
      unlocked_badges: updatedBadges,
    }).eq('user_id', userId);
  };

  const checkChallengesAndBadges = async (currentStreak: number, unlockedBadges: string[], allLogs: HabitLog[]) => {
    let updatedBadges = [...unlockedBadges];
    let badgesChanged = false;

    if (!updatedBadges.includes('first_habit') && allLogs.some((l) => l.status === 'completed')) {
      updatedBadges.push('first_habit'); badgesChanged = true;
      Alert.alert('🏆 Achievement Unlocked!', 'First Step: You successfully completed your first habit log!');
    }
    if (currentStreak >= 3 && !updatedBadges.includes('streak_3')) {
      updatedBadges.push('streak_3'); badgesChanged = true;
      Alert.alert('🌅 Achievement Unlocked!', '3-Day Jumpstart: Unlocked the Sunset Breeze Theme!');
    }
    if (currentStreak >= 7 && !updatedBadges.includes('streak_7')) {
      updatedBadges.push('streak_7'); badgesChanged = true;
      Alert.alert('🌿 Achievement Unlocked!', '7-Day Consistency: Unlocked the Forest Glow Theme!');
    }
    if (currentStreak >= 21 && !updatedBadges.includes('streak_21')) {
      updatedBadges.push('streak_21'); badgesChanged = true;
      Alert.alert('🌌 Achievement Unlocked!', '21-Day Habit Former: Unlocked the Midnight Sleek Theme!');
    }

    const updatedChallenges = challenges.map((challenge) => {
      if (updatedBadges.includes(challenge.unlockedBadgeId) && !challenge.completed) {
        if (userId) {
          supabase.from('user_challenges').upsert({ user_id: userId, challenge_id: challenge.id, completed: true }).then();
        }
        return { ...challenge, completed: true };
      }
      return challenge;
    });

    if (badgesChanged) {
      setChallenges(updatedChallenges);
    }
    return updatedBadges;
  };

  const addHabit = async (name: string, emoji: string, timeBlock: 'Morning' | 'Afternoon' | 'Evening', targetTime?: string, enableReminder = false) => {
    if (!userId) return;
    const id = Math.random().toString(36).substring(2, 9);
    let reminderId: string | undefined = undefined;

    if (enableReminder && targetTime) {
      reminderId = await scheduleHabitReminder(id, name, emoji, targetTime);
    }

    const newHabit: Habit = { id, name, emoji, timeBlock, targetTime, reminderId, createdAt: new Date().toISOString() };
    setHabits([...habits, newHabit]);

    await supabase.from('habits').insert({
      id, user_id: userId, name, emoji, time_block: timeBlock, target_time: targetTime, reminder_id: reminderId, created_at: newHabit.createdAt
    });
  };

  const deleteHabit = async (id: string) => {
    if (!userId) return;
    const habitToDelete = habits.find((h) => h.id === id);
    if (habitToDelete?.reminderId) await cancelHabitReminder(habitToDelete.reminderId);

    setHabits(habits.filter((h) => h.id !== id));
    setLogs(logs.filter((l) => l.habitId !== id));

    await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
  };

  const toggleHabitComplete = async (habitId: string, date: string, note?: string) => {
    if (!userId) return;
    const existingLogIdx = logs.findIndex((log) => log.habitId === habitId && log.date === date);
    let updatedLogs = [...logs];

    if (existingLogIdx >= 0) {
      const logId = updatedLogs[existingLogIdx].id;
      updatedLogs.splice(existingLogIdx, 1);
      await supabase.from('habit_logs').delete().eq('id', logId).eq('user_id', userId);
    } else {
      const id = Math.random().toString(36).substring(2, 9);
      const newLog: HabitLog = { id, habitId, date, status: 'completed', note };
      updatedLogs.push(newLog);
      await supabase.from('habit_logs').insert({
        id, user_id: userId, habit_id: habitId, date, status: 'completed', note
      });
    }

    setLogs(updatedLogs);
    const { current, longest } = calculateStreak(updatedLogs);
    const updatedBadges = await checkChallengesAndBadges(current, stats.unlockedBadges, updatedLogs);

    const updatedStats = { ...stats, currentStreak: current, longestStreak: longest, unlockedBadges: updatedBadges };
    setStats(updatedStats);
    await updateSupabaseStats(updatedStats, updatedBadges);
  };

  const skipHabit = async (habitId: string, date: string, note?: string) => {
    if (!userId) return;
    if (stats.skipTokensRemaining <= 0) {
      Alert.alert('No Tokens Left', 'You have used all skip tokens for this month.');
      return;
    }

    const existingLogIdx = logs.findIndex((log) => log.habitId === habitId && log.date === date);
    if (existingLogIdx >= 0 && logs[existingLogIdx].status === 'skipped') {
      const logId = logs[existingLogIdx].id;
      let updatedLogs = [...logs]; updatedLogs.splice(existingLogIdx, 1);
      setLogs(updatedLogs);
      await supabase.from('habit_logs').delete().eq('id', logId).eq('user_id', userId);

      const { current, longest } = calculateStreak(updatedLogs);
      const updatedStats = { ...stats, skipTokensRemaining: Math.min(stats.skipTokensRemaining + 1, 2), currentStreak: current, longestStreak: longest };
      setStats(updatedStats);
      await updateSupabaseStats(updatedStats, stats.unlockedBadges);
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newLog: HabitLog = { id, habitId, date, status: 'skipped', note: note || 'Emergency Skip used' };
    let updatedLogs = [...logs];

    if (existingLogIdx >= 0) {
      const oldId = updatedLogs[existingLogIdx].id;
      updatedLogs[existingLogIdx] = newLog;
      await supabase.from('habit_logs').update({ status: 'skipped', note: newLog.note }).eq('id', oldId).eq('user_id', userId);
    } else {
      updatedLogs.push(newLog);
      await supabase.from('habit_logs').insert({ id, user_id: userId, habit_id: habitId, date, status: 'skipped', note: newLog.note });
    }

    setLogs(updatedLogs);
    const { current, longest } = calculateStreak(updatedLogs);
    let updatedBadges = [...stats.unlockedBadges];
    if (!updatedBadges.includes('skip_master')) {
      updatedBadges.push('skip_master');
      Alert.alert('🩺 Achievement Unlocked!', 'Strategic Respite: Used an emergency skip token to save your streak!');
    }

    const updatedStats = { ...stats, skipTokensRemaining: stats.skipTokensRemaining - 1, unlockedBadges: updatedBadges, currentStreak: current, longestStreak: longest };
    setStats(updatedStats);
    await updateSupabaseStats(updatedStats, updatedBadges);
  };

  const resetAllData = async () => {
    if (!userId) return;
    for (const habit of habits) {
      if (habit.reminderId) await cancelHabitReminder(habit.reminderId);
    }
    setHabits([]); setLogs([]); setStats(INITIAL_STATS); setChallenges(DEFAULT_CHALLENGES);

    await supabase.from('habits').delete().eq('user_id', userId);
    await supabase.from('user_stats').update({
      skip_tokens_remaining: INITIAL_STATS.skipTokensRemaining, current_streak: 0, longest_streak: 0, unlocked_badges: []
    }).eq('user_id', userId);
    await supabase.from('user_challenges').delete().eq('user_id', userId);
  };

  const todayStr = getLocalDateString();
  const todaysLogs = logs.filter((l) => l.date === todayStr);
  const isTodayCompleted = habits.length > 0 && habits.every((habit) => todaysLogs.some((log) => log.habitId === habit.id));

  return (
    <HabitContext.Provider value={{
      habits, logs, stats, challenges, addHabit, deleteHabit, toggleHabitComplete, skipHabit, resetAllData, isTodayCompleted, getLocalDateString
    }}>
      {!loading && children}
    </HabitContext.Provider>
  );
}

export function useHabitContext() {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabitContext must be used within a HabitProvider');
  return context;
}
