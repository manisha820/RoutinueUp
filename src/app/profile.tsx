import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/context/ThemeContext';
import { useHabitContext } from '@/context/HabitContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { colors, themeSelection, setThemeSelection } = useThemeContext();
  const {
    userId,
    userEmail,
    isAnonymous,
    isPremium,
    setPremium,
    signUp,
    logIn,
    logOut,
    upgradeAccount,
    stats,
    resetAllData,
  } = useHabitContext();

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true); // Toggle between SignUp/Link vs LogIn
  const [authLoading, setAuthLoading] = useState(false);

  // Form validator
  const handleAuthAction = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUpMode) {
        if (isAnonymous) {
          // Upgrade current anonymous session
          const { error } = await upgradeAccount(email, password);
          if (error) {
            Alert.alert('Registration Error', error.message);
          } else {
            Alert.alert('Account Created!', 'Your habits and stats are now linked to your email account.');
            setEmail('');
            setPassword('');
          }
        } else {
          // Regular signup
          const { error } = await signUp(email, password);
          if (error) {
            Alert.alert('Registration Error', error.message);
          } else {
            Alert.alert('Success', 'Registered successfully!');
            setEmail('');
            setPassword('');
          }
        }
      } else {
        // Sign in
        const { error } = await logIn(email, password);
        if (error) {
          Alert.alert('Login Error', error.message);
        } else {
          Alert.alert('Welcome Back!', 'Logged in successfully.');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Authentication Failed', 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogOut = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? A new temporary account will be created so you can continue tracking habits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logOut();
            Alert.alert('Logged Out', 'You are now signed in as a Guest.');
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits, logs, stats, and reminders forever. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset Successful', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  // Helper to check theme lock status
  const isThemeUnlocked = (themeName: string) => {
    if (isPremium) return true;
    if (themeName === 'light' || themeName === 'dark') return true;
    if (themeName === 'sunset' && stats.unlockedBadges.includes('streak_3')) return true;
    if (themeName === 'forest' && stats.unlockedBadges.includes('streak_7')) return true;
    if (themeName === 'midnight' && stats.unlockedBadges.includes('streak_21')) return true;
    return false;
  };

  const selectTheme = (themeName: any) => {
    if (themeName === 'system') {
      setThemeSelection('system');
      return;
    }
    if (isThemeUnlocked(themeName)) {
      setThemeSelection(themeName);
    } else {
      let unlockCondition = '';
      if (themeName === 'sunset') unlockCondition = 'Complete a 3-Day habit streak';
      if (themeName === 'forest') unlockCondition = 'Complete a 7-Day habit streak';
      if (themeName === 'midnight') unlockCondition = 'Complete a 21-Day habit streak';

      Alert.alert(
        '🎨 Theme Locked',
        `${unlockCondition} or purchase a Premium plan to unlock this theme.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
          <Ionicons name="person" size={32} color={isPremium ? colors.accent : colors.text} />
        </View>

        <Text style={[styles.userName, { color: colors.text }]}>
          {isAnonymous ? 'Guest Member' : userEmail}
        </Text>
        <Text style={[styles.userSub, { color: colors.textSecondary }]}>
          ID: {userId ? `${userId.substring(0, 15)}...` : 'Unknown'}
        </Text>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: isPremium ? '#F59E0B' : colors.backgroundSelected }]}>
            <Ionicons name={isPremium ? 'star' : 'person-outline'} size={12} color={isPremium ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.badgeText, { color: isPremium ? '#FFF' : colors.textSecondary }]}>
              {isPremium ? 'RoutineUp Premium' : 'Free Tier'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Premium Pricing Section */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={20} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>RoutineUp Premium</Text>
        </View>

        {isPremium ? (
          <View style={styles.premiumSuccessCard}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            <Text style={[styles.premiumTitleText, { color: colors.text }]}>You are a Premium Member!</Text>
            <Text style={[styles.premiumSubText, { color: colors.textSecondary }]}>
              Thank you for supporting RoutineUp! You have unlocked all themes, unlimited skip tokens, and cloud synchronization.
            </Text>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  'Cancel Premium',
                  'Would you like to downgrade back to the Free Tier?',
                  [
                    { text: 'No' },
                    { text: 'Downgrade', onPress: () => setPremium(false) }
                  ]
                );
              }}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Downgrade Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={[styles.featureIntro, { color: colors.textSecondary }]}>
              Supercharge your habits, streaks, and health tracking:
            </Text>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color="#F59E0B" style={styles.featureIcon} />
              <Text style={[styles.featureText, { color: colors.text }]}>Instant access to all premium color themes</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color="#F59E0B" style={styles.featureIcon} />
              <Text style={[styles.featureText, { color: colors.text }]}>Unlimited monthly streak skip tokens</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color="#F59E0B" style={styles.featureIcon} />
              <Text style={[styles.featureText, { color: colors.text }]}>Cloud sync & statistics history backups</Text>
            </View>

            <View style={styles.plansContainer}>
              {/* Monthly */}
              <TouchableOpacity
                style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setPremium(true);
                  Alert.alert('Welcome to Pro!', 'You have successfully subscribed to the Monthly Plan ($2.99/mo).');
                }}
              >
                <Text style={[styles.planPeriod, { color: colors.text }]}>Monthly</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>$2.99</Text>
                <Text style={[styles.planSub, { color: colors.textSecondary }]}>per month</Text>
              </TouchableOpacity>

              {/* Annual */}
              <TouchableOpacity
                style={[styles.planCard, styles.planCardActive, { borderColor: '#F59E0B' }]}
                onPress={() => {
                  setPremium(true);
                  Alert.alert('Welcome to Pro!', 'You have successfully subscribed to the Annual Plan ($19.99/yr).');
                }}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Best Value</Text>
                </View>
                <Text style={[styles.planPeriod, { color: colors.text }]}>Annual</Text>
                <Text style={[styles.planPrice, { color: '#F59E0B' }]}>$19.99</Text>
                <Text style={[styles.planSub, { color: colors.textSecondary }]}>$1.66/month</Text>
              </TouchableOpacity>

              {/* Lifetime */}
              <TouchableOpacity
                style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setPremium(true);
                  Alert.alert('Welcome to Pro!', 'You have successfully unlocked the Lifetime Pass ($29.99 once).');
                }}
              >
                <Text style={[styles.planPeriod, { color: colors.text }]}>Lifetime</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>$29.99</Text>
                <Text style={[styles.planSub, { color: colors.textSecondary }]}>pay once</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 3. Theme Customization */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Themes & Styles</Text>
        </View>

        <Text style={[styles.featureIntro, { color: colors.textSecondary }]}>
          Change your dashboard look. Premium and challenge themes will display a key icon if locked.
        </Text>

        <View style={styles.themeList}>
          {/* System Default */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'system' && { backgroundColor: colors.backgroundSelected }
            ]}
            onPress={() => selectTheme('system')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#8E8E93' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>System Default</Text>
            </View>
            {themeSelection === 'system' && <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />}
          </TouchableOpacity>

          {/* Light */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'light' && { backgroundColor: colors.backgroundSelected }
            ]}
            onPress={() => selectTheme('light')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#4F46E5' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Light Breeze</Text>
            </View>
            {themeSelection === 'light' && <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />}
          </TouchableOpacity>

          {/* Dark */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'dark' && { backgroundColor: colors.backgroundSelected }
            ]}
            onPress={() => selectTheme('dark')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#1E293B' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Dark Slate</Text>
            </View>
            {themeSelection === 'dark' && <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />}
          </TouchableOpacity>

          {/* Sunset Breeze (Challenge 3) */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'sunset' && { backgroundColor: colors.backgroundSelected },
              !isThemeUnlocked('sunset') && styles.themeLockedRow
            ]}
            onPress={() => selectTheme('sunset')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#FF6B6B' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Sunset Breeze (3-Day Streak)</Text>
            </View>
            {themeSelection === 'sunset' ? (
              <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />
            ) : (
              !isThemeUnlocked('sunset') && <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Forest Glow (Challenge 7) */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'forest' && { backgroundColor: colors.backgroundSelected },
              !isThemeUnlocked('forest') && styles.themeLockedRow
            ]}
            onPress={() => selectTheme('forest')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#2ECC71' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Forest Glow (7-Day Streak)</Text>
            </View>
            {themeSelection === 'forest' ? (
              <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />
            ) : (
              !isThemeUnlocked('forest') && <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Midnight Sleek (Challenge 21) */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              themeSelection === 'midnight' && { backgroundColor: colors.backgroundSelected },
              !isThemeUnlocked('midnight') && styles.themeLockedRow
            ]}
            onPress={() => selectTheme('midnight')}
          >
            <View style={styles.themeMeta}>
              <View style={[styles.colorPreview, { backgroundColor: '#6C5CE7' }]} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Midnight Sleek (21-Day Streak)</Text>
            </View>
            {themeSelection === 'midnight' ? (
              <Ionicons name="checkmark-sharp" size={20} color={colors.primary} />
            ) : (
              !isThemeUnlocked('midnight') && <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Authentication / Sync Profile Card */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sync" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isAnonymous ? 'Sync & Backup Account' : 'Account Management'}
          </Text>
        </View>

        {isAnonymous ? (
          <View>
            <Text style={[styles.featureIntro, { color: colors.textSecondary, marginBottom: 16 }]}>
              {isSignUpMode
                ? 'Create a permanent account to sync your habits, completion histories, streaks, and customizations safely to the cloud.'
                : 'Sign in to access your existing habits and profile data saved on Supabase.'}
            </Text>

            {/* Email Field */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password Field */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Password</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            {/* Submit Auth Button */}
            <TouchableOpacity
              style={[styles.authSubmitBtn, { backgroundColor: colors.primary }]}
              onPress={handleAuthAction}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.authSubmitBtnText}>
                  {isSignUpMode ? 'Register & Link Habits' : 'Log In & Load Profile'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Mode */}
            <TouchableOpacity
              style={styles.modeToggleBtn}
              onPress={() => setIsSignUpMode(!isSignUpMode)}
            >
              <Text style={[styles.modeToggleText, { color: colors.primary }]}>
                {isSignUpMode
                  ? 'Already have an account? Sign In'
                  : "New here? Create account and save stats"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loggedInContainer}>
            <Ionicons name="checkmark-shield" size={40} color={colors.accent} />
            <Text style={[styles.loggedInText, { color: colors.text }]}>Cloud Synchronization Active</Text>
            <Text style={[styles.loggedInSub, { color: colors.textSecondary }]}>
              Logged in as <Text style={{ fontWeight: 'bold' }}>{userEmail}</Text>. All your habits and accomplishments are secured in the cloud.
            </Text>

            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: colors.border }]}
              onPress={handleLogOut}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF6B6B" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Log Out Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 5. Danger Zone */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginBottom: 50 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trash-bin-outline" size={20} color="#FF6B6B" />
          <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>Danger Zone</Text>
        </View>

        <Text style={[styles.featureIntro, { color: colors.textSecondary }]}>
          Perform diagnostic maintenance or permanently delete your local workspace data.
        </Text>

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={handleResetData}
        >
          <Text style={styles.dangerBtnText}>Reset Workspace Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureIntro: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  planCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planCardActive: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planSub: {
    fontSize: 9,
  },
  premiumSuccessCard: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  premiumTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  premiumSubText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  cancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeList: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  themeLockedRow: {
    opacity: 0.6,
  },
  themeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  authSubmitBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  authSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeToggleBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loggedInContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loggedInText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  loggedInSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  logoutBtnText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dangerBtn: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dangerBtnText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
