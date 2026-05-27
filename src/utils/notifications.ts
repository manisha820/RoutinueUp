import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up default behavior for when notifications are received while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request user permission for push notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a daily reminder for a habit
 * @param id Habit unique ID
 * @param name Habit name
 * @param emoji Habit emoji
 * @param targetTime HH:MM format
 */
export async function scheduleHabitReminder(
  id: string,
  name: string,
  emoji: string,
  targetTime: string
): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return undefined;

  const [hourStr, minuteStr] = targetTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return undefined;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Habit Reminder!`,
        body: `Time to: ${name}`,
        sound: true,
        data: { habitId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return undefined;
  }
}

/**
 * Cancel a scheduled reminder
 * @param reminderId Notification identifier
 */
export async function cancelHabitReminder(reminderId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch (error) {
    console.error(`Error canceling notification ${reminderId}:`, error);
  }
}
