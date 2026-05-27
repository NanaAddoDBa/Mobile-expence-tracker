import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server-db.json");

app.use(express.json());

// Seeding standard dataset
const DEFAULT_ACCOUNTS = [
  {
    id: "card-1",
    name: "Sapphire Preferred Credit Card",
    institution: "Chase Bank",
    paymentMethod: "Credit Card",
    balance: 4420.50,
    lastFour: "4295",
    status: "connected",
    color: "indigo"
  },
  {
    id: "card-2",
    name: "Cash Rewards Checking Account",
    institution: "Bank of America",
    paymentMethod: "Bank Transfer",
    balance: 12850.25,
    lastFour: "8812",
    status: "connected",
    color: "emerald"
  },
  {
    id: "card-3",
    name: "Titanium Premium Credit Card",
    institution: "Apple Credit",
    paymentMethod: "Credit Card",
    balance: 620.10,
    lastFour: "0952",
    status: "connected",
    color: "slate"
  }
];

const DEFAULT_RULES = [
  { id: "rule-1", keyword: "Starbucks", category: "Food & Dining" },
  { id: "rule-2", keyword: "Netflix", category: "Entertainment" },
  { id: "rule-3", keyword: "Uber", category: "Transport" },
  { id: "rule-4", keyword: "Amazon", category: "Shopping" }
];

const DEFAULT_BUDGETS = [
  { category: "Food & Dining", limit: 450, spent: 342.50, alertThreshold: 80 },
  { category: "Transport", limit: 200, spent: 185.00, alertThreshold: 80 },
  { category: "Utilities", limit: 180, spent: 145.00, alertThreshold: 85 },
  { category: "Entertainment", limit: 250, spent: 265.00, alertThreshold: 80 },
  { category: "Shopping", limit: 400, spent: 120.00, alertThreshold: 75 },
  { category: "Healthcare", limit: 150, spent: 45.00, alertThreshold: 90 },
  { category: "Education", limit: 100, spent: 0.00, alertThreshold: 80 },
  { category: "Travel", limit: 300, spent: 0.00, alertThreshold: 80 },
  { category: "Other", limit: 100, spent: 35.20, alertThreshold: 80 }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    amount: 3200,
    category: "Income",
    description: "Monthly Salary - Google",
    type: "income",
    date: "2026-05-01",
    paymentMethod: "Bank Transfer",
    tags: ["salary", "google", "direct-deposit"]
  },
  {
    id: "tx-2",
    amount: 150,
    category: "Income",
    description: "UI Design Consulting Sidegig",
    type: "income",
    date: "2026-05-18",
    paymentMethod: "Bank Transfer",
    tags: ["freelance", "consulting"]
  },
  {
    id: "tx-3",
    amount: 124.50,
    category: "Food & Dining",
    description: "Whole Foods Market Weekly Roast",
    type: "expense",
    date: "2026-05-22",
    paymentMethod: "Credit Card",
    tags: ["groceries", "organic"]
  },
  {
    id: "tx-4",
    amount: 45.00,
    category: "Transport",
    description: "Uber Ride City Center (Chase Sync)",
    type: "expense",
    date: "2026-05-23",
    paymentMethod: "Credit Card",
    tags: ["commute", "taxi"]
  },
  {
    id: "tx-5",
    amount: 85.00,
    category: "Utilities",
    description: "High-Speed Broadband Fiber internet",
    type: "expense",
    date: "2026-05-15",
    paymentMethod: "Debit Card",
    tags: ["internet", "bills"],
    isRecurring: true,
    recurringFrequency: "monthly",
    recurringNextDate: "2026-06-15"
  },
  {
    id: "tx-sub-netflix",
    amount: 15.49,
    category: "Entertainment",
    description: "Netflix Premium Plan Subscription (Chase Sync)",
    type: "expense",
    date: "2026-04-23",
    paymentMethod: "Credit Card",
    tags: ["subscription", "streaming"],
    isRecurring: true,
    recurringFrequency: "monthly",
    recurringNextDate: "2026-05-23"
  }
];

const DEFAULT_ALERTS = [
  {
    id: "alert-1",
    type: "danger",
    category: "Entertainment",
    message: "Your spending in Entertainment ($265.00) has exceeded your target budget limit of $250.00.",
    time: "2026-05-21T18:32:00Z",
    amount: 265.00,
    limit: 250,
    isRead: false
  }
];

