import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  currentStreak: number;
}

export function ProgressBar({ completedCount, totalCount, currentStreak }: ProgressBarProps) {
  const theme = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const percent = totalCount > 0 ? completedCount / totalCount : 0;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 350,
      useNativeDriver: false, // width cannot be animated using native driver, which is fine for small layout animations
    }).start();
  }, [percent]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const formattedPercent = Math.round(percent * 100);

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            TODAY'S PROGRESS
          </ThemedText>
          <ThemedText type="subtitle" style={styles.progressText}>
            {completedCount} of {totalCount} Done
          </ThemedText>
        </View>
        <View style={styles.streakBadge}>
          <ThemedText style={styles.streakText}>
            🔥 {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.barBackground, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: theme.primary,
              width: widthInterpolate,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {totalCount === 0
            ? "Create a habit to get started!"
            : formattedPercent === 100
            ? "🎉 All habits complete! Fantastic job!"
            : `${formattedPercent}% completed today. Keep going!`}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginVertical: Spacing.two,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  barBackground: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  footer: {
    marginTop: 10,
  },
});
