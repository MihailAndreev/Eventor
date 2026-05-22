import { Stack, router } from 'expo-router';
import { deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventorHeaderIcon } from '@/components/eventor-logo';
import { ProtectedRoute } from '@/components/protected-route';
import { AuthProvider, useAuth } from '@/lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppStack />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function AppStack() {
  const { isAuthenticated, user } = useAuth();
  const displayName = user?.name ?? user?.email;

  useEffect(() => {
    deactivateKeepAwake().catch(() => {});
  }, []);

  return (
    <Stack
      screenOptions={({ route }) => ({
        headerTitle: '',
        headerLeft: () => <HeaderLeft routeName={route.name} />,
        headerRight: () =>
          isAuthenticated && displayName ? (
            <Text numberOfLines={1} style={styles.headerUser}>
              {displayName}
            </Text>
          ) : null,
      })}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="events" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="events/[id]" options={{ title: 'Event Details' }} />
    </Stack>
  );
}

function HeaderLeft({ routeName }: { routeName: string }) {
  if (routeName === 'index') {
    return (
      <View style={styles.homeHeaderLeft}>
        <EventorHeaderIcon />
        <Text style={styles.headerLeftText}>Home</Text>
      </View>
    );
  }

  if (routeName === 'events') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/')}
        style={styles.backHeaderLeft}
      >
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.headerLeftText}>Dashboard</Text>
      </Pressable>
    );
  }

  if (routeName === 'events/[id]') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backHeaderLeft}
      >
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.headerLeftText}>Event Details</Text>
      </Pressable>
    );
  }

  return <Text style={styles.headerLeftText}>{routeName === 'register' ? 'Register' : 'Login'}</Text>;
}

const styles = StyleSheet.create({
  homeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  backHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  backArrow: {
    color: '#004f6e',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 32,
  },
  headerLeftText: {
    color: '#18201c',
    fontSize: 20,
    fontWeight: '700',
  },
  headerUser: {
    maxWidth: 120,
    marginRight: 12,
    color: '#004f6e',
    fontSize: 14,
    fontWeight: '700',
  },
});
