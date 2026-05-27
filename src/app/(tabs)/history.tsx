import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useHabitContext, HabitLog, Habit } from '@/context/HabitContext';
import { Spacing } from '@/constants/theme';

export default function HistoryTab() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { stats, logs, habits, getLocalDateString } = useHabitContext();

  // Compute data for the chart (last 7 days)
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
      
      const completionsCount = logs.filter(
        l => l.date === dateStr && l.status === 'completed'
      ).length;
      data.push(completionsCount);
    }

    return {
      labels,
      datasets: [
        {
          data: data.length > 0 && data.some(d => d > 0) ? data : [0, 0, 0, 0, 0, 0, 0],
        }
      ]
    };
  }, [logs, getLocalDateString]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: (HabitLog & { habit: Habit | undefined })[] } = {};
    
    // Process logs and map to habits
    logs.forEach((log) => {
      if (!groups[log.date]) {
        groups[log.date] = [];
      }
      const habit = habits.find((h) => h.id === log.habitId);
      groups[log.date].push({ ...log, habit });
    });

    // Convert to sorted array (newest date first)
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayLogs]) => ({
        date,
        logs: dayLogs,
      }));
  }, [logs, habits]);

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) return 'Today';
    
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return d.toLocaleDateString('en-US', options);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Performance
          </ThemedText>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Ionicons name="flame" size={28} color="#FF6B6B" />
            <ThemedText type="title" style={styles.statNumber}>{stats.currentStreak}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Current Streak</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Ionicons name="trophy" size={28} color="#FFD93D" />
            <ThemedText type="title" style={styles.statNumber}>{stats.longestStreak}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Longest Streak</ThemedText>
          </View>
        </View>

        {/* Performance Graph */}
        <View style={styles.chartSection}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PERFORMANCE (LAST 7 DAYS)
          </ThemedText>
          <View style={[styles.chartWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <LineChart
              data={chartData}
              width={width - Spacing.three * 2 - 2}
              height={220}
              chartConfig={{
                backgroundColor: theme.cardBackground,
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.primary,
                labelColor: (opacity = 1) => theme.textSecondary,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: theme.cardBackground
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero
              yAxisInterval={1}
            />
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACTIVITY FEED
          </ThemedText>

          {groupedLogs.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="time-outline" size={48} color={theme.textSecondary} style={{ marginBottom: 10 }} />
              <ThemedText style={{ color: theme.textSecondary }}>No habit history yet.</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>Complete a habit to see it here!</ThemedText>
            </View>
          ) : (
            groupedLogs.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <ThemedText type="smallBold" style={[styles.dateHeader, { color: theme.text }]}>
                  {formatDate(group.date)}
                </ThemedText>
                <View style={[styles.logsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  {group.logs.map((log, index) => (
                    <View 
                      key={log.id} 
                      style={[
                        styles.logRow, 
                        index < group.logs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }
                      ]}
                    >
                      <View style={styles.logLeft}>
                        <View style={[styles.statusIcon, { backgroundColor: log.status === 'completed' ? theme.success + '20' : theme.warning + '20' }]}>
                          <Ionicons 
                            name={log.status === 'completed' ? "checkmark-circle" : "play-skip-forward"} 
                            size={20} 
                            color={log.status === 'completed' ? theme.success : theme.warning} 
                          />
                        </View>
                        <View style={styles.logTextContainer}>
                          <ThemedText style={styles.habitName}>
                            {log.habit ? `${log.habit.emoji} ${log.habit.name}` : 'Deleted Habit'}
                          </ThemedText>
                          {log.note ? (
                            <ThemedText type="small" style={[styles.logNote, { color: theme.textSecondary }]}>
                              "{log.note}"
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                      <ThemedText type="smallBold" style={{ color: log.status === 'completed' ? theme.success : theme.warning, textTransform: 'capitalize' }}>
                        {log.status}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
        
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 60,
  },
  header: {
    marginTop: 10,
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.five,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 36,
    marginVertical: 4,
  },
  chartSection: {
    marginBottom: Spacing.five,
  },
  chartWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 10,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.three,
    letterSpacing: 0.8,
  },
  emptyState: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  logsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logTextContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  logNote: {
    marginTop: 2,
    fontStyle: 'italic',
  },
});