const DEFAULT_SETTINGS = {
  currency: "USD",
  serverSyncFrequency: "realtime",
  plaidClientId: "sandbox_client_id_4295x",
  plaidSecret: "shh_sandbox_secret_99812a",
  trueLayerToken: "sandbox-tl-usr_94a0d923fcda12",
  geminiApiKeySaved: false,
  notificationsEnabled: true
};

const DEFAULT_PROFILE = {
  name: "Andy Bampoe",
  email: "Andybampoe.ad@gmail.com",
  phone: "+44 7911 123456",
  address: "10 Downing Street, London, SW1A 2AA, UK",
  avatar: "💼",
  mfaEnabled: true,
  loginPin: "1234",
  themePreference: "dark",
  accessibilityFontScale: "medium",
  accessibilityHighContrast: false,
  accessibilityKeyboardFocus: false,
  dataSharingConsent: true,
  cookieTrackingConsent: true,
  telemetryLogsEnabled: true
};

const DEFAULT_DOCUMENTS = [
  { id: "doc-1", name: "May 2026 E-Statement.pdf", date: "2026-05-24", size: "142 KB", category: "Statement", downloadable: true },
  { id: "doc-2", name: "April 2026 E-Statement.pdf", date: "2026-04-30", size: "135 KB", category: "Statement", downloadable: true },
  { id: "doc-3", name: "Tax Year 2025 Electronic Form 1099-INT.pdf", date: "2026-01-15", size: "412 KB", category: "Tax", downloadable: true },
  { id: "doc-4", name: "Plaid Financial Security Authorization.pdf", date: "2026-05-18", size: "88 KB", category: "Auth", downloadable: true }
];

const DEFAULT_SESSIONS = [
  { id: "sess-1", deviceName: "Chrome Mac (Current)", location: "London, UK", ipAddress: "192.168.1.100", lastActive: "Active Now", isCurrent: true },
  { id: "sess-2", deviceName: "Brave Browser Windows", location: "London, UK", ipAddress: "82.16.4.110", lastActive: "3 hours ago", isCurrent: false },
  { id: "sess-3", deviceName: "Safari iOS iPhone 15 Pro", location: "Reading, UK", ipAddress: "185.12.19.12", lastActive: "Yesterday", isCurrent: false }
];

const DEFAULT_GOALS = [
  {
    id: "goal-1",
    name: "Down Payment for House",
    targetAmount: 50000,
    currentAmount: 12500,
    targetDate: "2027-12-31",
    category: "Savings",
    color: "emerald",
    createdAt: "2026-01-10",
    contributions: [
      { id: "c-1", amount: 10000, date: "2026-02-15", description: "Initial seed fund allocation", accountId: "card-2" },
      { id: "c-2", amount: 2500, date: "2026-04-20", description: "Tax refund bonus contribution", accountId: "card-2" }
    ]
  },
  {
    id: "goal-2",
    name: "Vacation Fund (Europe Summer)",
    targetAmount: 4500,
    currentAmount: 1800,
    targetDate: "2026-08-15",
    category: "Travel",
    color: "indigo",
    createdAt: "2026-03-05",
    contributions: [
      { id: "c-3", amount: 1000, date: "2026-03-05", description: "Starting allocation from savings", accountId: "card-2" },
      { id: "c-4", amount: 800, date: "2026-05-10", description: "Monthly consulting sidegig savings", accountId: "card-2" }
    ]
  }
];

const INITIAL_DB_STATE = {
  transactions: DEFAULT_TRANSACTIONS,
  budgets: DEFAULT_BUDGETS,
  alerts: DEFAULT_ALERTS,
  connectedAccounts: DEFAULT_ACCOUNTS,
  categorizationRules: DEFAULT_RULES,
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
  documents: DEFAULT_DOCUMENTS,
  sessions: DEFAULT_SESSIONS,
  goals: DEFAULT_GOALS
};

// Helper: Ensure JSON database exists
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    console.log("[SERVER DB] Seeding default records down to server-db.json...");
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB_STATE, null, 2), "utf8");
  }
}

function readDatabase() {
  try {
    initDatabase();
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[SERVER DB] Read error, returning core defaults:", err);
    return INITIAL_DB_STATE;
  }
}

function writeDatabase(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[SERVER DB] Write failed:", err);
    return false;
  }
}

// 1. Initialise db right away
initDatabase();

