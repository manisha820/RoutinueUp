import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Habit, HabitLog } from '@/context/HabitContext';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onToggle: () => void;
  onSkip: () => void;
  skipTokens: number;
  onPressDetails?: () => void;
}

export function HabitCard({
  habit,
  log,
  onToggle,
  onSkip,
  skipTokens,
  onPressDetails,
}: HabitCardProps) {
  const theme = useTheme();

  const isCompleted = log?.status === 'completed';
  const isSkipped = log?.status === 'skipped';

  const handleToggle = () => {
    Haptics.notificationAsync(
      isCompleted
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    onToggle();
  };

  const handleSkipPress = () => {
    if (!isSkipped && skipTokens <= 0) {
      Alert.alert(
        'No Skip Tokens',
        'You have used all 2 skip tokens for this month. Try to finish this habit if you can!'
      );
      return;
    }

    const message = isSkipped
      ? 'Do you want to reclaim your skip token and mark this habit as incomplete?'
      : `Use an Emergency Skip Token? You have ${skipTokens} remaining. This preserves your daily streak.`;

    Alert.alert(
      isSkipped ? 'Undo Skip' : 'Use Skip Token',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSkipped ? 'Reclaim Token' : 'Use Token',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSkip();
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPressDetails}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          borderWidth: 1,
        },
        isCompleted && styles.completedCard,
        isSkipped && styles.skippedCard,
      ]}
    >
      <View style={styles.leftSection}>
        {/* Toggle Circle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggle}
          style={[
            styles.checkCircle,
            { borderColor: theme.border },
            isCompleted && {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
            isSkipped && {
              backgroundColor: theme.textSecondary,
              borderColor: theme.textSecondary,
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          {isSkipped && <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Emoji Badge */}
        <View style={[styles.emojiContainer, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.emojiText}>{habit.emoji}</ThemedText>
        </View>

        {/* Habit Meta */}
        <View style={styles.habitMeta}>
          <ThemedText
            type="smallBold"
            style={[
              styles.habitName,
              isCompleted && {
                textDecorationLine: 'line-through',
                color: theme.textSecondary,
              },
              isSkipped && { color: theme.textSecondary },
            ]}
          >
            {habit.name}
          </ThemedText>

          {/* Target Time */}
          {habit.targetTime && !isSkipped && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.timeText, { color: theme.textSecondary }]}>
                {habit.targetTime}
              </ThemedText>
            </View>
          )}

          {/* Skipping Info */}
          {isSkipped && (
            <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
              Skipped today (streak safe)
            </ThemedText>
          )}

          {/* Micro-Journal Note */}
          {isCompleted && log?.note ? (
            <View style={[styles.noteContainer, { backgroundColor: theme.background }]}>
              <ThemedText type="small" style={[styles.noteText, { color: theme.textSecondary }]}>
                💬 "{log.note}"
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right Action Section */}
      <View style={styles.rightSection}>
        {!isCompleted && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkipPress}
            style={[
              styles.skipButton,
              { borderColor: isSkipped ? theme.textSecondary : theme.border },
              isSkipped && { backgroundColor: 'transparent' },
            ]}
          >
            <Ionicons
              name={isSkipped ? 'shield' : 'shield-outline'}
              size={14}
              color={isSkipped ? theme.textSecondary : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={[
                styles.skipButtonText,
                { color: isSkipped ? theme.textSecondary : theme.textSecondary },
              ]}
            >
              {isSkipped ? 'Skipped' : 'Skip'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  completedCard: {
    opacity: 0.85,
  },
  skippedCard: {
    opacity: 0.8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 20,
  },
  habitMeta: {
    flex: 1,
    paddingRight: 8,
  },
  habitName: {
    fontSize: 16,
    marginBottom: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
  },
  noteContainer: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  skipButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
