import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { ProfileRequiredModal } from './ProfileRequiredModal';

export function Coach() {
  const { babyProfile, coachTips } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!babyProfile) {
      setShowProfileModal(true);
    }
  }, [babyProfile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return '#FFB3BA';
      case 'error':
        return '#FF6B6B';
      default:
        return '#B4F8C8';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return '#FF6B9D';
      case 'error':
        return '#FF4444';
      default:
        return '#4ECDC4';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      default:
        return '💡';
    }
  };

  if (!babyProfile) {
    return (
      <>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>💡</Text>
            </View>
            <Text style={styles.emptyTitle}>Profile Required</Text>
            <Text style={styles.emptyMessage}>
              Set up your baby's profile to receive personalized sleep coaching tips and recommendations.
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

  if (coachTips.length === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Personalized sleep insights</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyText}>No tips at this time</Text>
          <Text style={styles.emptySubtext}>Everything looks good! Keep tracking sleep patterns.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Personalized sleep insights</Text>

        {coachTips.map((tip) => (
          <View
            key={tip.id}
            style={[
              styles.tipCard,
              {
                borderLeftColor: getSeverityBorderColor(tip.severity),
                backgroundColor: '#FFFFFF',
              },
            ]}
          >
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>{getSeverityIcon(tip.severity)}</Text>
              <View style={styles.tipHeaderText}>
                <Text style={[styles.tipTitle, { color: getSeverityBorderColor(tip.severity) }]}>
                  {tip.title}
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(tip.severity) }]}>
                  <Text style={styles.tipSeverity}>
                    {tip.severity.charAt(0).toUpperCase() + tip.severity.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.tipMessage}>{tip.message}</Text>
            <View style={styles.rationaleContainer}>
              <Text style={styles.rationaleLabel}>💭 Why this matters:</Text>
              <Text style={styles.rationale}>{tip.rationale}</Text>
            </View>
            {tip.relatedSessionIds.length > 0 && (
              <View style={styles.relatedSessions}>
                <Text style={styles.relatedSessionsText}>
                  📋 Related to {tip.relatedSessionIds.length} session
                  {tip.relatedSessionIds.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        ))}
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
    marginBottom: 20,
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipSeverity: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B4E77',
    textTransform: 'uppercase',
  },
  tipMessage: {
    fontSize: 16,
    color: '#5B4E77',
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  rationaleContainer: {
    backgroundColor: '#FFF5F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rationaleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B4E77',
    marginBottom: 8,
  },
  rationale: {
    fontSize: 14,
    color: '#8B7FA8',
    lineHeight: 20,
  },
  relatedSessions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E6F0',
  },
  relatedSessionsText: {
    fontSize: 12,
    color: '#A99DBF',
    fontWeight: '500',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#A99DBF',
    fontSize: 14,
    lineHeight: 20,
  },
});