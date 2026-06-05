import React from "react";
import { Card } from "../ui/Card";

export const ReceiptScanningTips: React.FC = () => {
  return (
    <Card className="p-5 bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 leading-none font-semibold">
        Receipt scanning tips
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        This uses local mock scan data. To test different categories, rename your uploaded files to match keywords:
      </p>
      <ul className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold space-y-1.5 mt-4">
        <li>• Add <span className="text-indigo-600 dark:text-indigo-400">"starbucks"</span> in the name for coffee</li>
        <li>• Add <span className="text-indigo-600 dark:text-indigo-400">"zara"</span> in the name for clothing</li>
        <li>• Add <span className="text-indigo-600 dark:text-indigo-400">"shell"</span> in the name for fuel</li>
        <li>• Add <span className="text-indigo-600 dark:text-indigo-400">"boots"</span> in the name for pharmacy items</li>
      </ul>
    </Card>
  );
};
