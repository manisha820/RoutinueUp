import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { HabitProvider } from '@/context/HabitContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <HabitProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="habit/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Habit Details',
            }}
          />
        </Stack>
      </HabitProvider>
    </ThemeProvider>
  );
}
