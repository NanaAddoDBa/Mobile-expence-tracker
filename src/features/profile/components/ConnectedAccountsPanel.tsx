import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useFeedback } from "../../../app/providers/FeedbackProvider";
import {
  BankInstitution,
  ConnectedAccount,
  StartBankConnectionInput,
} from "../../../domain/accounts/account.types";
import { canImportFromAccount, getAccountTypeLabel } from "../../../domain/accounts/account.rules";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";
import { USES_HTTP_API } from "../../../services/api/apiMode";
import { useConnectedAccountWorkflow } from "../hooks/useConnectedAccountWorkflow";

interface ConnectedAccountsPanelProps {
  accounts: ConnectedAccount[];
  onConnectAccounts: (providerId: string, accountIds: string[]) => void;
  onListBankInstitutions?: (country: string) => Promise<BankInstitution[]>;
  onStartRealConnection: (input?: StartBankConnectionInput) => Promise<void>;
  onImportMockExpenses: (accountId: string) => Promise<void>;
  onReconnectAccount: (accountId: string) => Promise<void>;
  onRemoveAccount: (accountId: string) => void;
  realApiMode?: boolean;
}

const REAL_BANK_COUNTRIES = [
  { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "BE", label: "Belgium" },
  { code: "AT", label: "Austria" },
  { code: "PT", label: "Portugal" },
];

const DEFAULT_BANK_COUNTRY = "DE";
const MAX_VISIBLE_INSTITUTIONS = 12;

