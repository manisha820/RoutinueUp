import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useHabitContext } from '@/context/HabitContext';
import { Spacing } from '@/constants/theme';

// Quick Templates Data
const TEMPLATES = [
  { name: 'Exercise', emoji: '🏋️‍♂️', timeBlock: 'Afternoon' as const, time: '17:00' },
  { name: 'Wake Up Early', emoji: '⏰', timeBlock: 'Morning' as const, time: '06:30' },
  { name: 'Drink Water', emoji: '💧', timeBlock: 'Morning' as const, time: '08:00' },
  { name: 'Read Books', emoji: '📚', timeBlock: 'Evening' as const, time: '21:00' },
  { name: 'Meditation', emoji: '🧘', timeBlock: 'Morning' as const, time: '07:00' },
  { name: 'Sleep Early', emoji: '😴', timeBlock: 'Evening' as const, time: '22:30' },
];

const EMOJIS = ['🏋️‍♂️', '💧', '📚', '🧘', '😴', '⏰', '🍎', '🦷', '🚶', '🌱', '✍️', '🧹', '🍵', '💻', '🎨', '🎹', '🚴', '🥑', '💊', '🔋'];

export default function CreateHabit() {
  const theme = useTheme();
  const router = useRouter();
  const { addHabit } = useHabitContext();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏋️‍♂️');
  const [timeBlock, setTimeBlock] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  
  // Custom Inline Time Selector State
  const [enableReminder, setEnableReminder] = useState(false);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

  const handleApplyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setName(tpl.name);
    setSelectedEmoji(tpl.emoji);
    setTimeBlock(tpl.timeBlock);
    
    // Parse time
    const [h24, m] = tpl.time.split(':');
    const h24Num = parseInt(h24, 10);
    const mNum = parseInt(m, 10);
    
    const h12 = h24Num % 12 === 0 ? 12 : h24Num % 12;
    const period = h24Num >= 12 ? 'PM' : 'AM';
    
    setHour(String(h12).padStart(2, '0'));
    setMinute(String(mNum).padStart(2, '0'));
    setAmPm(period);
    setEnableReminder(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a habit name.');
      return;
    }

    let targetTime: string | undefined = undefined;
    if (enableReminder) {
      let h24 = parseInt(hour, 10);
      if (amPm === 'PM' && h24 !== 12) h24 += 12;
      if (amPm === 'AM' && h24 === 12) h24 = 0;
      targetTime = `${String(h24).padStart(2, '0')}:${minute}`;
    }

    try {
      await addHabit(
        name.trim(),
        selectedEmoji,
        timeBlock,
        targetTime,
        enableReminder
      );
      
      // Clean form and redirect
      setName('');
      setSelectedEmoji('🏋️‍♂️');
      setTimeBlock('Morning');
      setEnableReminder(false);
      
      Alert.alert('Success', 'Habit created successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit.');
    }
  };

  const adjustHour = (amount: number) => {
    let current = parseInt(hour, 10);
    current += amount;
    if (current > 12) current = 1;
    if (current < 1) current = 12;
    setHour(String(current).padStart(2, '0'));
  };

  const adjustMinute = (amount: number) => {
    let current = parseInt(minute, 10);
    current += amount;
    if (current > 59) current = 0;
    if (current < 0) current = 59;
    setMinute(String(current).padStart(2, '0'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Templates Section */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              QUICK TEMPLATES
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesContainer}>
              {TEMPLATES.map((tpl) => (
                <TouchableOpacity
                  key={tpl.name}
                  activeOpacity={0.8}
                  style={[styles.templateCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => handleApplyTemplate(tpl)}
                >
                  <ThemedText style={styles.templateEmoji}>{tpl.emoji}</ThemedText>
                  <ThemedText type="smallBold" style={styles.templateName}>{tpl.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Form Name Input */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              HABIT NAME
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              placeholder="e.g. Read Books, Go Gym..."
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Emoji Picker */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              SELECT EMOJI ({selectedEmoji})
            </ThemedText>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.7}
                  style={[
                    styles.emojiBtn,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    selectedEmoji === emoji && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Block Selector */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              DAILY ROUTINE TIME BLOCK
            </ThemedText>
            <View style={styles.blockContainer}>
              {(['Morning', 'Afternoon', 'Evening'] as const).map((block) => {
                const icon = block === 'Morning' ? 'sunny' : block === 'Afternoon' ? 'partly-sunny' : 'moon';
                const isSelected = timeBlock === block;
                return (
                  <TouchableOpacity
                    key={block}
                    activeOpacity={0.8}
                    style={[
                      styles.blockBtn,
                      { backgroundColor: theme.cardBackground, borderColor: theme.border },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setTimeBlock(block)}
                  >
                    <Ionicons name={icon as any} size={18} color={isSelected ? '#FFFFFF' : theme.textSecondary} />
                    <ThemedText type="smallBold" style={{ color: isSelected ? '#FFFFFF' : theme.text }}>
                      {block}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reminder Notifications */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Daily Push Reminder
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Get notified on your device
                </ThemedText>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.toggleBtn,
                  { backgroundColor: enableReminder ? theme.primary : theme.backgroundSelected },
                ]}
                onPress={() => setEnableReminder(!enableReminder)}
              >
                <View style={[styles.toggleCircle, { alignSelf: enableReminder ? 'flex-end' : 'flex-start' }]} />
              </TouchableOpacity>
            </View>

            {enableReminder && (
              <View style={[styles.timePickerContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                {/* Hours Adjustment */}
                <View style={styles.pickerColumn}>
                  <TouchableOpacity onPress={() => adjustHour(1)} style={styles.pickerArrow}>
                    <Ionicons name="chevron-up" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <ThemedText type="subtitle" style={styles.pickerValue}>{hour}</ThemedText>
                  <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.pickerArrow}>
                    <Ionicons name="chevron-down" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ThemedText type="subtitle" style={styles.pickerSeparator}>:</ThemedText>

                {/* Minutes Adjustment */}
                <View style={styles.pickerColumn}>
                  <TouchableOpacity onPress={() => adjustMinute(5)} style={styles.pickerArrow}>
                    <Ionicons name="chevron-up" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <ThemedText type="subtitle" style={styles.pickerValue}>{minute}</ThemedText>
                  <TouchableOpacity onPress={() => adjustMinute(-5)} style={styles.pickerArrow}>
                    <Ionicons name="chevron-down" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* AM / PM Toggle */}
                <View style={styles.periodColumn}>
                  <TouchableOpacity
                    style={[styles.periodBtn, amPm === 'AM' && { backgroundColor: theme.primary }]}
                    onPress={() => setAmPm('AM')}
                  >
                    <ThemedText type="smallBold" style={{ color: amPm === 'AM' ? '#FFFFFF' : theme.text }}>AM</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodBtn, amPm === 'PM' && { backgroundColor: theme.primary }]}
                    onPress={() => setAmPm('PM')}
                  >
                    <ThemedText type="smallBold" style={{ color: amPm === 'PM' ? '#FFFFFF' : theme.text }}>PM</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 16 }}>
              Create Habit
            </ThemedText>
          </TouchableOpacity>

        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
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
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    letterSpacing: 0.8,
  },
  templatesContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  templateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  templateEmoji: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 20,
    lineHeight: 28,
  },
  blockContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  blockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    gap: 16,
  },
  pickerColumn: {
    alignItems: 'center',
    width: 60,
  },
  pickerArrow: {
    padding: 4,
  },
  pickerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  pickerSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  periodColumn: {
    justifyContent: 'center',
    gap: 6,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
});
