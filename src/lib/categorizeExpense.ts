import { RuleSuggestion } from "../domain/expenses/expense.types";

export const CATEGORY_RULES: RuleSuggestion[] = [
  {
    keywords: ["supermarket", "lidl", "aldi", "tesco", "carrefour", "grocery", "spar", "rewe", "sainsburys", "groceries", "asda", "co-op", "marks & spencer", "m&s"],
    suggestedCategory: "Food & Grocery",
  },
  {
    keywords: ["starbucks", "cafe", "restaurant", "mcdonalds", "burger", "pizza", "pub", "bistro", "dining", "sushi", "subway", "uber eats", "deliveroo", "coffee", "caffe"],
    suggestedCategory: "Dining & Cafe",
  },
  {
    keywords: ["uber", "taxi", "bolt", "train", "metro", "subway", "bus", "petrol", "shell", "gas", "esso", "parking", "diesel", "bp", "filling station", "transport"],
    suggestedCategory: "Transport & Auto",
  },
  {
    keywords: ["landlord", "rent", "electricity", "gas bill", "utility", "water", "internet", "broadband", "insurance", "rental", "energy", "eon", "vodafone"],
    suggestedCategory: "Housing & Utilities",
  },
  {
    keywords: ["netflix", "spotify", "cinema", "theatre", "gaming", "steam", "playstation", "concert", "ticket", "disney+", "nintendo", "movies"],
    suggestedCategory: "Entertainment & Leisure",
  },
  {
    keywords: ["zara", "amazon", "h&m", "shopping", "nike", "adidas", "mall", "boutique", "bookshop", "ebay", "clothes", "shoe"],
    suggestedCategory: "Shopping",
  },
  {
    keywords: ["pharmacy", "doctor", "hospital", "dentist", "clinic", "boots", "wellness", "health", "meds", "optical"],
    suggestedCategory: "Healthcare",
  },
  {
    keywords: ["school", "university", "udemy", "coursera", "book", "tuition", "audible", "elearning", "college"],
    suggestedCategory: "Education & Kids",
  },
  {
    keywords: ["flight", "airline", "hotel", "airbnb", "booking", "booking.com", "hostel", "expedia", "luggage", "ryanair", "easyjet", "travel"],
    suggestedCategory: "Travel & Holiday",
  },
];

/**
 * Automatically suggests a category based on the merchant name and description.
 */
export function categorizeExpense(merchant: string, description: string): string {
  const normMerchant = (merchant || "").toLowerCase();
  const normDesc = (description || "").toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normMerchant.includes(keyword) || normDesc.includes(keyword)) {
        return rule.suggestedCategory;
      }
    }
  }

  return "Others";
}