export const ConnectedAccountsPanel: React.FC<ConnectedAccountsPanelProps> = ({
  accounts,
  onConnectAccounts,
  onListBankInstitutions = async () => [],
  onStartRealConnection,
  onImportMockExpenses,
  onReconnectAccount,
  onRemoveAccount,
  realApiMode,
}) => {
  const { confirmAction, showInfo } = useFeedback();
  const [detailsAccountId, setDetailsAccountId] = useState<string | null>(null);
  const [reconnectingAccountId, setReconnectingAccountId] = useState<string | null>(null);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [bankCountry, setBankCountry] = useState(DEFAULT_BANK_COUNTRY);
  const [bankSearch, setBankSearch] = useState("");
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isStartingConnection, setIsStartingConnection] = useState(false);
  const [bankPickerError, setBankPickerError] = useState("");
  const workflow = useConnectedAccountWorkflow({ onConnectAccounts });
  const isRealApiMode = realApiMode ?? USES_HTTP_API;

  const handleRemove = async (account: ConnectedAccount) => {
    const confirmed = await confirmAction({
      title: "Remove connected account?",
      description: "Existing expenses will stay in your expense list.",
      confirmLabel: "Remove",
      variant: "danger",
    });

    if (confirmed) {
      onRemoveAccount(account.id);
    }
  };

  const loadBankInstitutions = async (nextCountry = bankCountry) => {
    setIsLoadingInstitutions(true);
    setBankPickerError("");

    try {
      const nextInstitutions = await onListBankInstitutions(nextCountry);
      setInstitutions(nextInstitutions);
      setSelectedInstitutionId((currentId) =>
        nextInstitutions.some((institution) => institution.id === currentId)
          ? currentId
          : ""
      );
    } catch {
      setInstitutions([]);
      setSelectedInstitutionId("");
      setBankPickerError("Could not load banks for this country.");
    } finally {
      setIsLoadingInstitutions(false);
    }
  };

  const openRealBankPicker = () => {
    setIsBankPickerOpen(true);
    setBankPickerError("");

    if (institutions.length === 0) {
      void loadBankInstitutions(bankCountry);
    }
  };

  const closeRealBankPicker = () => {
    setIsBankPickerOpen(false);
    setBankPickerError("");
    setSelectedInstitutionId("");
  };

  const handleConnectClick = () => {
    if (isRealApiMode) {
      openRealBankPicker();
      return;
    }

    workflow.startConnection();
  };

  const handleBankCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = event.target.value;
    setBankCountry(nextCountry);
    setBankSearch("");
    setSelectedInstitutionId("");
    void loadBankInstitutions(nextCountry);
  };

  const filteredInstitutions = useMemo(() => {
    const normalizedSearch = bankSearch.trim().toLowerCase();
    const nextInstitutions = normalizedSearch
      ? institutions.filter((institution) =>
          `${institution.name} ${institution.bic || ""}`.toLowerCase().includes(normalizedSearch)
        )
      : institutions;

    return nextInstitutions.slice(0, MAX_VISIBLE_INSTITUTIONS);
  }, [bankSearch, institutions]);

  const matchingInstitutionCount = useMemo(() => {
    const normalizedSearch = bankSearch.trim().toLowerCase();
    if (!normalizedSearch) return institutions.length;

    return institutions.filter((institution) =>
      `${institution.name} ${institution.bic || ""}`.toLowerCase().includes(normalizedSearch)
    ).length;
  }, [bankSearch, institutions]);

  const selectedInstitution = institutions.find(
    (institution) => institution.id === selectedInstitutionId
  );

  const handleStartSelectedBankConnection = async () => {
    if (!selectedInstitution) {
      setBankPickerError("Choose a bank to continue.");
      return;
    }

    setIsStartingConnection(true);
    setBankPickerError("");

    try {
      await onStartRealConnection({
        institutionId: selectedInstitution.id,
        country: bankCountry,
        userLanguage: "EN",
      });
    } catch {
      setBankPickerError("Could not start the bank connection.");
    } finally {
      setIsStartingConnection(false);
    }
  };

  const detailsAccount = accounts.find((account) => account.id === detailsAccountId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Connected Accounts</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRealApiMode
              ? "Connect read-only bank accounts to import real expenses."
              : "Connect read-only mock accounts to import expenses."}
          </p>
        </div>
        <button
          onClick={handleConnectClick}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer self-start sm:self-center"
        >
          <Link2 className="w-3.5 h-3.5" /> Connect account
        </button>
      </div>

      {!isRealApiMode && workflow.step !== "idle" && (
        <div className="p-4 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-2xl space-y-4">
          {workflow.step === "consent" && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Read-only mock connection</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This is a mock read-only connection. The app does not move money, approve payments,
                block payments, send payments, or stop payments. It only imports mock expenses for
                tracking and budgeting.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void workflow.acceptConsent()} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl">
                  Continue
                </button>
                <button onClick={workflow.closeWorkflow} className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {workflow.step === "provider" && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Choose provider</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {workflow.providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => workflow.chooseProvider(provider.id)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      workflow.selectedProviderId === provider.id
                        ? "border-indigo-300 bg-white dark:bg-slate-900"
                        : "border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">{provider.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-1">{provider.description}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void workflow.continueToAuth()}
                  disabled={!workflow.selectedProviderId}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
                >
                  Continue
                </button>
                <button onClick={workflow.backToConsent} className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                  Back
                </button>
                <button onClick={workflow.closeWorkflow} className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {workflow.step === "auth" && (
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              This simulates secure bank authorization. No real login details are needed.
            </div>
          )}

          {workflow.step === "accounts" && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Select accounts</h5>
              {workflow.availableAccounts.length === 0 && (
                <p className="rounded-xl bg-white p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  No accounts returned for this mock provider.
                </p>
              )}
              {workflow.availableAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={workflow.selectedAccountIds.includes(account.id)}
                  onClick={() => workflow.selectAccountForConnection(account.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                    workflow.selectedAccountIds.includes(account.id)
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10"
                      : "border-slate-100 bg-white hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
                  }`}
                >
                  <span>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">{account.name}</span>
                    <span className="block text-[10px] text-slate-400">{getAccountTypeLabel(account)} {account.lastFour ? `ending in ${account.lastFour}` : ""}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                    workflow.selectedAccountIds.includes(account.id)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}>
                    {workflow.selectedAccountIds.includes(account.id) ? "Selected" : "Select"}
                  </span>
                </button>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={workflow.connectSelectedAccounts}
                  disabled={workflow.selectedAccountIds.length === 0}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
                >
                  Connect selected
                </button>
                <button onClick={workflow.backToProvider} className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                  Back
                </button>
                <button onClick={workflow.closeWorkflow} className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {workflow.step === "error" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4" /> Connection failed
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {workflow.errorMessage || "The mock connection could not be completed."}
              </p>
              <button onClick={workflow.closeWorkflow} className="text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl">
                Close
              </button>
            </div>
          )}

          {workflow.step === "success" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Account connected
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can now import expenses from this mock account.
              </p>
              <button onClick={workflow.closeWorkflow} className="text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl">
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {isRealApiMode && isBankPickerOpen && (
        <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Select bank</h5>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Pick an institution to continue through the secure bank consent flow.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close bank picker"
              onClick={closeRealBankPicker}
              className="rounded-lg bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-700 dark:bg-slate-900 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr_auto]">
            <label className="space-y-1 text-[10px] font-bold uppercase text-slate-400">
              <span>Country</span>
              <select
                value={bankCountry}
                onChange={handleBankCountryChange}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold normal-case text-slate-700 outline-none transition-colors focus:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {REAL_BANK_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label} ({country.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-[10px] font-bold uppercase text-slate-400">
              <span>Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
                <input
                  value={bankSearch}
                  onChange={(event) => setBankSearch(event.target.value)}
                  placeholder="Search by bank name or BIC"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold normal-case text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                />
              </span>
            </label>

            <button
              type="button"
              onClick={() => void loadBankInstitutions(bankCountry)}
              disabled={isLoadingInstitutions}
              className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:text-indigo-600 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingInstitutions ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {bankPickerError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {bankPickerError}
            </div>
          )}

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {isLoadingInstitutions && (
              <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                Loading banks
              </div>
            )}

            {!isLoadingInstitutions &&
              filteredInstitutions.map((institution) => {
                const isSelected = selectedInstitutionId === institution.id;
                return (
                  <button
                    key={institution.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedInstitutionId(institution.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-indigo-300 bg-white shadow-sm dark:border-indigo-500/50 dark:bg-slate-900"
                        : "border-slate-100 bg-white/70 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        {institution.logo ? (
                          <img
                            src={institution.logo}
                            alt=""
                            className="h-7 w-7 object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                          {institution.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                          {institution.bic || institution.countries?.join(", ") || institution.id}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </button>
                );
              })}

            {!isLoadingInstitutions && institutions.length > 0 && matchingInstitutionCount === 0 && (
              <p className="rounded-xl bg-white p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No banks match that search.
              </p>
            )}

            {!isLoadingInstitutions && institutions.length === 0 && !bankPickerError && (
              <p className="rounded-xl bg-white p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No banks found for this country.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-indigo-100 pt-3 dark:border-indigo-900/40 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-[10px] font-semibold text-slate-400">
              {matchingInstitutionCount > MAX_VISIBLE_INSTITUTIONS
                ? `Showing ${MAX_VISIBLE_INSTITUTIONS} of ${matchingInstitutionCount} banks. Narrow the search to find more.`
                : selectedInstitution
                  ? `Selected: ${selectedInstitution.name}`
                  : "No bank selected"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleStartSelectedBankConnection()}
                disabled={!selectedInstitution || isStartingConnection || isLoadingInstitutions}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
              >
                {isStartingConnection ? "Opening bank" : "Continue to bank"}
              </button>
              <button
                type="button"
                onClick={closeRealBankPicker}
                className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <ShieldCheck className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h5 className="text-sm font-bold text-slate-900 dark:text-white">No accounts connected yet.</h5>
          <p className="text-xs text-slate-400 mt-1">
            {isRealApiMode
              ? "Connect a read-only bank account to sync real transactions."
              : "Connect a read-only mock account to import expenses."}
          </p>
          <button
            onClick={handleConnectClick}
            className="mt-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl"
          >
            Connect account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const status = account.status || (account.isConnected ? "connected" : "disconnected");
            const isImportDisabled = !canImportFromAccount(account);
            return (
              <div key={account.id} className="p-4 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{account.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {account.institutionName} {"\u2022"} {getAccountTypeLabel(account)} {account.lastFour ? `ending in ${account.lastFour}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {isRealApiMode ? "Current balance" : "Mock balance"}
                    </span>
                    <span className="block text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {isRealApiMode && !account.balanceUpdatedAt
                        ? "Awaiting sync"
                        : formatCurrency(account.balance)}
                    </span>
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase">Read-only</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
                  <span>Status: <strong className="text-slate-600 dark:text-slate-300">{status.replace("_", " ")}</strong></span>
                  <span>Last import: <strong className="text-slate-600 dark:text-slate-300">{account.lastImportedAt ? formatDate(account.lastImportedAt) : "Never"}</strong></span>
                  <span>Imported: <strong className="text-slate-600 dark:text-slate-300">{account.importedExpenseCount || 0}</strong></span>
                  <span>Mode: <strong className="text-slate-600 dark:text-slate-300">{isRealApiMode ? "Real" : "Mock"}</strong></span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {account.lastImportMessage || "No transactions synced yet."}
                  </p>
                  <p className="mt-1">
                    Last result: {account.lastImportedCount || 0} booked, {account.lastPendingCount || 0} pending, {account.lastSkippedDuplicateCount || 0} skipped, {account.lastImportFailedCount || 0} failed.
                  </p>
                </div>

                {detailsAccount?.id === account.id && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isRealApiMode
                      ? "This connection is read-only. It can sync booked expenses, income, pending transactions, and bank-reported balances, but it cannot move money."
                      : "This mock account is read-only. It can import sample expenses, but it cannot move money or change real account balances."}
                  </div>
                )}

                {reconnectingAccountId === account.id && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <p className="font-bold">Access needs to be refreshed before importing.</p>
                    <p className="mt-1 leading-relaxed">
                      {isRealApiMode
                        ? "You will be sent through the bank consent flow again."
                        : "This simulates provider authorization and does not import expenses."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void onReconnectAccount(account.id).then(() => setReconnectingAccountId(null));
                        }}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-bold text-white"
                      >
                        Continue reconnect
                      </button>
                      <button
                        type="button"
                        onClick={() => setReconnectingAccountId(null)}
                        className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-amber-700 dark:bg-slate-900 dark:text-amber-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isImportDisabled}
                    onClick={() => void onImportMockExpenses(account.id)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                  >
                    {status === "importing" ? "Syncing" : "Sync transactions"}
                  </button>
                  <button
                    onClick={() => {
                      if (isRealApiMode) {
                        void onReconnectAccount(account.id);
                        return;
                      }
                      setReconnectingAccountId(account.id);
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    Reconnect
                  </button>
                  <button onClick={() => setDetailsAccountId(detailsAccount?.id === account.id ? null : account.id)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Eye className="inline w-3 h-3 mr-1" /> View details
                  </button>
                  <button
                    onClick={() => {
                      void handleRemove(account);
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="inline w-3 h-3 mr-1" /> Remove account
                  </button>
                  {status === "needs_reconnect" && (
                    <button onClick={() => showInfo("Reconnect this account before importing expenses.")} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600">
                      Needs reconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl">
        {isRealApiMode
          ? "Real import mode: bank connections are read-only through GoCardless Bank Account Data. No payments can be made."
          : "Demo Mode: connected accounts are simulated and read-only. No real banking APIs are used, and no payments can be made."}
      </p>
    </div>
  );
};
