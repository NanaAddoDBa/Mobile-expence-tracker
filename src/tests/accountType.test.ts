import { describe, expect, test } from "vitest";
import {
  getAccountTypeLabel,
  normalizeAccountType,
} from "../domain/accounts/account.rules";
import { ConnectedAccount } from "../domain/accounts/account.types";

const baseAccount: ConnectedAccount = {
  id: "acct-1",
  name: "Everyday Checking",
  institutionName: "Mock Bank",
  type: "checking",
  balance: 1200,
  currency: "EUR",
  isConnected: true,
};

describe("account type labels", () => {
  test("normalizes legacy account type values to stable app ids", () => {
    expect(normalizeAccountType("checking_account")).toBe("checking");
    expect(normalizeAccountType("Savings Account")).toBe("savings");
    expect(normalizeAccountType("credit-card")).toBe("credit_card");
    expect(normalizeAccountType("Wallet")).toBe("digital_wallet");
  });

  test("returns friendly account type labels instead of raw IDs", () => {
    const account = {
      ...baseAccount,
      type: "checking",
    } as unknown as ConnectedAccount;

    expect(getAccountTypeLabel(account)).toBe("Checking account");
    expect(normalizeAccountType(account.type)).toBe("checking");
  });
});
