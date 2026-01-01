import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../store/useStore';
import { formatTime, isToday, isTomorrow, nowISO, isAfter, formatDuration } from '../utils/timeUtils';
import { ProfileRequiredModal } from './ProfileRequiredModal';

export function Schedule() {
  const { babyProfile, scheduleBlocks, learnerState, wakeWindowAdjustment, setWakeWindowAdjustment } = useStore();
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!babyProfile) {
      setShowProfileModal(true);
    }
  }, [babyProfile]);

  const upcomingBlocks = scheduleBlocks.filter((block) => isAfter(block.startISO, nowISO()));

  const todayBlocks = upcomingBlocks.filter((block) => isToday(block.startISO));
  const tomorrowBlocks = upcomingBlocks.filter((block) => isTomorrow(block.startISO));

  const getBlockColor = (kind: string) => {
    switch (kind) {
      case 'windDown':
        return '#C4B5FD';
      case 'nap':
        return '#FFB84D';
      case 'bedtime':
        return '#B794F6';
      default:
        return '#A99DBF';
    }
  };

  const getBlockIcon = (kind: string) => {
    switch (kind) {
      case 'windDown':
        return '🌙';
      case 'nap':
        return '😴';
      case 'bedtime':
        return '🌛';
      default:
        return '💤';
    }
  };

  const renderBlocks = (blocks: typeof scheduleBlocks, title: string) => {
    if (blocks.length === 0) return null;

    return (
      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>{title}</Text>
        {blocks.map((block) => (
          <View
            key={block.id}
            style={[
              styles.block,
              { borderLeftColor: getBlockColor(block.kind), backgroundColor: '#FFFFFF' },
            ]}
          >
            <View style={styles.blockHeader}>
              <View style={styles.blockTitleRow}>
                <Text style={styles.blockIcon}>{getBlockIcon(block.kind)}</Text>
                <Text style={[styles.blockKind, { color: getBlockColor(block.kind) }]}>
                  {block.kind.charAt(0).toUpperCase() + block.kind.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidence}>
                  {Math.round(block.confidence * 100)}%
                </Text>
              </View>
            </View>
            <Text style={styles.blockTime}>
              {formatTime(block.startISO)} - {formatTime(block.endISO)}
            </Text>
            <View style={styles.rationaleContainer}>
              <Text style={styles.rationale}>{block.rationale}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (!babyProfile) {
    return (
      <>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>Profile Required</Text>
            <Text style={styles.emptyMessage}>
              Set up your baby's profile to get personalized sleep schedules and recommendations.
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
        {learnerState && (
          <View style={styles.learnerCard}>
            <View style={styles.learnerRow}>
              <Text style={styles.learnerLabel}>Wake Window:</Text>
              <Text style={styles.learnerValue}>
                {formatDuration(learnerState.ewmaWakeWindowMin)}
              </Text>
            </View>
            <View style={styles.learnerRow}>
              <Text style={styles.learnerLabel}>Confidence:</Text>
              <Text style={styles.learnerValue}>
                {Math.round(learnerState.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.adjustmentButton}
          onPress={() => setShowAdjustment(!showAdjustment)}
          activeOpacity={0.8}
        >
          <Text style={styles.adjustmentButtonText}>
            {showAdjustment ? '▼' : '▶'} What-If Adjustment
          </Text>
        </TouchableOpacity>

        {showAdjustment && (
          <View style={styles.adjustmentSection}>
            <Text style={styles.adjustmentLabel}>
              Adjust Wake Window: {wakeWindowAdjustment > 0 ? '+' : ''}
              {formatDuration(Math.abs(wakeWindowAdjustment))}
            </Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWakeWindowAdjustment(Math.max(-30, wakeWindowAdjustment - 5))}
                activeOpacity={0.7}
              >
                <Text style={styles.sliderButtonText}>−5</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${((wakeWindowAdjustment + 30) / 60) * 100}%`,
                      backgroundColor: wakeWindowAdjustment === 0 ? '#A99DBF' : wakeWindowAdjustment > 0 ? '#FF6B9D' : '#B4F8C8',
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWakeWindowAdjustment(Math.min(30, wakeWindowAdjustment + 5))}
                activeOpacity={0.7}
              >
                <Text style={styles.sliderButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setWakeWindowAdjustment(0)}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset to 0</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderBlocks(todayBlocks, 'Today')}
        {renderBlocks(tomorrowBlocks, 'Tomorrow')}

        {upcomingBlocks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No upcoming schedule blocks</Text>
            <Text style={styles.emptySubtext}>Add sleep sessions to generate a schedule</Text>
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
  learnerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  learnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7FA8',
  },
  learnerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  adjustmentButton: {
    backgroundColor: '#C4B5FD',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adjustmentButtonText: {
    color: '#5B4E77',
    fontSize: 16,
    fontWeight: '700',
  },
  adjustmentSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adjustmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#5B4E77',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderButton: {
    backgroundColor: '#FF6B9D',
    padding: 12,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sliderTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0E6F0',
    borderRadius: 6,
    marginHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 6,
  },
  resetButton: {
    alignSelf: 'center',
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F0E6F0',
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#5B4E77',
    fontSize: 14,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#5B4E77',
  },
  block: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  blockIcon: {
    fontSize: 24,
  },
  blockKind: {
    fontSize: 18,
    fontWeight: '700',
  },
  confidenceBadge: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidence: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4E77',
  },
  blockTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#5B4E77',
  },
  rationaleContainer: {
    backgroundColor: '#FFF5F8',
    padding: 12,
    borderRadius: 12,
  },
  rationale: {
    fontSize: 13,
    color: '#8B7FA8',
    lineHeight: 18,
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