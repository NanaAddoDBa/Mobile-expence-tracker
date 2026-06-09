export enum EntrySource {
  MANUAL = "manual",
  RECEIPT_SCAN = "receipt_scan",
  CONNECTED_ACCOUNT = "connected_account",
  RECURRING_FORECAST = "recurring_forecast",
}

export enum PaymentMethod {
  CASH = "cash",
  DEBIT_CARD = "debit_card",
  CREDIT_CARD = "credit_card",
  DIGITAL_WALLET = "digital_wallet",
  BANK_TRANSFER = "bank_transfer",
}

export enum ExpenseCategory {
  HOUSING = "housing",
  GROCERIES = "groceries",
  TRANSPORT = "transport",
  UTILITIES = "utilities",
  DINING = "dining",
  ENTERTAINMENT = "entertainment",
  HEALTH = "health",
  SHOPPING = "shopping",
  EDUCATION = "education",
  SUBSCRIPTIONS = "subscriptions",
  TRANSFERS = "transfers",
  OTHER = "other",
}

export enum CurrencyCode {
  EUR = "EUR",
  GBP = "GBP",
  USD = "USD",
}
