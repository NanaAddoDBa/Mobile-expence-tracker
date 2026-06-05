import React from "react";
import { Sparkles } from "lucide-react";
import { ConnectedAccount } from "../../domain/accounts/account.types";
import { PaymentMethod } from "../../domain/expenses/expense.types";
import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { ReceiptReviewFormValues } from "../../features/receipts/types/receiptForm.types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { OcrClassificationForm } from "./OcrClassificationForm";
import { OcrReceiptTicket } from "./OcrReceiptTicket";

interface ReceiptReviewFormProps {
  scanResult: MockOcrResult;
  accounts: ConnectedAccount[];
  categoryOptions: string[];
  paymentMethods: readonly PaymentMethod[];
  reviewValues: ReceiptReviewFormValues;
  onReviewValueChange: <K extends keyof ReceiptReviewFormValues>(
    key: K,
    value: ReceiptReviewFormValues[K]
  ) => void;
  onSubmit: () => void;
}

export const ReceiptReviewForm: React.FC<ReceiptReviewFormProps> = ({
  scanResult,
  accounts,
  categoryOptions,
  paymentMethods,
  reviewValues,
  onReviewValueChange,
  onSubmit,
}) => {
  return (
    <Card className="p-6 border border-slate-100 dark:border-slate-800 animate-slide-up">
      <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800 mb-6 font-semibold">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-xl leading-none">
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Receipt Details
          </h3>
        </div>
        <Badge tone="success">{(scanResult.confidence * 100).toFixed(0)}% Match</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5">
          <OcrReceiptTicket ocrResult={scanResult} />
        </div>

        <div className="md:col-span-7 pr-1">
          <OcrClassificationForm
            ocrResult={scanResult}
            accounts={accounts}
            categoryOptions={categoryOptions}
            paymentMethods={paymentMethods}
            formCategory={reviewValues.category}
            setFormCategory={(value) => onReviewValueChange("category", value)}
            formAccount={reviewValues.accountSource}
            setFormAccount={(value) => onReviewValueChange("accountSource", value)}
            formPaymentMethod={reviewValues.paymentMethod}
            setFormPaymentMethod={(value) => onReviewValueChange("paymentMethod", value)}
            formNotes={reviewValues.notes}
            setFormNotes={(value) => onReviewValueChange("notes", value)}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </Card>
  );
};
