import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, Link2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useFeedback } from "../../../app/providers/FeedbackProvider";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { canImportFromAccount, getAccountTypeLabel } from "../../../domain/accounts/account.rules";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";
import { useConnectedAccountWorkflow } from "../hooks/useConnectedAccountWorkflow";

interface ConnectedAccountsPanelProps {
  accounts: ConnectedAccount[];
  onConnectAccounts: (providerId: string, accountIds: string[]) => void;
  onImportMockExpenses: (accountId: string) => Promise<void>;
  onReconnectAccount: (accountId: string) => Promise<void>;
  onRemoveAccount: (accountId: string) => void;
}

export const ConnectedAccountsPanel: React.FC<ConnectedAccountsPanelProps> = ({
  accounts,
  onConnectAccounts,
  onImportMockExpenses,
  onReconnectAccount,
  onRemoveAccount,
}) => {
  const { confirmAction, showInfo } = useFeedback();
  const [detailsAccountId, setDetailsAccountId] = useState<string | null>(null);
  const [reconnectingAccountId, setReconnectingAccountId] = useState<string | null>(null);
  const workflow = useConnectedAccountWorkflow({ onConnectAccounts });

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

  const detailsAccount = accounts.find((account) => account.id === detailsAccountId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Connected Accounts</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect read-only mock accounts to import expenses.
          </p>
        </div>
        <button
          onClick={workflow.startConnection}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer self-start sm:self-center"
        >
          <Link2 className="w-3.5 h-3.5" /> Connect account
        </button>
      </div>

      {workflow.step !== "idle" && (
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

      {accounts.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <ShieldCheck className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h5 className="text-sm font-bold text-slate-900 dark:text-white">No accounts connected yet.</h5>
          <p className="text-xs text-slate-400 mt-1">
            Connect a read-only mock account to import expenses.
          </p>
          <button onClick={workflow.startConnection} className="mt-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl">
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
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Mock balance</span>
                    <span className="block text-xs font-extrabold text-slate-900 dark:text-white font-mono">{formatCurrency(account.balance)}</span>
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase">Read-only</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
                  <span>Status: <strong className="text-slate-600 dark:text-slate-300">{status.replace("_", " ")}</strong></span>
                  <span>Last import: <strong className="text-slate-600 dark:text-slate-300">{account.lastImportedAt ? formatDate(account.lastImportedAt) : "Never"}</strong></span>
                  <span>Imported: <strong className="text-slate-600 dark:text-slate-300">{account.importedExpenseCount || 0}</strong></span>
                  <span>Mode: <strong className="text-slate-600 dark:text-slate-300">Mock</strong></span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {account.lastImportMessage || "No expenses imported yet."}
                  </p>
                  <p className="mt-1">
                    Last result: {account.lastImportedCount || 0} imported, {account.lastSkippedDuplicateCount || 0} skipped, {account.lastImportFailedCount || 0} failed.
                  </p>
                </div>

                {detailsAccount?.id === account.id && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    This mock account is read-only. It can import sample expenses, but it cannot move money or change real account balances.
                  </div>
                )}

                {reconnectingAccountId === account.id && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <p className="font-bold">Access needs to be refreshed before importing.</p>
                    <p className="mt-1 leading-relaxed">This simulates provider authorization and does not import expenses.</p>
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
                    {status === "importing" ? "Importing" : "Import expenses"}
                  </button>
                  <button onClick={() => setReconnectingAccountId(account.id)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
        Demo Mode: connected accounts are simulated and read-only. No real banking APIs are used, and no payments can be made.
      </p>
    </div>
  );
};
