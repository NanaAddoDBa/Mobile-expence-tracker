import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SystemNotification } from "../../domain/notifications/notification.types";
import { createNotification, notificationService } from "../../features/notifications/services/notificationService";
import { notificationApi } from "../../services/api";

export interface NotificationContextType {
  notifications: SystemNotification[];
  addNotification: (notification: SystemNotification) => void;
  showNotification: (type: SystemNotification["type"], message: string) => void;
  reloadNotifications: () => Promise<SystemNotification[]>;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  const reloadNotifications = useMemo(() => {
    return async () => {
      const nextNotifications = await notificationApi.listNotifications();
      setNotifications(nextNotifications);
      setHasLoadedNotifications(true);
      return nextNotifications;
    };
  }, []);

  useEffect(() => {
    void reloadNotifications();
  }, [reloadNotifications]);

  useEffect(() => {
    if (!hasLoadedNotifications) return;
    void notificationApi.replaceNotifications(notifications);
  }, [hasLoadedNotifications, notifications]);

  const value = useMemo<NotificationContextType>(() => {
    const addNotification = (notification: SystemNotification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    return {
      notifications,
      addNotification,
      showNotification(type, message) {
        addNotification(createNotification(type, message));
      },
      reloadNotifications,
      markNotificationAsRead(id) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
      },
      clearAllNotifications() {
        setNotifications([]);
        void notificationApi.clearNotifications();
      },
    };
  }, [notifications, reloadNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export { notificationService };
