import React from "react";
import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { formatCurrency } from "../../lib/formatCurrency";
import { formatDate } from "../../lib/formatDate";

interface OcrReceiptTicketProps {
  ocrResult: MockOcrResult;
}

export const OcrReceiptTicket: React.FC<OcrReceiptTicketProps> = ({ ocrResult }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-3 leading-tight select-none">
      <div className="text-center font-bold pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
        <h4 className="text-sm uppercase tracking-tight">{ocrResult.merchant}</h4>
        <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">{formatDate(ocrResult.date)}</span>
      </div>

      <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
        {ocrResult.detectedItems.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="truncate pr-2">{item.name}</span>
            <span>{formatCurrency(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1">
        <span>AGGR SUM TOTAL</span>
        <span>{formatCurrency(ocrResult.amount)}</span>
      </div>
      
      <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest pt-3 leading-none">
        --- Thank you ---
      </p>
    </div>
  );
};
