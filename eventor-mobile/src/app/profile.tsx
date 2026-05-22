import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name ?? user?.email ?? '')}</Text>
          </View>

          <View style={styles.identity}>
            <Text numberOfLines={2} style={styles.name}>
              {user?.name ?? 'Eventor member'}
            </Text>
            <Text numberOfLines={2} style={styles.email}>
              {user?.email ?? 'Signed in'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role ?? 'user'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Link href="/events" style={styles.primaryLink}>
            Events
          </Link>
          <Link href="/notifications" style={styles.secondaryLink}>
            Notifications
          </Link>
          <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'E';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d9ded9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  identity: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: '#18201c',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  email: {
    color: '#4c5a52',
    fontSize: 15,
    lineHeight: 21,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9f3ef',
  },
  roleText: {
    color: '#0f4f3c',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actions: {
    gap: 12,
  },
  primaryLink: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 8,
    overflow: 'hidden',
    color: '#ffffff',
    backgroundColor: '#0f6b4f',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryLink: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#cbd5cf',
    borderRadius: 8,
    overflow: 'hidden',
    color: '#0f6b4f',
    backgroundColor: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoutButton: {
    minHeight: 48,
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
