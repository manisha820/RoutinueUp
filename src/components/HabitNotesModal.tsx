import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';

interface HabitNotesModalProps {
  visible: boolean;
  habitName: string;
  habitEmoji: string;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

export function HabitNotesModal({
  visible,
  habitName,
  habitEmoji,
  onClose,
  onSubmit,
}: HabitNotesModalProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSubmit(note.trim());
    setNote('');
  };

  const handleSkip = () => {
    onSubmit('');
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ThemedView
            style={[
              styles.container,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.header}>
              <ThemedText style={styles.emoji}>{habitEmoji}</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>
                {habitName}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Add an optional reflection for your log
              </ThemedText>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              placeholder="How did it go? (e.g. Felt tired but still did it!)"
              placeholderTextColor={theme.textSecondary}
              maxLength={120}
              value={note}
              onChangeText={setNote}
              autoFocus
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
                onPress={handleSkip}
              >
                <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                  Just Log
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Save & Log
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 50,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
});
