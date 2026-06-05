import { useEffect, useState } from "react";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { CreateExpenseModel } from "../../../domain/expenses/expense.types";
import { MockOcrResult } from "../../../domain/receipts/receipt.types";
import { mockReceiptOcrProvider } from "../../../services/adapters/mockReceiptOcrProvider";
import { receiptService } from "../services/receiptService";
import { createAppError } from "../../../lib/error/appError";
import { logger } from "../../../lib/logger";
import {
  ReceiptReviewFormValues,
  ReceiptScanStatus,
} from "../types/receiptForm.types";

const DEFAULT_REVIEW_VALUES: ReceiptReviewFormValues = {
  category: "Food & Grocery",
  accountSource: "acct-1",
  paymentMethod: "debit_card",
  notes: "",
};

export function useReceiptScanner(onCommit: (expense: CreateExpenseModel) => void) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ReceiptScanStatus>("idle");
  const [scanStep, setScanStep] = useState("");
  const [scanResult, setScanResult] = useState<MockOcrResult | null>(null);
  const [assignedFilename, setAssignedFilename] = useState("");
  const [reviewValues, setReviewValues] = useState<ReceiptReviewFormValues>(DEFAULT_REVIEW_VALUES);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!selectedReceipt || !selectedReceipt.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedReceipt);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedReceipt]);

  const updateReviewValue = <K extends keyof ReceiptReviewFormValues>(
    key: K,
    value: ReceiptReviewFormValues[K]
  ) => {
    setReviewValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetScanner = () => {
    setSelectedReceipt(null);
    setScanStatus("idle");
    setScanStep("");
    setScanResult(null);
    setAssignedFilename("");
    setReviewValues(DEFAULT_REVIEW_VALUES);
    setErrorMessage("");
  };

  const startScan = async (file = selectedReceipt): Promise<boolean> => {
    if (!file) return false;

    setSelectedReceipt(file);
    setAssignedFilename(file.name);
    setScanResult(null);
    setScanStatus("scanning");
    setErrorMessage("");

    const stages = receiptService.getScanStatusMessages();
    for (const stage of stages) {
      setScanStep(stage);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    try {
      const parsed = await mockReceiptOcrProvider.scanReceiptMock(file);
      const validation = receiptService.validateOcrResult(parsed);
      if (!validation.isValid) {
        setScanStatus("error");
        setErrorMessage("Could not scan this receipt. Try another file.");
        return false;
      }

      setScanResult(parsed);
      setReviewValues(receiptService.createReviewValues(parsed, file.name));
      setScanStatus("ready");
      return true;
    } catch (error) {
      logger.error("Receipt scan failed.", {
        error: createAppError("RECEIPT_SCAN_ERROR", "Could not scan receipt.", error),
        filename: file.name,
      });
      setScanStatus("error");
      setErrorMessage("Could not scan this receipt. Try another file.");
      return false;
    }
  };

  const selectReceiptFile = async (file: File | null): Promise<boolean> => {
    if (!file) return false;
    return startScan(file);
  };

  const simulatePhotoCapture = async (): Promise<boolean> => {
    const mockFile = new File(["mock receipt photo"], "mock-receipt-photo.png", {
      type: "image/png",
    });
    return selectReceiptFile(mockFile);
  };

  const handleDragState = (type: string) => {
    if (type === "dragenter" || type === "dragover") {
      setDragActive(true);
    } else if (type === "dragleave" || type === "drop") {
      setDragActive(false);
    }
  };

  const saveExpenseFromReceipt = (): boolean => {
    if (!scanResult || !assignedFilename) return false;

    const validation = receiptService.validateOcrResult(scanResult);
    if (!validation.isValid) {
      setErrorMessage("Could not save this receipt. Check the scan details and try again.");
      return false;
    }

    const payload = receiptService.createExpensePayload(scanResult, assignedFilename, reviewValues);
    onCommit(payload);
    resetScanner();
    return true;
  };

  return {
    dragActive,
    selectedReceipt,
    previewUrl,
    scanStatus,
    scanStep,
    scanResult,
    errorMessage,
    assignedFilename,
    reviewValues,
    isScanning: scanStatus === "scanning",
    ocrResult: scanResult,
    scanningStage: scanStep,
    formCategory: reviewValues.category,
    formAccount: reviewValues.accountSource,
    formPaymentMethod: reviewValues.paymentMethod,
    formNotes: reviewValues.notes,
    setFormCategory: (value: string) => updateReviewValue("category", value),
    setFormAccount: (value: string) => updateReviewValue("accountSource", value),
    setFormPaymentMethod: (value: string) =>
      updateReviewValue("paymentMethod", normalizePaymentMethod(value)),
    setFormNotes: (value: string) => updateReviewValue("notes", value),
    selectReceiptFile,
    simulatePhotoCapture,
    startScan,
    updateReviewValue,
    handleDragState,
    saveExpenseFromReceipt,
    commitRecord: saveExpenseFromReceipt,
    resetScanner,
  };
}
