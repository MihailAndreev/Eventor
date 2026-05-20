import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Eventor</Text>
        <Text style={styles.message}>Plan, organize, and join shared events with your groups.</Text>
        {isAuthenticated ? (
          <>
            <Text style={styles.sessionText}>Logged in as {user?.name ?? user?.email}</Text>
            <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </>
        ) : (
          <Link href="/login" style={styles.loginLink}>
            Log in
          </Link>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#18201c',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#4c5a52',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 12,
    color: '#0f6b4f',
    fontSize: 18,
    fontWeight: '600',
  },
  sessionText: {
    color: '#4c5a52',
    fontSize: 15,
    textAlign: 'center',
  },
  logoutButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18201c',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
