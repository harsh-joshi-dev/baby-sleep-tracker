import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useStore } from '../store/useStore';
import { formatDateTime, nowISO, minutesBetween, getStartOfDay, isSameDay } from '../utils/timeUtils';
import { DateTimePicker } from './DateTimePicker';
import { ProfileRequiredModal } from './ProfileRequiredModal';

export function SleepLog() {
  const { babyProfile, activeTimerStart, startTimer, stopTimer, cancelTimer, addSleepSession, sleepSessions } = useStore();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [manualStart, setManualStart] = useState(new Date());
  const [manualEnd, setManualEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimerStart) {
      interval = setInterval(() => {
        const start = new Date(activeTimerStart);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimerStart]);

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!babyProfile) {
      setShowProfileModal(true);
      return;
    }
    startTimer();
  };

  const handleStopTimer = async () => {
    if (!activeTimerStart) return;

    // Calculate duration in seconds
    const durationSeconds = Math.floor((new Date().getTime() - new Date(activeTimerStart).getTime()) / 1000);
    
    // If duration is less than 30 seconds, ask for confirmation
    if (durationSeconds < 30) {
      Alert.alert(
        'Short Session Detected',
        `This session is only ${durationSeconds} seconds long. Did you want to track this sleep session, or was this created by mistake?`,
        [
          {
            text: 'Discard',
            style: 'cancel',
            onPress: () => {
              cancelTimer();
              setElapsedTime(0);
            },
          },
          {
            text: 'Save Session',
            onPress: async () => {
              await stopTimer();
              setElapsedTime(0);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      await stopTimer();
      setElapsedTime(0);
    }
  };

  const handleManualEntryPress = () => {
    if (!babyProfile) {
      setShowProfileModal(true);
      return;
    }
    setShowManualEntry(true);
  };

  const handleManualSubmit = async () => {
    if (manualEnd <= manualStart) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      await addSleepSession({
        startISO: manualStart.toISOString(),
        endISO: manualEnd.toISOString(),
        source: 'manual',
        quality,
        notes: notes.trim() || undefined,
      });

      setShowManualEntry(false);
      setManualStart(new Date());
      setManualEnd(new Date());
      setQuality(undefined);
      setNotes('');
      Alert.alert('Success', 'Sleep session added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep session');
    }
  };

  const recentSessions = sleepSessions
    .filter((s) => !s.deleted)
    .sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime())
    .slice(0, 5);

  const todayStart = getStartOfDay();
  const todaySessions = sleepSessions.filter((s) => {
    if (s.deleted) return false;
    return isSameDay(s.startISO, todayStart);
  });
  const todayTotalMinutes = todaySessions.reduce(
    (sum, s) => sum + minutesBetween(s.startISO, s.endISO),
    0
  );
  const todayHours = Math.floor(todayTotalMinutes / 60);
  const todayMins = todayTotalMinutes % 60;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {!babyProfile ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>👶</Text>
            </View>
            <Text style={styles.emptyTitle}>Welcome to Sleep Tracker</Text>
            <Text style={styles.emptyMessage}>
              Set up your baby's profile to start tracking sleep patterns and get personalized recommendations.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryIcon}>📊</Text>
                <Text style={styles.summaryTitle}>Today's Summary</Text>
              </View>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Sleep</Text>
                  <Text style={styles.summaryValue}>
                    {todayHours}h {todayMins}m
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sessions</Text>
                  <Text style={styles.summaryValue}>{todaySessions.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.timerSection}>
              {!activeTimerStart ? (
                <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>😴</Text>
                    <Text style={styles.buttonText}>Start Timer</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.timerActive}>
                  <View style={styles.timerIndicator}>
                    <View style={styles.pulseCircle} />
                    <Text style={styles.timerText}>Timer Running</Text>
                  </View>
                  <View style={styles.timerDisplay}>
                    <Text style={styles.timerTime}>{formatElapsedTime(elapsedTime)}</Text>
                  </View>
                  <TouchableOpacity style={styles.stopButton} onPress={handleStopTimer}>
                    <Text style={styles.stopButtonText}>Stop Timer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualEntryPress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>📝</Text>
                <Text style={styles.manualButtonText}>Add Manual Entry</Text>
              </View>
            </TouchableOpacity>

            {recentSessions.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
                {recentSessions.map((session) => {
                  const duration = minutesBetween(session.startISO, session.endISO);
                  const hours = Math.floor(duration / 60);
                  const minutes = duration % 60;
                  return (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionIcon}>💤</Text>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTime}>
                            {formatDateTime(session.startISO)}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            {hours}h {minutes}m
                          </Text>
                        </View>
                      </View>
                      {session.quality && (
                        <View style={styles.sessionQuality}>
                          <Text style={styles.qualityLabel}>Quality:</Text>
                          <View style={styles.qualityStars}>
                            {[1, 2, 3, 4, 5].map((q) => (
                              <Text
                                key={q}
                                style={[
                                  styles.star,
                                  q <= session.quality! && styles.starFilled,
                                ]}
                              >
                                ⭐
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      <Modal visible={showManualEntry} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Manual Entry</Text>

              <View style={styles.dateTimeSection}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {formatDateTime(manualStart.toISOString())}
                  </Text>
                  <Text style={styles.changeText}>Tap to change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeSection}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {formatDateTime(manualEnd.toISOString())}
                  </Text>
                  <Text style={styles.changeText}>Tap to change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Quality (1-5, optional)</Text>
              <View style={styles.qualityButtons}>
                {[1, 2, 3, 4, 5].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.qualityButton,
                      quality === q && styles.qualityButtonSelected,
                    ]}
                    onPress={() => setQuality(q as 1 | 2 | 3 | 4 | 5)}
                  >
                    <Text
                      style={[
                        styles.qualityButtonText,
                        quality === q && styles.qualityButtonTextSelected,
                      ]}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this sleep session..."
                placeholderTextColor="#A99DBF"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowManualEntry(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DateTimePicker
        visible={showStartPicker}
        date={manualStart}
        onConfirm={(date) => {
          setManualStart(date);
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
        mode="datetime"
        maximumDate={new Date()}
      />

      <DateTimePicker
        visible={showEndPicker}
        date={manualEnd}
        onConfirm={(date) => {
          setManualEnd(date);
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
        mode="datetime"
        maximumDate={new Date()}
      />

      <ProfileRequiredModal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },
  content: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5B4E77',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8B7FA8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B4E77',
  },
  summaryContent: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8B7FA8',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  timerSection: {
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#B4F8C8',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonIcon: {
    fontSize: 28,
  },
  buttonText: {
    color: '#5B4E77',
    fontSize: 18,
    fontWeight: '700',
  },
  timerActive: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  pulseCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#B4F8C8',
  },
  timerText: {
    fontSize: 16,
    color: '#5B4E77',
    fontWeight: '600',
  },
  timerDisplay: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
    minWidth: 150,
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B9D',
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    backgroundColor: '#FFB3BA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#5B4E77',
    fontSize: 16,
    fontWeight: '700',
  },
  manualButton: {
    backgroundColor: '#C4B5FD',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  manualButtonText: {
    color: '#5B4E77',
    fontSize: 18,
    fontWeight: '700',
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B4E77',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sessionIcon: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B4E77',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#8B7FA8',
    fontWeight: '500',
  },
  sessionQuality: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E6F0',
  },
  qualityLabel: {
    fontSize: 13,
    color: '#8B7FA8',
    fontWeight: '600',
  },
  qualityStars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(91, 78, 119, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#5B4E77',
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#5B4E77',
  },
  dateTimeButton: {
    borderWidth: 2,
    borderColor: '#F0E6F0',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFF5F8',
  },
  dateTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B4E77',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 12,
    color: '#A99DBF',
    fontWeight: '500',
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  qualityButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0E6F0',
    backgroundColor: '#FFF5F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityButtonSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  qualityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A99DBF',
  },
  qualityButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#F0E6F0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#5B4E77',
    backgroundColor: '#FFF5F8',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0E6F0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8B7FA8',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});