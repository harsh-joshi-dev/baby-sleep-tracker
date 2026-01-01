import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useStore } from '../store/useStore';
import type { SleepSession } from '../types';
import { getStartOfDay, addMinutes, minutesBetween, formatDuration } from '../utils/timeUtils';
import { ProfileRequiredModal } from './ProfileRequiredModal';

const screenWidth = Dimensions.get('window').width;

export function Chart() {
  const { babyProfile, sleepSessions } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!babyProfile) {
      setShowProfileModal(true);
    }
  }, [babyProfile]);

  const chartData = useMemo(() => {
    const days: { date: string; napLength: number; totalDaytime: number }[] = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 13);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStart = getStartOfDay(dayDate.toISOString());
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

      const naps = daySessions.filter((s: SleepSession) => {
        const startHour = new Date(s.startISO).getHours();
        const duration = minutesBetween(s.startISO, s.endISO);
        const isDaytime = startHour >= 6 && startHour < 20;
        return duration < 360 && isDaytime;
      });

      const napLengths = naps.map((s: SleepSession) => minutesBetween(s.startISO, s.endISO));
      const avgNapLength =
        napLengths.length > 0
          ? napLengths.reduce((sum: number, n: number) => sum + n, 0) / napLengths.length
          : 0;

      const totalDaytime = naps.reduce(
        (sum: number, s: SleepSession) => sum + minutesBetween(s.startISO, s.endISO),
        0
      );

      days.push({
        date: dayStart,
        napLength: Math.round(avgNapLength),
        totalDaytime: Math.round(totalDaytime),
      });
    }

    return days;
  }, [sleepSessions]);

  const labels = chartData.map((_, index) => {
    if (index === 0 || index === chartData.length - 1 || index === Math.floor(chartData.length / 2)) {
      const date = new Date(chartData[index].date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
    return '';
  });
  const data = chartData.map((day) => day.napLength);

  const hasData = data.some((value) => value > 0);

  if (!babyProfile) {
    return (
      <>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>Profile Required</Text>
            <Text style={styles.emptyMessage}>
              Set up your baby's profile to view sleep trends and analytics.
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Average Nap Length Over 14 Days</Text>

        {hasData ? (
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    {
                      data,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={280}
                yAxisLabel=""
                yAxisSuffix="m"
                yAxisInterval={1}
                fromZero
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFF5F8',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 107, 157, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(91, 78, 119, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '3',
                    stroke: '#FF6B9D',
                    fill: '#FFFFFF',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#F0E6F0',
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </View>
            <View style={styles.chartInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Highest:</Text>
                <Text style={styles.infoValue}>
                  {formatDuration(Math.max(...data.filter((d) => d > 0)) || 0)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average:</Text>
                <Text style={styles.infoValue}>
                  {formatDuration(
                    data.filter((d) => d > 0).length > 0
                      ? data.filter((d) => d > 0).reduce((a, b) => a + b, 0) /
                          data.filter((d) => d > 0).length
                      : 0
                  )}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data available yet</Text>
            <Text style={styles.emptySubtext}>Add sleep sessions to see trends</Text>
          </View>
        )}
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
  subtitle: {
    fontSize: 14,
    color: '#8B7FA8',
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  chartWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8B7FA8',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B9D',
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
    fontSize: 64,
    marginBottom: 16,
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
});