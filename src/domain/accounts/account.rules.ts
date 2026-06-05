import { AccountType, ConnectedAccount } from "./account.types";

const ACCOUNT_TYPE_ALIASES: Record<string, AccountType> = {
  checking: "checking",
  checking_account: "checking",
  "checking account": "checking",
  savings: "savings",
  savings_account: "savings",
  "savings account": "savings",
  credit: "credit_card",
  credit_card: "credit_card",
  "credit card": "credit_card",
  card: "credit_card",
  digital_wallet: "digital_wallet",
  "digital wallet": "digital_wallet",
  wallet: "digital_wallet",
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking account",
  savings: "Savings account",
  credit_card: "Credit card",
  digital_wallet: "Digital wallet",
};

interface AccountTypeSource {
  accountType?: AccountType;
  type: AccountType;
}

export function getAccountDisplayName(account: ConnectedAccount): string {
  return account.displayName || account.name;
}

export function getAccountProviderName(account: ConnectedAccount): string {
  return account.providerName || account.institutionName;
}

export function normalizeAccountType(value: unknown): AccountType {
  if (typeof value !== "string") return "checking";

  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  return ACCOUNT_TYPE_ALIASES[normalized] || "checking";
}

export function getAccountTypeLabel(account: AccountTypeSource): string {
  return ACCOUNT_TYPE_LABELS[normalizeAccountType(account.accountType || account.type)];
}

export function getAccountStatus(account: ConnectedAccount) {
  return account.status || (account.isConnected ? "connected" : "disconnected");
}

export function canImportFromAccount(account: ConnectedAccount): boolean {
  const status = getAccountStatus(account);
  return account.isConnected && status === "connected";
}
