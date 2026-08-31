import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Income } from "../../domain/incomes/income.types";
import { incomeApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";
import { useMockAuth } from "./MockAuthProvider";

export interface IncomeContextType {
  incomes: Income[];
  isLoading: boolean;
  errorMessage: string | null;
  addIncome: (income: Omit<Income, "id">) => Promise<void>;
  editIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  reloadIncomes: () => Promise<Income[]>;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const IncomeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currentUser, isAuthenticated } = useMockAuth();

  const reloadIncomes = useCallback(async () => {
    if (USES_HTTP_API && !isAuthenticated) {
      setIncomes([]);
      return [];
    }

    if (USES_HTTP_API) setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextIncomes = await incomeApi.listIncomes();
      setIncomes(nextIncomes);
      return nextIncomes;
    } catch {
      setErrorMessage("Could not load income from the backend.");
      setIncomes([]);
      return [];
    } finally {
      if (USES_HTTP_API) setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reloadIncomes();
  }, [currentUser?.id, reloadIncomes]);

  const value = useMemo<IncomeContextType>(
    () => ({
      incomes,
      isLoading,
      errorMessage,
      async addIncome(income) {
        try {
          await incomeApi.createIncome({
            ...income,
            entrySource: income.entrySource ?? "manual",
          });
          setIncomes(await incomeApi.listIncomes());
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not save that income entry.");
        }
      },
      async editIncome(id, updates) {
        try {
          setIncomes(await incomeApi.updateIncome(id, updates));
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not update that income entry.");
        }
      },
      async deleteIncome(id) {
        try {
          setIncomes(await incomeApi.deleteIncome(id));
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not delete that income entry.");
        }
      },
      reloadIncomes,
    }),
    [errorMessage, incomes, isLoading, reloadIncomes],
  );

  return (
    <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>
  );
};

export function useIncomes(): IncomeContextType {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error("useIncomes must be used within an IncomeProvider");
  }
  return context;
}
