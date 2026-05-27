import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useThemeContext, UserThemeSelection } from '@/context/ThemeContext';
import { useHabitContext } from '@/context/HabitContext';
import { Spacing } from '@/constants/theme';

// Badge Config
const BADGES = [
  { id: 'first_habit', name: 'First Step', icon: 'flag', desc: 'Log your first completed habit', color: '#4F46E5' },
  { id: 'streak_3', name: '3-Day Momentum', icon: 'flame', desc: 'Reach a 3-day streak', color: '#FF6B6B' },
  { id: 'streak_7', name: '7-Day Builder', icon: 'flash', desc: 'Reach a 7-day streak', color: '#2ECC71' },
  { id: 'streak_21', name: '21-Day Master', icon: 'ribbon', desc: 'Reach a 21-day streak', color: '#6C5CE7' },
  { id: 'skip_master', name: 'Tactical Rest', icon: 'shield', desc: 'Use an Emergency Skip Token', color: '#F1C40F' },
];

// Theme Selectors Config
const THEME_SELECTIONS = [
  { id: 'system', name: 'System Default', icon: 'settings-outline', badgeRequired: null, preview: ['#FFFFFF', '#0F172A'] },
  { id: 'light', name: 'Light Mode', icon: 'sunny-outline', badgeRequired: null, preview: ['#FFFFFF', '#F8F9FC'] },
  { id: 'dark', name: 'Dark Mode', icon: 'moon-outline', badgeRequired: null, preview: ['#0F172A', '#1E293B'] },
  { id: 'sunset', name: 'Sunset Breeze', icon: 'color-palette-outline', badgeRequired: 'streak_3', preview: ['#2D161A', '#FF6B6B'] },
  { id: 'forest', name: 'Forest Glow', icon: 'leaf-outline', badgeRequired: 'streak_7', preview: ['#0F1E16', '#2ECC71'] },
  { id: 'midnight', name: 'Midnight Sleek', icon: 'sparkles-outline', badgeRequired: 'streak_21', preview: ['#090A0F', '#6C5CE7'] },
];

export default function ChallengesVault() {
  const theme = useTheme();
  const { themeSelection, setThemeSelection } = useThemeContext();
  const { stats, challenges } = useHabitContext();

  const handleSelectTheme = (themeId: UserThemeSelection, badgeRequired: string | null) => {
    if (badgeRequired && !stats.unlockedBadges.includes(badgeRequired)) {
      const badgeName = BADGES.find((b) => b.id === badgeRequired)?.name || 'streak';
      Alert.alert(
        'Theme Locked',
        `To unlock this premium theme, you need to unlock the "${badgeName}" badge by completing challenges.`
      );
      return;
    }
    setThemeSelection(themeId);
    Alert.alert('Theme Changed', `Swapped style theme to: ${themeId.toUpperCase()}`);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Streak Overview Card */}
        <ThemedView style={[styles.streakCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>CURRENT STREAK</ThemedText>
              <ThemedText type="subtitle" style={styles.streakValue}>{stats.currentStreak} Days</ThemedText>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakFooter}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Longest Streak: <ThemedText type="smallBold" style={{ color: theme.text }}>{stats.longestStreak} days</ThemedText>
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Skip Tokens: <ThemedText type="smallBold" style={{ color: theme.text }}>{stats.skipTokensRemaining}/2</ThemedText>
            </ThemedText>
          </View>
        </ThemedView>

        {/* Challenges Progress */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CONSISTENCY CHALLENGES
          </ThemedText>
          {challenges.map((challenge) => {
            const target = challenge.durationDays;
            const current = Math.min(stats.currentStreak, target);
            const progress = target > 0 ? current / target : 0;
            const isCompleted = challenge.completed;

            return (
              <ThemedView
                key={challenge.id}
                style={[styles.challengeItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              >
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeMeta}>
                    <ThemedText type="smallBold" style={styles.challengeName}>
                      {challenge.name}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.challengeDesc, { color: theme.textSecondary }]}>
                      {challenge.description}
                    </ThemedText>
                  </View>
                  <View style={[styles.challengeIconContainer, isCompleted && { backgroundColor: theme.primary }]}>
                    <Ionicons
                      name={isCompleted ? 'trophy' : 'trophy-outline'}
                      size={20}
                      color={isCompleted ? '#FFFFFF' : theme.textSecondary}
                    />
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.challengeProgressRow}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.background }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: isCompleted ? theme.primary : '#FF6B6B',
                          width: `${progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText type="smallBold" style={styles.progressText}>
                    {current}/{target}d
                  </ThemedText>
                </View>
              </ThemedView>
            );
          })}
        </View>

        {/* Trophy Badges Grid */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            TROPHY VAULT
          </ThemedText>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => {
              const isUnlocked = stats.unlockedBadges.includes(badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert(badge.name, badge.desc + (isUnlocked ? ' (UNLOCKED)' : ' (LOCKED)'))}
                  style={[
                    styles.badgeCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    !isUnlocked && styles.lockedBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIcon,
                      { backgroundColor: isUnlocked ? badge.color : theme.background },
                    ]}
                  >
                    <Ionicons
                      name={isUnlocked ? (badge.icon as any) : 'lock-closed'}
                      size={24}
                      color={isUnlocked ? '#FFFFFF' : theme.textSecondary}
                    />
                  </View>
                  <ThemedText type="smallBold" style={styles.badgeNameText}>
                    {badge.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Themes Settings */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            VISUAL STYLING THEMES
          </ThemedText>
          <View style={styles.themesGrid}>
            {THEME_SELECTIONS.map((selection) => {
              const isSelected = themeSelection === selection.id;
              const isLocked = selection.badgeRequired ? !stats.unlockedBadges.includes(selection.badgeRequired) : false;

              return (
                <TouchableOpacity
                  key={selection.id}
                  activeOpacity={0.85}
                  style={[
                    styles.themeItem,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, borderWidth: 2 },
                    isLocked && styles.lockedTheme,
                  ]}
                  onPress={() => handleSelectTheme(selection.id as UserThemeSelection, selection.badgeRequired)}
                >
                  <View style={styles.themeHeader}>
                    <Ionicons name={selection.icon as any} size={20} color={isSelected ? theme.primary : theme.text} />
                    {isLocked && <Ionicons name="lock-closed" size={14} color={theme.textSecondary} />}
                  </View>
                  <ThemedText type="smallBold" style={styles.themeName}>
                    {selection.name}
                  </ThemedText>

                  {/* Colors Preview */}
                  <View style={styles.previewContainer}>
                    {selection.preview.map((c, idx) => (
                      <View key={idx} style={[styles.previewColor, { backgroundColor: c }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  streakCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: Spacing.three,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  streakDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginVertical: 12,
  },
  streakFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    letterSpacing: 0.8,
  },
  challengeItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  challengeMeta: {
    flex: 1,
    paddingRight: 8,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 12,
  },
  challengeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeNameText: {
    fontSize: 13,
    textAlign: 'center',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeItem: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  lockedTheme: {
    opacity: 0.5,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 13,
    marginBottom: 8,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  previewColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
});