// ================== API ENDPOINTS ==================

// GET /api/db State
app.get("/api/db", (req, res) => {
  const dbState = readDatabase();
  res.json(dbState);
});

// POST /api/db/save Overwrite Entire Sandbox Sync
app.post("/api/db/save", (req, res) => {
  const incoming = req.body;
  const current = readDatabase();
  
  // Guard values safely
  const updated = {
    transactions: incoming.transactions || current.transactions,
    budgets: incoming.budgets || current.budgets,
    alerts: incoming.alerts || current.alerts,
    connectedAccounts: incoming.connectedAccounts || current.connectedAccounts,
    categorizationRules: incoming.categorizationRules || current.categorizationRules,
    settings: incoming.settings || current.settings,
    profile: incoming.profile || current.profile,
    documents: incoming.documents || current.documents,
    sessions: incoming.sessions || current.sessions,
    goals: incoming.goals || current.goals,
  };

  const success = writeDatabase(updated);
  if (success) {
    res.json({ status: "success", count: updated.transactions.length });
  } else {
    res.status(500).json({ error: "Failed to save data states on server" });
  }
});

// POST /api/scan-receipt Receipt scanning OCR with standard Gemini
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No receipt image provided." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Gemini API key is not configured on the server. Please check the 'Secrets' panel in Settings." 
      });
    }

    const base64Regex = /^data:(image\/\w+);base64,(.+)$/;
    const matches = image.match(base64Regex);
    let mimeType = "image/jpeg";
    let data = image;
    if (matches) {
      mimeType = matches[1];
      data = matches[2];
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data
          }
        },
        {
          text: "OCR Receipt Analysis: Extract the vendor name, total amount, transaction date, and choose the most relevant category from: 'Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendorName: {
              type: Type.STRING,
              description: "The name of the vendor/store or merchant, cleaned of branch IDs, terminal IDs, or timestamps."
            },
            totalAmount: {
              type: Type.NUMBER,
              description: "The total payment amount including tax and tips, as a floating-point number (e.g., 24.50)."
            },
            transactionDate: {
              type: Type.STRING,
              description: "The date of the transaction formatted strictly as YYYY-MM-DD. If a year is missing or unclear (e.g. only 'May 27'), assume current year 2026."
            },
            category: {
              type: Type.STRING,
              description: "The most fitting transaction category: 'Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'."
            }
          },
          required: ["vendorName", "totalAmount", "transactionDate", "category"]
        }
      }
    });

    const jsonStr = response.text ? response.text.trim() : "{}";
    const result = JSON.parse(jsonStr);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Receipt OCR scanning error:", error);
    res.status(505).json({ error: "Failed to scan receipt: " + (error.message || error) });
  }
});

// POST /api/db/reset Restore standards
app.post("/api/db/reset", (req, res) => {
  const success = writeDatabase(INITIAL_DB_STATE);
  if (success) {
    res.json({ status: "success", data: INITIAL_DB_STATE });
  } else {
    res.status(500).json({ error: "Failed to wipe server states" });
  }
});

// GET /api/banking/methods Specs
app.get("/api/banking/methods", (req, res) => {
  res.json([
    {
      id: "plaid",
      name: "Plaid Financial Router",
      type: "Aggregator Core",
      status: "operational",
      latency: "140ms",
      authFields: ["Client ID", "Secret Key"],
      endpoints: {
        balances: "https://sandbox.plaid.com/accounts/balance/get",
        transactions: "https://sandbox.plaid.com/transactions/sync",
        institutions: "https://sandbox.plaid.com/institutions/get_by_id"
      }
    },
    {
      id: "truelayer",
      name: "TrueLayer British OpenBanking",
      type: "PSD2 Compliance Tunnel",
      status: "operational",
      latency: "220ms",
      authFields: ["Auth Sandbox Token"],
      endpoints: {
        auth: "https://auth.truelayer-sandbox.com",
        data: "https://api.truelayer-sandbox.com/data/v1"
      }
    },
    {
      id: "chase_dev",
      name: "Chase Bank Direct OAuth Core",
      type: "Direct Core Bank API",
      status: "operational",
      latency: "85ms",
      authFields: ["Client Certification PIN"],
      endpoints: {
        authorize: "https://api.chase.com/developer/v2/oauth/authorize",
        accounts: "https://api.chase.com/developer/v2/accounts"
      }
    }
  ]);
});

