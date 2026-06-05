import { NotificationApi } from "./api.types";
import { notificationRepository } from "../repositories/notificationRepository.mock";

export const notificationApi: NotificationApi = {
  async listNotifications() {
    return notificationRepository.getAll();
  },

  async replaceNotifications(notifications) {
    notificationRepository.saveAll(notifications);
    return notificationRepository.getAll();
  },

  async clearNotifications() {
    notificationRepository.clear();
  },
};
