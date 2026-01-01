import 'react-native-get-random-values';
import * as Notifications from 'expo-notifications';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleBlock } from '../types';
import { NotificationLogEntry } from '../types';
import { isBefore, isAfter, nowISO, minutesBetween, formatTime } from './timeUtils';
import { saveNotificationLogEntry, loadStorage } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let notificationIds: string[] = [];

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

function getNotificationTitle(kind: ScheduleBlock['kind']): string {
  switch (kind) {
    case 'windDown':
      return 'Wind Down Time';
    case 'nap':
      return 'Nap Time';
    case 'bedtime':
      return 'Bedtime';
    default:
      return 'Sleep Schedule';
  }
}

function getNotificationBody(kind: ScheduleBlock['kind'], block: ScheduleBlock): string {
  switch (kind) {
    case 'windDown':
      return `Start calming activities before ${formatTime(block.endISO)}`;
    case 'nap':
      return `Time for a nap. Expected duration: ${Math.round(minutesBetween(block.startISO, block.endISO))} minutes`;
    case 'bedtime':
      return `Bedtime at ${formatTime(block.startISO)}`;
    default:
      return '';
  }
}

export async function scheduleBlockNotifications(blocks: ScheduleBlock[]): Promise<void> {
  await cancelAllNotifications();

  const now = nowISO();
  const upcomingBlocks = blocks.filter((block) => isAfter(block.startISO, now));

  for (const block of upcomingBlocks.slice(0, 10)) {
    const triggerTime = new Date(block.startISO).getTime() - Date.now();
    if (triggerTime > 0 && triggerTime < 7 * 24 * 60 * 60 * 1000) {
      try {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: getNotificationTitle(block.kind),
            body: getNotificationBody(block.kind, block),
            sound: true,
          },
          trigger: {
            seconds: Math.floor(triggerTime / 1000),
          },
        });

        notificationIds.push(identifier);

        const logEntry: NotificationLogEntry = {
          id: uuidv4(),
          scheduledAtISO: nowISO(),
          triggerAtISO: block.startISO,
          kind: block.kind,
          status: 'scheduled',
          relatedBlockId: block.id,
        };

        await saveNotificationLogEntry(logEntry);
      } catch (error) {
        console.error('Failed to schedule notification:', error);
      }
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  // Cancel notifications tracked in memory
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Also cancel all scheduled notifications from the OS (in case app was restarted)
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allScheduled) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      } catch (error) {
        console.error('Failed to cancel OS notification:', error);
      }
    }
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
  }

  // Update notification log entries
  const schema = await loadStorage();
  const now = nowISO();
  for (const entry of schema.notificationLog) {
    if (entry.status === 'scheduled' && isBefore(entry.triggerAtISO, now)) {
      entry.status = 'canceled';
      await saveNotificationLogEntry(entry);
    }
  }

  notificationIds = [];
}

export async function getAllScheduledNotifications(): Promise<string[]> {
  return await Notifications.getAllScheduledNotificationsAsync().then((notifications) =>
    notifications.map((n) => n.identifier)
  );
}
