import { AccountApi } from "./api.types";
import { accountRepository } from "../repositories/accountRepository.mock";

export const accountApi: AccountApi = {
  async listConnectedAccounts() {
    return accountRepository.getAll();
  },

  async replaceConnectedAccounts(accounts) {
    return accountRepository.replaceAll(accounts);
  },
};
