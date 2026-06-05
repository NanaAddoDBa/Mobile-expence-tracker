import { ReceiptApi } from "./api.types";
import { mockReceiptRepository } from "../repositories/receiptRepository.mock";

export const receiptApi: ReceiptApi = {
  async listReceiptTemplates() {
    return mockReceiptRepository.getTemplates();
  },
};
