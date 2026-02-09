import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notifications/NotificationService';

export function useNotificationDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Handle notification tap when app is in background/killed
    const responseSubscription =
      notificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.type === 'task_reminder' && data?.taskId) {
          router.push(`/task/${data.taskId}`);
        } else if (data?.type === 'daily_summary') {
          router.push('/(tabs)/today');
        }
      });

    // Handle notification received while app is open (optional visual feedback)
    const receivedSubscription =
      notificationService.addNotificationReceivedListener((_notification) => {
        // Could show in-app toast here in the future
      });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router]);
}
