import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addEventCommentRequest,
  deleteEventCommentRequest,
  getEventDetails,
  joinEventRequest,
  leaveEventRequest,
  updateEventCommentRequest,
  updateEventSlotsRequest,
  type EventDetails,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'join' | 'leave' | 'slots' | 'addComment' | `editComment:${number}` | `deleteComment:${number}` | null
  >(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const eventId = Array.isArray(id) ? id[0] : id;
  const canDecreaseSlots = Boolean(event?.isJoined && event.currentUserReservedSlots > 0 && !pendingAction);
  const canIncreaseSlots = Boolean(event?.isJoined && event.isJoinable && !pendingAction);

  const capacityLabel = useMemo(() => {
    if (!event) {
      return '';
    }

    if (event.unlimitedCapacity) {
      return `${event.attendeeCount} attending, unlimited capacity`;
    }

    return `${event.attendeeCount}/${event.capacity} attending`;
  }, [event]);

  const loadEvent = useCallback(
    async (mode: 'loading' | 'refreshing' = 'loading') => {
      if (!token || !eventId) {
        return;
      }

      if (mode === 'refreshing') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const result = await getEventDetails({ id: eventId, token });
        setEvent(result);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load event details.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [eventId, token],
  );

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  async function runMutation(
    action: NonNullable<typeof pendingAction>,
    mutate: () => Promise<{ message: string }>,
  ) {
    setPendingAction(action);
    setError(null);
    setNotice(null);

    try {
      const result = await mutate();
      setNotice(result.message);
      await loadEvent('refreshing');
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update event.');
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  function handleJoin() {
    if (!event || !token) {
      return;
    }

    void runMutation('join', () => joinEventRequest({ id: event.id, token }));
  }

  function handleLeave() {
    if (!event || !token) {
      return;
    }

    void runMutation('leave', () => leaveEventRequest({ id: event.id, token }));
  }

  function handleSlotChange(nextExtraSlots: number) {
    if (!event || !token) {
      return;
    }

    void runMutation('slots', () =>
      updateEventSlotsRequest({
        id: event.id,
        extraSlots: Math.max(0, nextExtraSlots),
        token,
      }),
    );
  }

  async function handleAddComment() {
    if (!event || !token) {
      return;
    }

    const text = commentText.trim();

    if (!text) {
      setError('Enter a comment before saving.');
      return;
    }

    const ok = await runMutation('addComment', () =>
      addEventCommentRequest({ id: event.id, text, token }),
    );

    if (ok) {
      setCommentText('');
    }
  }

  function startEditingComment(comment: EventDetails['comments'][number]) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setError(null);
    setNotice(null);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentText('');
  }

  async function handleUpdateComment(commentId: number) {
    if (!event || !token) {
      return;
    }

    const text = editingCommentText.trim();

    if (!text) {
      setError('Enter a comment before saving.');
      return;
    }

    const ok = await runMutation(`editComment:${commentId}`, () =>
      updateEventCommentRequest({ id: event.id, commentId, text, token }),
    );

    if (ok) {
      cancelEditingComment();
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!event || !token) {
      return;
    }

    await runMutation(`deleteComment:${commentId}`, () =>
      deleteEventCommentRequest({ id: event.id, commentId, token }),
    );

    if (editingCommentId === commentId) {
      cancelEditingComment();
    }
  }

  if (isLoading && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.centerStateText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Event unavailable</Text>
          <Text style={styles.emptyText}>{error ?? 'This event could not be loaded.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadEvent()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadEvent('refreshing')} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.groupText}>{event.group.title}</Text>
            <View style={[styles.badge, event.state === 'current' && styles.currentBadge]}>
              <Text style={styles.badgeText}>{formatStatus(event.state)}</Text>
            </View>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.description}>{event.description || 'No description provided.'}</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        <View style={styles.actions}>
          {event.isJoined ? (
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(pendingAction)}
              onPress={handleLeave}
              style={[styles.dangerButton, pendingAction && styles.disabledButton]}
            >
              {pendingAction === 'leave' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Leave</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={!event.isJoinable || Boolean(pendingAction)}
              onPress={handleJoin}
              style={[styles.primaryButton, (!event.isJoinable || pendingAction) && styles.disabledButton]}
            >
              {pendingAction === 'join' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Join</Text>
              )}
            </Pressable>
          )}
        </View>

        {event.isJoined ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reserved slots for friends</Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                disabled={!canDecreaseSlots}
                onPress={() => handleSlotChange(event.currentUserReservedSlots - 1)}
                style={[styles.stepperButton, !canDecreaseSlots && styles.disabledButton]}
              >
                <Text style={styles.stepperButtonText}>-1</Text>
              </Pressable>

              <View style={styles.slotValue}>
                {pendingAction === 'slots' ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.slotValueText}>+{event.currentUserReservedSlots}</Text>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canIncreaseSlots}
                onPress={() => handleSlotChange(event.currentUserReservedSlots + 1)}
                style={[styles.stepperButton, !canIncreaseSlots && styles.disabledButton]}
              >
                <Text style={styles.stepperButtonText}>+1</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event info</Text>
          <InfoRow label="Date" value={formatDateTime(event.startAt)} />
          <InfoRow label="Location" value={event.location || 'Location TBD'} />
          <InfoRow label="State" value={formatStatus(event.state)} />
          <InfoRow label="Capacity" value={capacityLabel} />
          <InfoRow label="Players joined" value={String(event.participantsJoined)} />
          <InfoRow label="Reserved slots" value={String(event.reservedSlots)} />
          <InfoRow label="Your status" value={event.isJoined ? 'Joined' : 'Not joined'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {event.participants.length > 0 ? (
            event.participants.map((participant) => (
              <View key={participant.id} style={styles.listRow}>
                <Text style={styles.listRowTitle}>{participant.name}</Text>
                <Text style={styles.listRowMeta}>
                  {participant.extraSlots > 0 ? `+${participant.extraSlots} friends` : 'No extra slots'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No participants yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments ({event.commentsCount})</Text>
          <View style={styles.commentComposer}>
            <TextInput
              editable={!pendingAction}
              multiline
              onChangeText={setCommentText}
              placeholder="Add a comment"
              style={styles.commentInput}
              textAlignVertical="top"
              value={commentText}
            />
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(pendingAction)}
              onPress={() => void handleAddComment()}
              style={[styles.compactButton, pendingAction && styles.disabledButton]}
            >
              {pendingAction === 'addComment' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.compactButtonText}>Post</Text>
              )}
            </Pressable>
          </View>

          {event.comments.length > 0 ? (
            event.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Text style={styles.listRowTitle}>{comment.authorName}</Text>
                  <Text style={styles.listRowMeta}>{formatDate(comment.createdAt)}</Text>
                </View>
                {editingCommentId === comment.id ? (
                  <View style={styles.editBlock}>
                    <TextInput
                      editable={!pendingAction}
                      multiline
                      onChangeText={setEditingCommentText}
                      style={styles.commentInput}
                      textAlignVertical="top"
                      value={editingCommentText}
                    />
                    <View style={styles.commentActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(pendingAction)}
                        onPress={() => void handleUpdateComment(comment.id)}
                        style={[styles.compactButton, pendingAction && styles.disabledButton]}
                      >
                        {pendingAction === `editComment:${comment.id}` ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.compactButtonText}>Save</Text>
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(pendingAction)}
                        onPress={cancelEditingComment}
                        style={[styles.secondaryButton, pendingAction && styles.disabledButton]}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    {comment.authorId === user?.id ? (
                      <View style={styles.commentActions}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={Boolean(pendingAction)}
                          onPress={() => startEditingComment(comment)}
                          style={[styles.secondaryButton, pendingAction && styles.disabledButton]}
                        >
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={Boolean(pendingAction)}
                          onPress={() => void handleDeleteComment(comment.id)}
                          style={[styles.smallDangerButton, pendingAction && styles.disabledButton]}
                        >
                          {pendingAction === `deleteComment:${comment.id}` ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.compactButtonText}>Delete</Text>
                          )}
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No comments yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date TBD';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
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

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 32,
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
  hero: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9ded9',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  groupText: {
    flex: 1,
    color: '#4c5a52',
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
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
  badgeText: {
    color: '#0f4f3c',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  title: {
    color: '#18201c',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  description: {
    color: '#4c5a52',
    fontSize: 16,
    lineHeight: 23,
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
  actions: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  dangerButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b42318',
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  section: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9ded9',
  },
  sectionTitle: {
    color: '#18201c',
    fontSize: 19,
    fontWeight: '800',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 64,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18201c',
  },
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  slotValue: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f4f1',
  },
  slotValueText: {
    color: '#18201c',
    fontSize: 20,
    fontWeight: '800',
  },
  infoRow: {
    gap: 4,
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#4c5a52',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#18201c',
    fontSize: 16,
    lineHeight: 22,
  },
  listRow: {
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf0ed',
  },
  listRowTitle: {
    color: '#18201c',
    fontSize: 16,
    fontWeight: '700',
  },
  listRowMeta: {
    color: '#4c5a52',
    fontSize: 13,
  },
  comment: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf0ed',
  },
  commentHeader: {
    gap: 3,
  },
  commentText: {
    color: '#18201c',
    fontSize: 15,
    lineHeight: 22,
  },
  commentComposer: {
    gap: 10,
  },
  commentInput: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#cbd5cf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#18201c',
    backgroundColor: '#fbfcfb',
    fontSize: 15,
    lineHeight: 21,
  },
  editBlock: {
    gap: 10,
  },
  commentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  compactButtonText: {
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
  smallDangerButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b42318',
  },
  emptyTitle: {
    color: '#18201c',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: '#4c5a52',
    fontSize: 15,
    lineHeight: 21,
  },
});
