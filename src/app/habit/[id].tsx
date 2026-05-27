import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useHabitContext } from '@/context/HabitContext';
import { Spacing } from '@/constants/theme';

export default function HabitDetails() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, logs, deleteHabit } = useHabitContext();

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <ThemedView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
        <ThemedText style={{ marginTop: 10 }}>Habit not found.</ThemedText>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => router.replace('/')}>
          <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Back to Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Filter logs for this specific habit
  const habitLogs = logs
    .filter((l) => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort newest logs first

  const totalCompletions = habitLogs.filter((l) => l.status === 'completed').length;
  const totalSkips = habitLogs.filter((l) => l.status === 'skipped').length;

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action is permanent and will delete all completion history and reminders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            Alert.alert('Deleted', 'Habit was deleted.', [
              { text: 'OK', onPress: () => router.replace('/') },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habit Card Header */}
        <ThemedView style={[styles.detailsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.emojiContainer, { backgroundColor: theme.background }]}>
              <ThemedText style={styles.emojiText}>{habit.emoji}</ThemedText>
            </View>
            <View style={styles.cardMeta}>
              <ThemedText type="subtitle" style={styles.habitName}>
                {habit.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Routine: <ThemedText type="smallBold" style={{ color: theme.text }}>{habit.timeBlock}</ThemedText>
              </ThemedText>
            </View>
          </View>

          {habit.targetTime && (
            <View style={[styles.reminderRow, { backgroundColor: theme.background }]}>
              <Ionicons name="notifications-outline" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Reminder scheduled at <ThemedText type="smallBold" style={{ color: theme.text }}>{habit.targetTime}</ThemedText>
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>COMPLETED</ThemedText>
            <ThemedText type="subtitle" style={styles.statNumber}>{totalCompletions}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>times logged</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>SKIPPED</ThemedText>
            <ThemedText type="subtitle" style={styles.statNumber}>{totalSkips}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>tokens used</ThemedText>
          </ThemedView>
        </View>

        {/* Journal Logs History */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            LOGS & REFLECTIONS JOURNAL
          </ThemedText>

          {habitLogs.length === 0 ? (
            <ThemedView style={[styles.emptyJournal, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.emptyText, { color: theme.textSecondary }]}>
                No completion notes yet. Check off this habit on the dashboard to record your first note!
              </ThemedText>
            </ThemedView>
          ) : (
            habitLogs.map((log) => (
              <ThemedView
                key={log.id}
                style={[
                  styles.logItem,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  log.status === 'skipped' && styles.skippedLog,
                ]}
              >
                <View style={styles.logHeader}>
                  <ThemedText type="smallBold" style={styles.logDate}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </ThemedText>
                  <View style={styles.logStatusBadge}>
                    <Ionicons
                      name={log.status === 'completed' ? 'checkmark-circle' : 'shield'}
                      size={14}
                      color={log.status === 'completed' ? theme.primary : theme.textSecondary}
                    />
                    <ThemedText
                      type="smallBold"
                      style={{
                        fontSize: 11,
                        color: log.status === 'completed' ? theme.primary : theme.textSecondary,
                      }}
                    >
                      {log.status.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                {log.note ? (
                  <View style={[styles.noteWrapper, { backgroundColor: theme.background }]}>
                    <ThemedText type="small" style={styles.noteContent}>
                      "{log.note}"
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                    No reflection notes written.
                  </ThemedText>
                )}
              </ThemedView>
            ))
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.8} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          <ThemedText type="smallBold" style={{ color: '#FF6B6B' }}>
            Delete Habit
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 40,
  },
  detailsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 32,
  },
  cardMeta: {
    flex: 1,
  },
  habitName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.four,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    letterSpacing: 0.8,
  },
  emptyJournal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  logItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  skippedLog: {
    opacity: 0.8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
  },
  logStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteWrapper: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    gap: 8,
    marginTop: 10,
  },
});
