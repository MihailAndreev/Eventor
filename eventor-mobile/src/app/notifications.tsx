import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getNotificationsPage,
  markNotificationReadRequest,
  type NotificationItem,
  type NotificationsPage,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const PAGE_SIZE = 10;

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [notificationsPage, setNotificationsPage] = useState<NotificationsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingReadId, setPendingReadId] = useState<number | null>(null);

  const hasLoadedNotifications = Boolean(notificationsPage);
  const canGoBack = page > 1;
  const canGoForward = Boolean(notificationsPage && page < notificationsPage.paging.totalPages);

  const loadNotifications = useCallback(
    async (targetPage: number, mode: 'loading' | 'refreshing' = 'loading') => {
      if (!token) {
        return;
      }

      if (mode === 'refreshing') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const result = await getNotificationsPage({
          page: targetPage,
          pageSize: PAGE_SIZE,
          token,
        });

        setNotificationsPage(result);
        setPage(result.paging.page);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load notifications.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(page, hasLoadedNotifications ? 'refreshing' : 'loading');
    }, [hasLoadedNotifications, loadNotifications, page]),
  );

  const pagingLabel = useMemo(() => {
    if (!notificationsPage || notificationsPage.paging.totalPages === 0) {
      return 'Page 1 of 1';
    }

    return `Page ${notificationsPage.paging.page} of ${notificationsPage.paging.totalPages}`;
  }, [notificationsPage]);

  async function handleMarkRead(notification: NotificationItem) {
    if (!token || notification.read) {
      return;
    }

    setPendingReadId(notification.id);
    setError(null);
    setNotice(null);

    try {
      const result = await markNotificationReadRequest({ id: notification.id, token });
      setNotice(result.message);
      await loadNotifications(page, 'refreshing');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update notification.');
    } finally {
      setPendingReadId(null);
    }
  }

  function handleRefresh() {
    void loadNotifications(page, 'refreshing');
  }

  function handleOpenEvent(notification: NotificationItem) {
    if (!notification.eventId) {
      return;
    }

    router.push({
      pathname: '/events/[id]',
      params: { id: String(notification.eventId) },
    });
  }

  if (isLoading && !notificationsPage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.centerStateText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={notificationsPage?.data ?? []}
        keyExtractor={(notification) => String(notification.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{error ? 'Notifications unavailable' : 'No notifications'}</Text>
            <Text style={styles.emptyText}>
              {error ?? 'Event updates and group activity will appear here.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadNotifications(page)}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          notificationsPage ? (
            <View style={styles.paging}>
              <Pressable
                accessibilityRole="button"
                disabled={!canGoBack || isLoading}
                onPress={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                style={[styles.pageButton, (!canGoBack || isLoading) && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>Previous</Text>
              </Pressable>

              <Text style={styles.pagingText}>{pagingLabel}</Text>

              <Pressable
                accessibilityRole="button"
                disabled={!canGoForward || isLoading}
                onPress={() => setPage((currentPage) => currentPage + 1)}
                style={[styles.pageButton, (!canGoForward || isLoading) && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>Next</Text>
              </Pressable>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onMarkRead={() => void handleMarkRead(item)}
            onOpenEvent={() => handleOpenEvent(item)}
            pendingReadId={pendingReadId}
          />
        )}
      />
    </SafeAreaView>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
  onOpenEvent,
  pendingReadId,
}: {
  notification: NotificationItem;
  onMarkRead: () => void;
  onOpenEvent: () => void;
  pendingReadId: number | null;
}) {
  const isPending = pendingReadId === notification.id;

  return (
    <View style={[styles.card, !notification.read && styles.unreadCard]}>
      <View style={styles.cardTop}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{formatNotificationType(notification.type)}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(notification.createdAt)}</Text>
      </View>

      <Text style={[styles.notificationText, !notification.read && styles.unreadText]}>
        {notification.text}
      </Text>

      <View style={styles.cardActions}>
        {notification.eventId ? (
          <Pressable accessibilityRole="button" onPress={onOpenEvent} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Open event</Text>
          </Pressable>
        ) : null}

        {!notification.read ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={onMarkRead}
            style={[styles.primaryButton, isPending && styles.disabledButton]}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Mark read</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.readBadge}>
            <Text style={styles.readBadgeText}>Read</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function formatNotificationType(type: string) {
  return type.replace(/_/g, ' ');
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  centerStateText: {
    color: '#4c5a52',
    fontSize: 16,
  },
  header: {
    gap: 8,
    paddingBottom: 4,
  },
  title: {
    color: '#18201c',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  noticeText: {
    color: '#0f6b4f',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyTitle: {
    color: '#18201c',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: '#4c5a52',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9ded9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  unreadCard: {
    borderColor: '#a9d5c5',
    backgroundColor: '#f7fcfa',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9f3ef',
  },
  typeText: {
    color: '#0f4f3c',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  dateText: {
    flexShrink: 1,
    color: '#4c5a52',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  notificationText: {
    color: '#4c5a52',
    fontSize: 15,
    lineHeight: 22,
  },
  unreadText: {
    color: '#18201c',
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cbd5cf',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#0f6b4f',
    fontSize: 14,
    fontWeight: '700',
  },
  readBadge: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf0ed',
  },
  readBadgeText: {
    color: '#4c5a52',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.4,
  },
  paging: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pagingText: {
    flex: 1,
    color: '#4c5a52',
    fontSize: 14,
    textAlign: 'center',
  },
  pageButton: {
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18201c',
  },
  pageButtonDisabled: {
    opacity: 0.35,
  },
  pageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
