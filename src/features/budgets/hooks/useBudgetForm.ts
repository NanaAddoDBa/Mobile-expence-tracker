import { useState, useEffect } from "react";
import { validateBudget } from "../../../lib/validation/budgetValidation";
import {
  BudgetFormInitialData,
  BudgetFormSubmitPayload,
} from "../types/budgetForm.types";

export function useBudgetForm(
  onSubmit: (data: BudgetFormSubmitPayload) => void,
  initialData?: BudgetFormInitialData
) {
  const [category, setCategory] = useState("Food & Grocery");
  const [limitAmount, setLimitAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || "Food & Grocery");
      setLimitAmount(initialData.limitAmount != null ? String(initialData.limitAmount) : "");
    } else {
      setCategory("Food & Grocery");
      setLimitAmount("");
    }
    setErrors({});
  }, [initialData]);

  const handleSubmit = (): boolean => {
    const parsedLimit = parseFloat(limitAmount);
    const data: BudgetFormSubmitPayload = {
      category,
      limitAmount: parsedLimit,
    };

    const validation = validateBudget(data);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    onSubmit(data);
    setErrors({});
    return true;
  };

  return {
    category,
    setCategory,
    limitAmount,
    setLimitAmount,
    errors,
    handleSubmit,
  };
}
