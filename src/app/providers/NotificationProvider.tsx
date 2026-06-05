import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SystemNotification } from "../../domain/notifications/notification.types";
import { createNotification, notificationService } from "../../features/notifications/services/notificationService";
import { notificationRepository } from "../../services/repositories/notificationRepository.mock";

export interface NotificationContextType {
  notifications: SystemNotification[];
  addNotification: (notification: SystemNotification) => void;
  showNotification: (type: SystemNotification["type"], message: string) => void;
  reloadNotifications: () => SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    notificationRepository.getAll()
  );

  useEffect(() => {
    notificationRepository.saveAll(notifications);
  }, [notifications]);

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
      reloadNotifications() {
        const nextNotifications = notificationRepository.getAll();
        setNotifications(nextNotifications);
        return nextNotifications;
      },
      markNotificationAsRead(id) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
      },
      clearAllNotifications() {
        setNotifications([]);
        notificationRepository.clear();
      },
    };
  }, [notifications]);

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
