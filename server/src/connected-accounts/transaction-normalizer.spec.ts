import {
  CurrencyCode,
  ExpenseCategory,
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
      currency: CurrencyCode.EUR,
      normalizedCategory: ExpenseCategory.GROCERIES,
    });
  });

  it("skips income and unsupported currency transactions", () => {
    expect(
      normalizeGoCardlessTransaction("account-1", {
        transactionId: "income",
        bookingDate: "2026-08-07",
        transactionAmount: {
          currency: "EUR",
          amount: "1200.00",
        },
      }),
    ).toBeNull();

    expect(
      normalizeGoCardlessTransaction("account-1", {
        transactionId: "unsupported-currency",
        bookingDate: "2026-08-07",
        transactionAmount: {
          currency: "CHF",
          amount: "-12.00",
        },
      }),
    ).toBeNull();
  });
});
