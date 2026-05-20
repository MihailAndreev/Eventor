import { Stack } from 'expo-router';

import { ProtectedRoute } from '@/components/protected-route';
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="login" options={{ title: 'Login' }} />
          <Stack.Screen name="events" options={{ title: 'Events' }} />
          <Stack.Screen name="events/[id]" options={{ title: 'Event Details' }} />
        </Stack>
      </ProtectedRoute>
    </AuthProvider>
  );
}
