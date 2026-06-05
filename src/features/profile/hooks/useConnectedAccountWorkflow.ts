import { useMemo, useState } from "react";
import { AvailableMockAccount, MockAccountProvider } from "../../../domain/accounts/account.types";
import { accountConnectionService } from "../../accounts/services/accountConnectionService";

export type ConnectionStep =
  | "idle"
  | "consent"
  | "provider"
  | "auth"
  | "accounts"
  | "success"
  | "error";

interface UseConnectedAccountWorkflowOptions {
  onConnectAccounts: (providerId: string, accountIds: string[]) => void;
}

export function useConnectedAccountWorkflow({
  onConnectAccounts,
}: UseConnectedAccountWorkflowOptions) {
  const providers = useMemo<MockAccountProvider[]>(
    () => accountConnectionService.getAvailableProviders(),
    []
  );
  const [step, setStep] = useState<ConnectionStep>("idle");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState<AvailableMockAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const startConnection = () => {
    setErrorMessage("");
    setStep("consent");
  };

  const acceptConsent = async () => {
    try {
      await accountConnectionService.startConnection();
      setStep("provider");
    } catch {
      setErrorMessage("Connection setup failed. Please try again.");
      setStep("error");
    }
  };

  const chooseProvider = (providerId: string) => {
    setSelectedProviderId(providerId);
  };

  const continueToAuth = async () => {
    if (!selectedProviderId) return;
    setStep("auth");
    try {
      await accountConnectionService.simulateProviderAuthorization(selectedProviderId);
      const nextAccounts = accountConnectionService.getAvailableAccountsForProvider(selectedProviderId);
      setAvailableAccounts(nextAccounts);
      setSelectedAccountIds(nextAccounts.slice(0, 1).map((account) => account.id));
      setStep("accounts");
    } catch {
      setErrorMessage("Authorization failed. Please try again.");
      setStep("error");
    }
  };

  const selectAccountForConnection = (accountId: string) => {
    setSelectedAccountIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    );
  };

  const connectSelectedAccounts = () => {
    if (!selectedProviderId || selectedAccountIds.length === 0) return;
    onConnectAccounts(selectedProviderId, selectedAccountIds);
    setStep("success");
  };

  const closeWorkflow = () => {
    setStep("idle");
    setSelectedProviderId("");
    setAvailableAccounts([]);
    setSelectedAccountIds([]);
    setErrorMessage("");
  };

  const backToConsent = () => {
    setStep("consent");
  };

  const backToProvider = () => {
    setStep("provider");
    setAvailableAccounts([]);
    setSelectedAccountIds([]);
  };

  return {
    step,
    providers,
    errorMessage,
    selectedProviderId,
    availableAccounts,
    selectedAccountIds,
    startConnection,
    acceptConsent,
    chooseProvider,
    continueToAuth,
    selectAccountForConnection,
    connectSelectedAccounts,
    backToConsent,
    backToProvider,
    closeWorkflow,
  };
}
