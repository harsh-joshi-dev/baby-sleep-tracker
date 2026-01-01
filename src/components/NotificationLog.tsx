import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { loadStorage } from '../utils/storage';
import { useEffect, useState } from 'react';
import { NotificationLogEntry } from '../types';
import { formatDateTime } from '../utils/timeUtils';

export function NotificationLog() {
  const [logEntries, setLogEntries] = useState<NotificationLogEntry[]>([]);

  useEffect(() => {
    loadLogEntries();
  }, []);

  const loadLogEntries = async () => {
    const storage = await loadStorage();
    setLogEntries(storage.notificationLog.slice().reverse());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#4CAF50';
      case 'canceled':
        return '#999';
      case 'triggered':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Log</Text>
      <ScrollView style={styles.scrollView}>
        {logEntries.length === 0 ? (
          <Text style={styles.emptyText}>No notification log entries</Text>
        ) : (
          logEntries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryKind}>
                  {entry.kind.charAt(0).toUpperCase() + entry.kind.slice(1)}
                </Text>
                <Text style={[styles.entryStatus, { color: getStatusColor(entry.status) }]}>
                  {entry.status}
                </Text>
              </View>
              <Text style={styles.entryTime}>
                Scheduled: {formatDateTime(entry.scheduledAtISO)}
              </Text>
              <Text style={styles.entryTime}>
                Trigger: {formatDateTime(entry.triggerAtISO)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  entry: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryKind: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  entryTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 40,
  },
});
