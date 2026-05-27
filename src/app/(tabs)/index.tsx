import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useHabitContext, Habit } from '@/context/HabitContext';
import { ProgressBar } from '@/components/ProgressBar';
import { HabitCard } from '@/components/HabitCard';
import { HabitNotesModal } from '@/components/HabitNotesModal';
import { Celebration } from '@/components/Celebration';
import { Spacing } from '@/constants/theme';

export default function TodayDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const {
    habits,
    logs,
    stats,
    toggleHabitComplete,
    skipHabit,
    isTodayCompleted,
    getLocalDateString,
  } = useHabitContext();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(false);

  const todayStr = getLocalDateString();
  const todaysLogs = logs.filter((l) => l.date === todayStr);

  // Monitor completions to trigger celebration
  useEffect(() => {
    if (isTodayCompleted && !prevCompleted) {
      setShowCelebration(true);
    }
    setPrevCompleted(isTodayCompleted);
  }, [isTodayCompleted]);

  // Group habits by time blocks
  const morningHabits = habits.filter((h) => h.timeBlock === 'Morning');
  const afternoonHabits = habits.filter((h) => h.timeBlock === 'Afternoon');
  const eveningHabits = habits.filter((h) => h.timeBlock === 'Evening');

  const completedCount = habits.filter((h) =>
    todaysLogs.some((l) => l.habitId === h.id)
  ).length;

  const handleToggleHabit = (habit: Habit) => {
    const isCompleted = todaysLogs.some((l) => l.habitId === habit.id && l.status === 'completed');
    if (!isCompleted) {
      // Prompt for note modal upon checking in
      setSelectedHabit(habit);
      setNoteModalVisible(true);
    } else {
      // Uncheck habit directly
      toggleHabitComplete(habit.id, todayStr);
    }
  };

  const handleNoteSubmit = (note: string) => {
    if (selectedHabit) {
      toggleHabitComplete(selectedHabit.id, todayStr, note);
      setNoteModalVisible(false);
      setSelectedHabit(null);
    }
  };

  const renderSection = (title: string, icon: string, habitsList: Habit[]) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={18} color={theme.primary} />
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
            {title} Routines ({habitsList.length})
          </ThemedText>
        </View>

        {habitsList.length === 0 ? (
          <ThemedView
            style={[
              styles.emptySection,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              No habits scheduled.
            </ThemedText>
          </ThemedView>
        ) : (
          habitsList.map((habit) => {
            const log = todaysLogs.find((l) => l.habitId === habit.id);
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                log={log}
                onToggle={() => handleToggleHabit(habit)}
                onSkip={() => skipHabit(habit.id, todayStr)}
                skipTokens={stats.skipTokensRemaining}
                onPressDetails={() =>
                  router.push({
                    pathname: '/habit/[id]',
                    params: { id: habit.id },
                  })
                }
              />
            );
          })
        )}
      </View>
    );
  };

  // Get current date string formatted nicely
  const getHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary, textTransform: 'uppercase' }}>
              {getHeaderDate()}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              My Habits
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.createIconBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/create')}
          >
            <Ionicons name="add" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar Card */}
        <ProgressBar
          completedCount={completedCount}
          totalCount={habits.length}
          currentStreak={stats.currentStreak}
        />

        {/* Time Blocks Routines */}
        {renderSection('Morning', 'sunny-outline', morningHabits)}
        {renderSection('Afternoon', 'partly-sunny-outline', afternoonHabits)}
        {renderSection('Evening', 'moon-outline', eveningHabits)}
      </ScrollView>

      {/* Habit Reflection Input Modal */}
      {selectedHabit && (
        <HabitNotesModal
          visible={noteModalVisible}
          habitName={selectedHabit.name}
          habitEmoji={selectedHabit.emoji}
          onClose={() => {
            setNoteModalVisible(false);
            setSelectedHabit(null);
          }}
          onSubmit={handleNoteSubmit}
        />
      )}

      {/* Celebration Confetti */}
      <Celebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 28,
  },
  createIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptySection: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
