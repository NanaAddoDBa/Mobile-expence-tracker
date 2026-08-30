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
  TRAVEL = "travel",
  OTHER = "other",
}

export enum RecurringFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  BI_WEEKLY = "bi-weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  ARCHIVED = "archived",
}

export enum BudgetPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

export enum CurrencyCode {
  EUR = "EUR",
  GBP = "GBP",
  USD = "USD",
}
