import * as Notifications from 'expo-notifications';
import { setPreferences } from '@/lib/storage/preferences';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function normalize(status: Notifications.PermissionStatus): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getNotificationPermission(): Promise<PermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  return normalize(settings.status);
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: false,
      allowDisplayInCarPlay: false,
      allowProvisional: false,
    },
  });
  const state = normalize(settings.status);
  await setPreferences({ notificationsPermission: state });
  return state;
}

export async function syncNotificationPermission(): Promise<PermissionState> {
  const state = await getNotificationPermission();
  await setPreferences({ notificationsPermission: state });
  return state;
}
