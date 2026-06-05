import React, { useRef } from "react";
import { CheckCircle, Loader2, UploadCloud } from "lucide-react";
import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface ReceiptUploadPanelProps {
  dragActive: boolean;
  isScanning: boolean;
  scanStep: string;
  scanResult: MockOcrResult | null;
  assignedFilename: string;
  errorMessage: string;
  onDragStateChange: (type: string) => void;
  onFileSelect: (file: File | null) => void;
  onReset: () => void;
}

export const ReceiptUploadPanel: React.FC<ReceiptUploadPanelProps> = ({
  dragActive,
  isScanning,
  scanStep,
  scanResult,
  assignedFilename,
  errorMessage,
  onDragStateChange,
  onFileSelect,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(e.type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(e.type);
    onFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files?.[0] ?? null);
  };

  return (
    <Card
      className={`relative p-8 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer text-center ${
        dragActive
          ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/15"
          : "border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50/50 dark:bg-slate-900"
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />

      {isScanning ? (
        <div className="space-y-4 py-8 animate-pulse text-indigo-600 dark:text-indigo-400">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-current" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Scanning receipt</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">{scanStep}</p>
          </div>
        </div>
      ) : scanResult ? (
        <div className="space-y-4 py-6">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full inline-block">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Receipt scanned</h4>
            <p className="text-xs text-slate-400 mt-1">
              Expense details found in <span className="font-semibold text-slate-600 dark:text-slate-300">{assignedFilename}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 cursor-pointer"
          >
            Upload a different receipt
          </button>
        </div>
      ) : (
        <div className="space-y-4 py-8 animate-fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl inline-block border border-slate-100 dark:border-slate-800">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload Receipt</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-normal">
              Drag and drop a receipt, or browse for a file.
            </p>
            {errorMessage && (
              <p className="text-xs text-rose-500 mt-2 max-w-xs mx-auto leading-normal">{errorMessage}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center pt-2 select-none">
            <Badge tone="neutral">Starbucks</Badge>
            <Badge tone="neutral">Lidl</Badge>
            <Badge tone="neutral">Zara</Badge>
            <Badge tone="neutral">Shell</Badge>
            <Badge tone="neutral">Boots</Badge>
          </div>
        </div>
      )}
    </Card>
  );
};
