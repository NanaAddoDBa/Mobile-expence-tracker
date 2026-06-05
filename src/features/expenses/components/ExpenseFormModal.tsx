import React from "react";
import { Modal } from "../../../components/ui/Modal";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { PaymentMethod } from "../../../domain/expenses/expense.types";
import {
  ExpenseFormInitialData,
  ExpenseFormSubmitPayload,
} from "../types/expenseForm.types";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { ExpenseForm } from "./ExpenseForm";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormSubmitPayload) => void;
  initialData?: ExpenseFormInitialData;
  accounts: ConnectedAccount[];
  categoryOptions: readonly string[];
  paymentMethods: readonly PaymentMethod[];
  title: string;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  accounts,
  categoryOptions,
  paymentMethods,
  title,
}) => {
  const form = useExpenseForm(onSubmit, initialData, accounts, isOpen);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <ExpenseForm
        form={form}
        accounts={accounts}
        categoryOptions={categoryOptions}
        paymentMethods={paymentMethods}
        submitLabel={initialData ? "Save Changes" : "Save Expense"}
      />
    </Modal>
  );
};
