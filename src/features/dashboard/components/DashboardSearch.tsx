import React, { useState } from "react";
import { Search } from "lucide-react";

interface DashboardSearchProps {
  onSearch: (query: string) => void;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({ onSearch }) => {
  const [localSearch, setLocalSearch] = useState("");

  const executeQuickSearch = () => {
    onSearch(localSearch);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      executeQuickSearch();
    }
  };

  return (
    <div className="flex items-center gap-2 max-w-sm w-full relative">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search merchant, notes or category..."
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          onKeyDown={handleSearchKeyPress}
          className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={executeQuickSearch}
        className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 py-2.5 px-3.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
      >
        Find
      </button>
    </div>
  );
};
