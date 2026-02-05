import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Reminder, Task } from "@/types";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private hasPermission = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    this.hasPermission = finalStatus === "granted";

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name: "Напоминания о задачах",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#dc4c3e",
      });
    }

    return this.hasPermission;
  }

  async scheduleTaskReminder(
    task: Task,
    reminderTime: Date,
    reminderId: string,
  ): Promise<string | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    const trigger = new Date(reminderTime);

    // Don't schedule if time is in the past
    if (trigger <= new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Напоминание о задаче",
        body: task.title,
        data: {
          taskId: task.id,
          reminderId,
          type: "task_reminder",
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: trigger,
        channelId: "task-reminders",
      },
    });

    return notificationId;
  }

  async scheduleRelativeReminder(
    task: Task,
    minutesBefore: number,
    reminderId: string,
  ): Promise<string | null> {
    if (!task.dueDate || !task.dueTime) {
      return null;
    }

    const dueDateTime = new Date(task.dueDate);
    const timeParts = task.dueTime.split(":").map(Number);
    const hours = timeParts[0] ?? 0;
    const mins = timeParts[1] ?? 0;
    dueDateTime.setHours(hours, mins, 0, 0);

    const reminderTime = new Date(
      dueDateTime.getTime() - minutesBefore * 60 * 1000,
    );

    return this.scheduleTaskReminder(task, reminderTime, reminderId);
  }

  async cancelReminder(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllTaskReminders(taskId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      if (notification.content.data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }
    }
  }

  async getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  // Quick reminder presets
  getQuickReminderOptions(): Array<{
    label: string;
    minutes: number;
  }> {
    return [
      { label: "За 5 минут", minutes: 5 },
      { label: "За 15 минут", minutes: 15 },
      { label: "За 30 минут", minutes: 30 },
      { label: "За 1 час", minutes: 60 },
      { label: "За 1 день", minutes: 60 * 24 },
    ];
  }

  // Schedule daily summary notification
  async scheduleDailySummary(
    hour: number,
    minute: number,
  ): Promise<string | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    // Cancel existing daily summary
    const scheduled = await this.getScheduledReminders();
    for (const notification of scheduled) {
      if (notification.content.data?.type === "daily_summary") {
        await this.cancelReminder(notification.identifier);
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Задачи на сегодня",
        body: "Посмотрите, что запланировано на сегодня",
        data: { type: "daily_summary" },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: "task-reminders",
      },
    });

    return notificationId;
  }

  // Handle notification response (when user taps notification)
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notification received while app is open
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = NotificationService.getInstance();
