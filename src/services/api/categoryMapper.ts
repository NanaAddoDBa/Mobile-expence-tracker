export type ApiExpenseCategory =
  | "housing"
  | "groceries"
  | "transport"
  | "utilities"
  | "dining"
  | "entertainment"
  | "health"
  | "shopping"
  | "education"
  | "subscriptions"
  | "transfers"
  | "travel"
  | "other";

export function toApiCategory(category: string): ApiExpenseCategory {
  const normalized = category.trim().toLowerCase();
  const compact = normalized.replace(/&/g, "and").replace(/\s+/g, " ");
  const mappings: Record<string, ApiExpenseCategory> = {
    "food and grocery": "groceries",
    groceries: "groceries",
    grocery: "groceries",
    "dining and cafe": "dining",
    dining: "dining",
    cafe: "dining",
    "transport and auto": "transport",
    transport: "transport",
    auto: "transport",
    "housing and utilities": "housing",
    housing: "housing",
    utilities: "utilities",
    "entertainment and leisure": "entertainment",
    entertainment: "entertainment",
    shopping: "shopping",
    healthcare: "health",
    health: "health",
    "education and kids": "education",
    education: "education",
    subscriptions: "subscriptions",
    transfers: "transfers",
    "travel and holiday": "travel",
    travel: "travel",
    holiday: "travel",
    others: "other",
    other: "other",
  };

  return mappings[compact] || "other";
}

export function toFrontendCategory(category: ApiExpenseCategory): string {
  const mappings: Record<ApiExpenseCategory, string> = {
    housing: "Housing & Utilities",
    groceries: "Food & Grocery",
    transport: "Transport & Auto",
    utilities: "Housing & Utilities",
    dining: "Dining & Cafe",
    entertainment: "Entertainment & Leisure",
    health: "Healthcare",
    shopping: "Shopping",
    education: "Education & Kids",
    subscriptions: "Others",
    transfers: "Others",
    travel: "Travel & Holiday",
    other: "Others",
  };

  return mappings[category];
}
