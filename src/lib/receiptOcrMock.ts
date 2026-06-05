import { getTodayDateString } from "./dateUtils";

export interface MockOcrResult {
  merchant: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  detectedItems: { name: string; price: number }[];
  confidence: number;
}

const CONSTANT_MOCK_RECEIPTS = [
  {
    merchant: "Lidl Supermarket",
    amount: 43.15,
    category: "Food & Grocery",
    detectedItems: [
      { name: "Organic Bananas 1kg", price: 1.89 },
      { name: "Wholemeal Sourdough Bread", price: 2.10 },
      { name: "Irish Fresh Salmon 500g", price: 11.49 },
      { name: "Greek Style Yogurt 1kg", price: 3.15 },
      { name: "Extra Virgin Olive Oil 1L", price: 8.99 },
      { name: "Mature Irish Cheddar Cheese", price: 4.50 },
      { name: "Washing Detergent Pods 30pk", price: 11.03 },
    ],
  },
  {
    merchant: "Starbucks Coffee",
    amount: 11.85,
    category: "Dining & Cafe",
    detectedItems: [
      { name: "Caffè Latte (Grande)", price: 4.15 },
      { name: "Pistachio Croissant", price: 3.45 },
      { name: "Iced Caramel Macchiato", price: 4.25 },
    ],
  },
  {
    merchant: "Zara Clothing",
    amount: 94.90,
    category: "Shopping",
    detectedItems: [
      { name: "Slim Fit Cotton Chino Spencer", price: 49.95 },
      { name: "Structured Linen Mix Shirt", price: 44.95 },
    ],
  },
  {
    merchant: "Shell Fuel Station",
    amount: 62.40,
    category: "Transport & Auto",
    detectedItems: [
      { name: "Fuel Unleaded 95 (38.5L)", price: 62.40 },
    ],
  },
  {
    merchant: "Boots Pharmacy",
    amount: 27.20,
    category: "Healthcare",
    detectedItems: [
      { name: "Paracetamol tablets 500mg (24pk)", price: 1.20 },
      { name: "Multivitamin Active Complete 90pk", price: 14.50 },
      { name: "Moisturizing Face Cream SPF30", price: 11.50 },
    ],
  },
];

/**
 * Simulates a Receipt scanning OCR operation with a realistic network delay.
 * Avoids any external AI APIs to comply with boundaries.
 */
export async function simulateReceiptOcr(file: File): Promise<MockOcrResult> {
  // Simulate OCR parse delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const fileNameLower = (file.name || "").toLowerCase();
  let choiceIndex: number;

  if (fileNameLower.includes("starbucks") || fileNameLower.includes("coffee") || fileNameLower.includes("cafe") || fileNameLower.includes("drink")) {
    choiceIndex = 1;
  } else if (fileNameLower.includes("zara") || fileNameLower.includes("cloth") || fileNameLower.includes("wear") || fileNameLower.includes("shirt")) {
    choiceIndex = 2;
  } else if (fileNameLower.includes("shell") || fileNameLower.includes("fuel") || fileNameLower.includes("petrol") || fileNameLower.includes("gas") || fileNameLower.includes("esso")) {
    choiceIndex = 3;
  } else if (fileNameLower.includes("boots") || fileNameLower.includes("pharm") || fileNameLower.includes("health") || fileNameLower.includes("drug")) {
    choiceIndex = 4;
  } else {
    // Pick randomly if no match
    choiceIndex = Math.floor(Math.random() * CONSTANT_MOCK_RECEIPTS.length);
  }
  const choice = CONSTANT_MOCK_RECEIPTS[choiceIndex];

  const todayStr = getTodayDateString();

  return {
    merchant: choice.merchant,
    date: todayStr,
    amount: choice.amount,
    category: choice.category,
    detectedItems: choice.detectedItems,
    confidence: +(0.94 + Math.random() * 0.05).toFixed(2), // 0.94 - 0.99
  };
}
