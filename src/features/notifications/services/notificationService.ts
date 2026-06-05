import { BudgetStatusDetail } from "../../../domain/budgets/budget.types";
import { SystemNotification } from "../../../domain/notifications/notification.types";
import { getCurrentIsoTimestamp } from "../../../lib/dateUtils";

export function getInitialNotifications(timestamp = getCurrentIsoTimestamp()): SystemNotification[] {
  return [
    {
      id: "notif-1",
      type: "success",
      message: "Welcome to Expense Tracker. Add an expense or scan a mock receipt to start.",
      timestamp,
      isRead: false,
    },
    {
      id: "notif-2",
      type: "info",
      message: "Connect a read-only mock account when you want to import sample expenses.",
      timestamp,
      isRead: true,
    },
  ];
}

export function createNotification(
  type: SystemNotification["type"],
  message: string,
  timestamp = getCurrentIsoTimestamp()
): SystemNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    timestamp,
    isRead: false,
  };
}

export function getBudgetThresholdNotification(
  usage: BudgetStatusDetail | undefined,
  threshold: number
): SystemNotification | null {
  if (!usage) {
    return null;
  }

  if (usage.percentageUsed >= 100) {
    return createNotification(
      "warning",
      `Overspending Alert: ${usage.category} is over budget (${usage.spentAmount.toFixed(2)} EUR spent of ${usage.limitAmount.toFixed(2)} EUR).`
    );
  }

  if (usage.percentageUsed >= threshold) {
    return createNotification(
      "info",
      `Budget alert: You used ${usage.percentageUsed.toFixed(0)}% of your ${usage.category} budget (${usage.spentAmount.toFixed(2)} EUR of ${usage.limitAmount.toFixed(2)} EUR).`
    );
  }

  return null;
}

export const notificationService = {
  createNotification,
  getBudgetThresholdNotification,
  getInitialNotifications,
};
