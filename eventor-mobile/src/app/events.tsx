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

import { getActiveEventsPage, type EventListItem, type EventsPage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const PAGE_SIZE = 10;

export default function EventsScreen() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [eventsPage, setEventsPage] = useState<EventsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasLoadedEvents = Boolean(eventsPage);
  const canGoBack = page > 1;
  const canGoForward = Boolean(eventsPage && page < eventsPage.paging.totalPages);

  const loadEvents = useCallback(
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
        const result = await getActiveEventsPage({
          page: targetPage,
          pageSize: PAGE_SIZE,
          token,
        });

        setEventsPage(result);
        setPage(result.paging.page);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load events.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadEvents(page, hasLoadedEvents ? 'refreshing' : 'loading');
    }, [hasLoadedEvents, loadEvents, page]),
  );

  const pagingLabel = useMemo(() => {
    if (!eventsPage || eventsPage.paging.totalPages === 0) {
      return 'Page 1 of 1';
    }

    return `Page ${eventsPage.paging.page} of ${eventsPage.paging.totalPages}`;
  }, [eventsPage]);

  function handleRefresh() {
    void loadEvents(page, 'refreshing');
  }

  function handleOpenEvent(event: EventListItem) {
    router.push({
      pathname: '/events/[id]',
      params: { id: String(event.id) },
    });
  }

  if (isLoading && !eventsPage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.centerStateText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={eventsPage?.data ?? []}
        keyExtractor={(event) => String(event.id)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{error ? 'Events unavailable' : 'No active events'}</Text>
            <Text style={styles.emptyText}>
              {error ?? 'There are no upcoming or current events for your groups yet.'}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void loadEvents(page)} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          eventsPage ? (
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
          <EventCard event={item} onPress={() => handleOpenEvent(item)} />
        )}
      />
    </SafeAreaView>
  );
}

function EventCard({ event, onPress }: { event: EventListItem; onPress: () => void }) {
  const attendeeLabel = event.unlimitedCapacity
    ? `${event.attendeeCount} attending`
    : `${event.attendeeCount}/${event.capacity} attending`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {event.title}
          </Text>
          <Text numberOfLines={1} style={styles.groupText}>
            {event.group.title}
          </Text>
        </View>

        <View style={styles.badgeStack}>
          <View style={[styles.statusBadge, event.state === 'current' && styles.currentBadge]}>
            <Text style={styles.statusText}>{formatStatus(event.state)}</Text>
          </View>
          <View style={[styles.joinBadge, event.isJoined && styles.joinedBadge]}>
            <Text style={[styles.joinBadgeText, event.isJoined && styles.joinedBadgeText]}>
              {event.isJoined ? 'Joined' : 'Not joined'}
            </Text>
          </View>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.description}>
        {event.description || 'No description provided.'}
      </Text>

      <View style={styles.metaGrid}>
        <MetaPill label="Date" value={formatDateTime(event.startAt)} />
        <MetaPill label="Place" value={event.location || 'Location TBD'} />
        <MetaPill label="Capacity" value={attendeeLabel} />
      </View>
    </Pressable>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date TBD';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
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
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9ded9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cardPressed: {
    opacity: 0.72,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#18201c',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  groupText: {
    color: '#4c5a52',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9f3ef',
  },
  currentBadge: {
    backgroundColor: '#dff0ff',
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusText: {
    color: '#0f4f3c',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  joinBadge: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d5dcd7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  joinedBadge: {
    borderColor: '#a9d5c5',
    backgroundColor: '#f0faf6',
  },
  joinBadgeText: {
    color: '#4c5a52',
    fontSize: 12,
    fontWeight: '700',
  },
  joinedBadgeText: {
    color: '#0f6b4f',
  },
  description: {
    color: '#4c5a52',
    fontSize: 15,
    lineHeight: 21,
  },
  metaGrid: {
    gap: 8,
  },
  metaPill: {
    gap: 3,
    padding: 10,
    borderWidth: 1,
    borderColor: '#edf0ed',
    borderRadius: 8,
    backgroundColor: '#fbfcfb',
  },
  metaLabel: {
    color: '#607066',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#18201c',
    fontSize: 14,
    lineHeight: 20,
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
