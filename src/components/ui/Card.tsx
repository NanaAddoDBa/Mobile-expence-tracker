import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", id, ...props }) => {
  return (
    <div
      id={id}
      {...props}
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm p-6 overflow-hidden transition-all duration-200 hover:shadow-md/5 dark:hover:shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
};
