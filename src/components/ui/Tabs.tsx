import React from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  activeTab: T;
  items: readonly TabItem<T>[];
  onTabChange: (tab: T) => void;
}

export function Tabs<T extends string>({
  activeTab,
  items,
  onTabChange,
}: TabsProps<T>) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 scrollbar-none dark:bg-slate-900">
      {items.map((item) => {
        const selected = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(item.id)}
            className={`min-h-10 flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-center text-xs font-semibold leading-none tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              selected
                ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
