import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useStore } from '../store/useStore';
import type { SleepSession } from '../types';
import {
  formatTime,
  formatDate,
  getStartOfDay,
  minutesBetween,
  addMinutes,
  isBefore,
  isAfter,
  formatDuration,
} from '../utils/timeUtils';
import { ProfileRequiredModal } from './ProfileRequiredModal';

export function Timeline() {
  const { babyProfile, sleepSessions, deleteSleepSession } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getStartOfDay());

  const dayStart = getStartOfDay(selectedDate);
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const daySessions = sleepSessions.filter((s: SleepSession) => {
    if (s.deleted) return false;
    const sessionStart = new Date(s.startISO);
    const sessionEnd = new Date(s.endISO);
    const dayStartDate = new Date(dayStart);
    const dayEndDate = new Date(dayEnd);
    
    const sessionStartsInDay = sessionStart >= dayStartDate && sessionStart < dayEndDate;
    const sessionEndsInDay = sessionEnd > dayStartDate && sessionEnd <= dayEndDate;
    const sessionSpansDay = sessionStart < dayStartDate && sessionEnd > dayEndDate;
    
    return sessionStartsInDay || sessionEndsInDay || sessionSpansDay;
  });

  const handleDelete = (session: SleepSession) => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSleepSession(session.id),
      },
    ]);
  };

  const getSessionPosition = (startISO: string, endISO: string) => {
    const dayStartDate = new Date(dayStart);
    const sessionStartDate = new Date(startISO);
    const sessionEndDate = new Date(endISO);
    const dayMs = 24 * 60 * 60 * 1000;

    const startOffset = Math.max(0, sessionStartDate.getTime() - dayStartDate.getTime());
    const endOffset = Math.min(dayMs, sessionEndDate.getTime() - dayStartDate.getTime());
    const duration = endOffset - startOffset;

    const leftPercent = (startOffset / dayMs) * 100;
    const widthPercent = (duration / dayMs) * 100;

    return { leftPercent, widthPercent };
  };

  const renderTimeMarkers = () => {
    const markers = [];
    for (let hour = 0; hour < 24; hour += 3) {
      markers.push(
        <View key={hour} style={[styles.timeMarker, { left: `${(hour / 24) * 100}%` }]}>
          <Text style={styles.timeMarkerText}>{hour}:00</Text>
        </View>
      );
    }
    return markers;
  };

  const totalSleep = daySessions.reduce(
    (sum: number, s: SleepSession) => sum + minutesBetween(s.startISO, s.endISO),
    0
  );
  const hours = Math.floor(totalSleep / 60);
  const minutes = totalSleep % 60;

  useEffect(() => {
    if (!babyProfile && sleepSessions.length === 0) {
      setShowProfileModal(true);
    }
  }, [babyProfile, sleepSessions.length]);

  if (!babyProfile) {
    return (
      <>
        <ScrollView style={styles.container}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>Profile Required</Text>
            <Text style={styles.emptyMessage}>
              Set up your baby's profile to view the sleep timeline and track patterns over time.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ProfileRequiredModal
          visible={showProfileModal}
          onDismiss={() => setShowProfileModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const prevDate = addMinutes(selectedDate, -24 * 60);
            setSelectedDate(prevDate);
          }}
        >
          <Text style={styles.dateButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const nextDate = addMinutes(selectedDate, 24 * 60);
            setSelectedDate(nextDate);
          }}
        >
          <Text style={styles.dateButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Sleep</Text>
        <Text style={styles.totalValue}>
          {hours}h {minutes}m
        </Text>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timeline}>
          {renderTimeMarkers()}
          {daySessions.map((session: SleepSession) => {
            const { leftPercent, widthPercent } = getSessionPosition(
              session.startISO,
              session.endISO
            );
            const duration = minutesBetween(session.startISO, session.endISO);
            const isNight = duration > 360 || new Date(session.startISO).getHours() >= 18;

            return (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionBar,
                  {
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 1)}%`,
                    backgroundColor: isNight ? '#B794F6' : '#FFB84D',
                  },
                ]}
                onLongPress={() => handleDelete(session)}
                activeOpacity={0.8}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTime} numberOfLines={1}>
                    {formatTime(session.startISO)}
                  </Text>
                  <Text style={styles.sessionDuration}>{formatDuration(duration)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {daySessions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>😴</Text>
          <Text style={styles.emptyText}>No sleep sessions for this day</Text>
          <Text style={styles.emptySubtext}>Add sleep sessions to see them on the timeline</Text>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFB84D' }]} />
          <Text style={styles.legendText}>Nap</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#B794F6' }]} />
          <Text style={styles.legendText}>Night Sleep</Text>
        </View>
      </View>
      </ScrollView>
      <ProfileRequiredModal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 8,
    paddingHorizontal: 20,
    color: '#5B4E77',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButtonText: {
    fontSize: 24,
    color: '#FF6B9D',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B4E77',
    minWidth: 140,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B7FA8',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  timelineContainer: {
    height: 240,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#F0E6F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  timeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#F0E6F0',
    alignItems: 'center',
    paddingTop: 8,
  },
  timeMarkerText: {
    fontSize: 11,
    color: '#A99DBF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  sessionBar: {
    position: 'absolute',
    top: 32,
    bottom: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sessionInfo: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sessionTime: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sessionDuration: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  emptyText: {
    textAlign: 'center',
    color: '#5B4E77',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#A99DBF',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4E77',
  },
});