// Simple server side merchant routing logic
function decodeCategory(description: string, rules: any[]): string {
  const norm = description.toLowerCase().trim();
  
  // Custom keyword rules
  for (const r of rules) {
    if (r.keyword && norm.includes(r.keyword.toLowerCase())) {
      return r.category;
    }
  }

  // Pre-configured dictionary
  if (norm.includes("starbucks") || norm.includes("coffee") || norm.includes("cafe")) return "Food & Dining";
  if (norm.includes("uber") || norm.includes("taxi") || norm.includes("fuel")) return "Transport";
  if (norm.includes("netflix") || norm.includes("spotify") || norm.includes("stream")) return "Entertainment";
  if (norm.includes("amazon") || norm.includes("nike") || norm.includes("mall")) return "Shopping";
  if (norm.includes("bill") || norm.includes("power") || norm.includes("electric")) return "Utilities";
  if (norm.includes("cvs") || norm.includes("pharmacy") || norm.includes("doctor")) return "Healthcare";
  if (norm.includes("salary") || norm.includes("paycheck") || norm.includes("freelance")) return "Income";
  return "Other";
}

// POST /api/banking/simulate-webhook Raw payloader
app.post("/api/banking/simulate-webhook", (req, res) => {
  const { description, amount, cardId } = req.body;
  if (!description || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment payload specs" });
  }

  const db = readDatabase();
  const matchedCard = db.connectedAccounts.find((c: any) => c.id === cardId);
  const selectedInstitution = matchedCard ? matchedCard.institution : "Generic Sandbox Sync";

  // 1. Resolve category
  const categoryResolved = decodeCategory(description, db.categorizationRules);

  // 2. Build Transaction
  const newTx = {
    id: `tx-srv-${Date.now()}`,
    amount,
    category: categoryResolved,
    description: `${description} (${selectedInstitution})`,
    type: categoryResolved === "Income" ? "income" : "expense",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: matchedCard ? matchedCard.paymentMethod : "Credit Card",
    tags: ["bank-synced", "server-webhook", selectedInstitution.toLowerCase().replace(/ /g, "-")]
  };

  // 3. Process database alterations
  db.transactions = [newTx, ...db.transactions];

  // Adjust card balance
  if (matchedCard) {
    const isExpense = newTx.type === "expense";
    const delta = newTx.amount;
    db.connectedAccounts = db.connectedAccounts.map((c: any) => {
      if (c.id === matchedCard.id) {
        const nextBal = isExpense ? c.balance - delta : c.balance + delta;
        return {
          ...c,
          balance: parseFloat(Math.max(0, nextBal).toFixed(2))
        };
      }
      return c;
    });
  }

  // 4. Verify trigger alerts
  const matchedBudget = db.budgets.find((b: any) => b.category === categoryResolved);
  if (matchedBudget) {
    // Re-verify spent
    const relevantTxs = db.transactions.filter((t: any) => t.category === categoryResolved && t.type === "expense");
    const totalSpent = relevantTxs.reduce((sum: number, t: any) => sum + t.amount, 0);
    matchedBudget.spent = parseFloat(totalSpent.toFixed(2));

    const overagePercentage = (matchedBudget.spent / matchedBudget.limit) * 100;
    if (overagePercentage >= matchedBudget.alertThreshold) {
      const isRed = overagePercentage >= 100;
      const alertId = `alert-srv-${Date.now()}`;
      const newAlert = {
        id: alertId,
        type: isRed ? "danger" : "warning",
        category: categoryResolved,
        message: isRed
          ? `SERVER-ALERT: Dynamic limit exceeded for [${categoryResolved}]. Spent $${matchedBudget.spent.toFixed(2)} of $${matchedBudget.limit.toFixed(2)}.`
          : `SERVER-ALERT: Approaching limit warning for [${categoryResolved}]. Spent $${matchedBudget.spent.toFixed(2)} (${overagePercentage.toFixed(0)}%) of $${matchedBudget.limit.toFixed(2)}.`,
        time: new Date().toISOString(),
        isRead: false
      };
      db.alerts = [newAlert, ...db.alerts];
    }
  }

  writeDatabase(db);
  res.json({ status: "success", transaction: newTx, accounts: db.connectedAccounts, alerts: db.alerts });
});

// ================== VITE MIDDLEWARE SETUP ==================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULLSTACK CORE] Express backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
