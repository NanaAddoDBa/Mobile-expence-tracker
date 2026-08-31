import React from "react";
import { AccountConnectionProvider } from "./AccountConnectionProvider";
import { AppNavigationProvider } from "./AppNavigationProvider";
import { AppSettingsProvider } from "./AppSettingsProvider";
import { BudgetProvider } from "./BudgetProvider";
import { ExpenseProvider } from "./ExpenseProvider";
import { FeedbackProvider } from "./FeedbackProvider";
import { GoalProvider } from "./GoalProvider";
import { IncomeProvider } from "./IncomeProvider";
import { MockAuthProvider } from "./MockAuthProvider";
import { NotificationProvider } from "./NotificationProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
      <AppSettingsProvider>
        <AppNavigationProvider>
          <FeedbackProvider>
            <NotificationProvider>
              <BudgetProvider>
                <GoalProvider>
                  <ExpenseProvider>
                    <IncomeProvider>
                      <AccountConnectionProvider>{children}</AccountConnectionProvider>
                    </IncomeProvider>
                  </ExpenseProvider>
                </GoalProvider>
              </BudgetProvider>
            </NotificationProvider>
          </FeedbackProvider>
        </AppNavigationProvider>
      </AppSettingsProvider>
    </MockAuthProvider>
  );
}
