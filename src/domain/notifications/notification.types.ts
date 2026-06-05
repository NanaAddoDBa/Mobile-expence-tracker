export type NotificationType = "warning" | "info" | "success";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export type SystemNotification = Notification;
