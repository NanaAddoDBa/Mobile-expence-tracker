import React from "react";
import { useConnectedAccounts } from "../../app/providers/AccountConnectionProvider";
import { useExpenses } from "../../app/providers/ExpenseProvider";
import { ReceiptReviewForm } from "../../components/receipts/ReceiptReviewForm";
import { ReceiptScanningTips } from "../../components/receipts/ReceiptScanningTips";
import { ReceiptUploadPanel } from "../../components/receipts/ReceiptUploadPanel";
import { PAYMENT_METHODS } from "../../domain/expenses/expense.constants";
import { useReceiptScanner } from "./hooks/useReceiptScanner";
import { useFeedback } from "../../app/providers/FeedbackProvider";

const categoryOptions = [
  "Food & Grocery",
  "Dining & Cafe",
  "Transport & Auto",
  "Housing & Utilities",
  "Entertainment & Leisure",
  "Shopping",
  "Healthcare",
  "Education & Kids",
  "Travel & Holiday",
  "Others",
];

export const ReceiptScannerView: React.FC = () => {
  const { addExpense } = useExpenses();
  const { accounts } = useConnectedAccounts();
  const { showSuccess } = useFeedback();
  const scanner = useReceiptScanner(addExpense);

  const handleSaveExpense = () => {
    if (scanner.saveExpenseFromReceipt()) {
      showSuccess("Expense added from receipt scan.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
          Receipt Scan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Upload a receipt, review mock scan details, then save it as an expense.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Receipt scanning uses local mock data only. Only the created expense is saved after review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ReceiptUploadPanel
            dragActive={scanner.dragActive}
            isScanning={scanner.isScanning}
            scanStep={scanner.scanStep}
            scanResult={scanner.scanResult}
            assignedFilename={scanner.assignedFilename}
            errorMessage={scanner.errorMessage}
            onDragStateChange={scanner.handleDragState}
            onFileSelect={(file) => {
              void scanner.selectReceiptFile(file);
            }}
            onReset={scanner.resetScanner}
          />

          {scanner.scanResult && (
            <ReceiptReviewForm
              scanResult={scanner.scanResult}
              accounts={accounts}
              categoryOptions={categoryOptions}
              paymentMethods={PAYMENT_METHODS}
              reviewValues={scanner.reviewValues}
              onReviewValueChange={scanner.updateReviewValue}
              onSubmit={handleSaveExpense}
            />
          )}
        </div>

        <div className="space-y-6">
          <ReceiptScanningTips />
        </div>
      </div>
    </div>
  );
};
