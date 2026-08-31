import {
  CurrencyCode,
  ExpenseCategory,
  IncomeCategory,
  TransactionDirection,
} from "@prisma/client";
import { normalizeGoCardlessTransaction } from "./transaction-normalizer";

describe("transaction normalizer", () => {
  it("normalizes booked outgoing GoCardless transactions into expenses", () => {
    const normalized = normalizeGoCardlessTransaction("account-1", {
      transactionId: "tx-1",
      bookingDate: "2026-08-07",
      creditorName: "Aldi",
      remittanceInformationUnstructured: "CARD Aldi groceries",
      bankTransactionCode: "PMNT",
      transactionAmount: {
        currency: "EUR",
        amount: "-24.75",
      },
    });

    expect(normalized).toMatchObject({
      providerTransactionId: "gocardless:account-1:tx-1",
      providerAccountId: "account-1",
      merchantName: "Aldi",
      description: "CARD Aldi groceries",
      amountMinor: 2475,
      direction: TransactionDirection.OUTFLOW,
      currency: CurrencyCode.EUR,
      normalizedCategory: ExpenseCategory.GROCERIES,
      normalizedIncomeCategory: null,
    });
  });

  it("normalizes incoming transactions into income", () => {
    const normalized = normalizeGoCardlessTransaction("account-1", {
      transactionId: "income",
      bookingDate: "2026-08-07",
      debtorName: "Example Employer",
      remittanceInformationUnstructured: "August payroll salary",
      transactionAmount: {
        currency: "EUR",
        amount: "1200.00",
      },
    });

    expect(normalized).toMatchObject({
      merchantName: "Example Employer",
      amountMinor: 120000,
      direction: TransactionDirection.INFLOW,
      normalizedCategory: null,
      normalizedIncomeCategory: IncomeCategory.SALARY,
    });
  });

  it("skips zero-value and non-EUR transactions", () => {
    expect(
      normalizeGoCardlessTransaction("account-1", {
        transactionId: "zero",
        bookingDate: "2026-08-07",
        transactionAmount: { currency: "EUR", amount: "0" },
      }),
    ).toBeNull();

    for (const currency of ["GBP", "USD", "CHF"]) {
      expect(
        normalizeGoCardlessTransaction("account-1", {
          transactionId: `unsupported-${currency}`,
          bookingDate: "2026-08-07",
          transactionAmount: {
            currency,
            amount: "-12.00",
          },
        }),
      ).toBeNull();
    }
  });
});
