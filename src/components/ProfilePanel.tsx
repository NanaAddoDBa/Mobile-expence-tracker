import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  FileText, 
  Bell, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Download, 
  Eye, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  HelpCircle, 
  LogOut, 
  Sliders, 
  CloudLightning, 
  Smartphone, 
  Compass, 
  Terminal, 
  EyeOff, 
  Share2, 
  Key, 
  Database, 
  CheckSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectedAccount, CategorizationRule, Category, Transaction, Alert, UserProfile, StatementDocument, UserSession } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';

interface ProfilePanelProps {
  activeMenuTab?: 'profile' | 'app' | 'rules' | 'access' | 'security' | 'features';
  onActiveMenuTabChange?: (tab: 'profile' | 'app' | 'rules' | 'access' | 'security' | 'features') => void;
  connectedAccounts: ConnectedAccount[];
  categorizationRules: CategorizationRule[];
  onAddAccount: (acc: Omit<ConnectedAccount, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddRule: (rule: Omit<CategorizationRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onIngestTransaction: (newTx: Omit<Transaction, 'id'>) => void;
  onForceServerSync: () => Promise<void>;
  onResetServerDb: () => Promise<void>;
  
  serverSettings: {
    currency: string;
    serverSyncFrequency: string;
    plaidClientId: string;
    plaidSecret: string;
    trueLayerToken: string;
    notificationsEnabled: boolean;
  };
  onSaveServerSettings: (settings: any) => Promise<void>;
  syncStatus: 'synced' | 'syncing' | 'error';
  isAutoEmulating: boolean;
  onToggleAutoEmulation: () => void;
  onTriggerRandomExpense: () => void;
  alerts: Alert[];
  onClearAlerts: () => void;

  // Custom added profile states
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  documents: StatementDocument[];
  onAddDocument: (doc: StatementDocument) => void;
  onDeleteDocument: (id: string) => void;
  sessions: UserSession[];
  onUpdateSessions: (sessions: UserSession[]) => void;
  onLogout: () => void;
}

const AVATAR_TEMPLATES = ["💼", "🚀", "🐼", "🦊", "👾", "🕵️‍♂️", "🌈", "⚡", "🔮", "🔥"];

export default function ProfilePanel({
  activeMenuTab: propActiveMenuTab,
  onActiveMenuTabChange,
  connectedAccounts,
  categorizationRules,
  onAddAccount,
  onDeleteAccount,
  onAddRule,
  onDeleteRule,
  onIngestTransaction,
  onForceServerSync,
  onResetServerDb,
  serverSettings,
  onSaveServerSettings,
  syncStatus,
  isAutoEmulating,
  onToggleAutoEmulation,
  onTriggerRandomExpense,
  alerts,
  onClearAlerts,
  userProfile,
  onUpdateUserProfile,
  documents,
  onAddDocument,
  onDeleteDocument,
  sessions,
  onUpdateSessions,
  onLogout
}: ProfilePanelProps) {
  // Master Category level selection linked to optional props
  const [localActiveMenuTab, setLocalActiveMenuTab] = useState<'profile' | 'app' | 'rules' | 'access' | 'security' | 'features'>('profile');

  const activeMenuTab = propActiveMenuTab || localActiveMenuTab;
  const setActiveMenuTab = (tab: 'profile' | 'app' | 'rules' | 'access' | 'security' | 'features') => {
    if (onActiveMenuTabChange) {
      onActiveMenuTabChange(tab);
    } else {
      setLocalActiveMenuTab(tab);
    }
  };

  // Mini Toast within the panel
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  // Profile Edit states
  const [profileName, setProfileName] = useState(userProfile?.name || 'Andy Bampoe');
  const [profileEmail, setProfileEmail] = useState(userProfile?.email || 'Andybampoe.ad@gmail.com');
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || '+44 7911 123456');
  const [profileAddress, setProfileAddress] = useState(userProfile?.address || '10 Downing St, London, UK');
  const [profileAvatar, setProfileAvatar] = useState(userProfile?.avatar || '💼');

  // Passcode Settings Edit state
  const [newPin, setNewPin] = useState('');
  const [repeatPin, setRepeatPin] = useState('');
  const [pinChangeErr, setPinChangeErr] = useState<string | null>(null);

  // Dynamic Rule form states
  const [newKeyword, setNewKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<Category>('Food & Dining');

  // Dynamic Account creation states
  const [isAddingAcc, setIsAddingAcc] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccInstitution, setNewAccInstitution] = useState('Chase Bank');
  const [newAccMethod, setNewAccMethod] = useState<'Credit Card' | 'Debit Card' | 'Bank Transfer'>('Credit Card');

  // Klarna/Revolut styled gateway states
  const [secureBankTarget, setSecureBankTarget] = useState<any | null>(null);
  const [secureBankLoading, setSecureBankLoading] = useState(false);
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccLastFour, setNewAccLastFour] = useState('');
  const [newAccColor, setNewAccColor] = useState('indigo');

  // Input Credentials bindings for API Keys Settings (App Settings subtabs)
  const [plaidClientId, setPlaidClientId] = useState(serverSettings.plaidClientId);
  const [plaidSecret, setPlaidSecret] = useState(serverSettings.plaidSecret);
  const [trueLayerToken, setTrueLayerToken] = useState(serverSettings.trueLayerToken);
  const [notificationsEv, setNotificationsEv] = useState(serverSettings.notificationsEnabled);
  const [currency, setCurrency] = useState(serverSettings.currency || 'USD');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [devModeOpen, setDevModeOpen] = useState(false);

  // Document Statement Modal Previews
  const [previewDoc, setPreviewDoc] = useState<StatementDocument | null>(null);

  // Drag and Drop Simulator State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Voting Roadmap metrics
  const [votes, setVotes] = useState<Record<string, number>>({
    'p1': 48,
    'p2': 31,
    'p3': 12,
    'p4': 95
  });
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});

  const showShortFeedback = (msg: string) => {
    setActionDoneMsg(msg);
    setTimeout(() => {
      setActionDoneMsg(null);
    }, 2500);
  };

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress,
      avatar: profileAvatar
    };
    onUpdateUserProfile(updated);
    showShortFeedback('Personal profile information synchronized to server!');
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setPinChangeErr('PIN must be exactly 4 numbers');
      return;
    }
    if (newPin !== repeatPin) {
      setPinChangeErr('Passwords do not match');
      return;
    }
    setPinChangeErr(null);
    
    const updated: UserProfile = {
      ...userProfile,
      loginPin: newPin
    };
    onUpdateUserProfile(updated);
    setNewPin('');
    setRepeatPin('');
    showShortFeedback('Decryption Passcode successfully changed!');
  };

  // Sever secondary user sessions
  const handleSeverSession = (id: string) => {
    const nextSessions = sessions.filter(s => s.id !== id);
    onUpdateSessions(nextSessions);
    showShortFeedback('Revoked session. Decryption Token discarded from host.');
  };

  // Plaid Credential saver
  const handleSaveAppCredentials = async () => {
    setSaveStatus('saving');
    try {
      await onSaveServerSettings({
        plaidClientId,
        plaidSecret,
        trueLayerToken,
        notificationsEnabled: notificationsEv,
        currency
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      showShortFeedback('System API Sandbox credentials updated!');
    } catch {
      setSaveStatus('idle');
    }
  };

  // Upload receipts simulation uploader
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0].name, e.target.files[0].size);
    }
  };

  const processUploadedFile = (fileName: string, fileSize: number) => {
    const formattedSize = `${(fileSize / 1024).toFixed(1)} KB`;
    
    // Add artificial receipt statement
    const newDocObj: StatementDocument = {
      id: `doc-uploaded-${Date.now()}`,
      name: fileName,
      date: new Date().toISOString().split('T')[0],
      size: formattedSize,
      category: 'Receipt',
      downloadable: true
    };
    onAddDocument(newDocObj);
    showShortFeedback(`Ingested custom file "${fileName}". Matching database ledgers...`);

    // Ingest a dummy matching transaction for added interactivity!
    const randomAmount = Math.floor(Math.random() * 85) + 12.50;
    setTimeout(() => {
      onIngestTransaction({
        amount: randomAmount,
        category: 'Shopping',
        description: `Ingested Receipt: ${fileName.replace(/\.[^/.]+$/, "")}`,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Credit Card',
        tags: ['uploaded-doc', 'auto-scan']
      });
      showShortFeedback(`Automatically scanned transaction: $${randomAmount.toFixed(2)} recorded!`);
    }, 1500);
  };

  // Trigger JSON state export
  const handleExportDataJSON = () => {
    const databaseState = {
      userProfile,
      connectedAccounts,
      categorizationRules,
      documents,
      sessions,
      alerts
    };

    const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(databaseState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataString);
    downloadAnchor.setAttribute("download", `krypton_sandbox_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showShortFeedback('Successfully compiled and downloaded local DB.');
  };

  const handleVoteFeature = (featureId: string) => {
    if (hasVoted[featureId]) return;
    setVotes(p => ({
      ...p,
      [featureId]: p[featureId] + 1
    }));
    setHasVoted(p => ({
      ...p,
      [featureId]: true
    }));
    showShortFeedback('Thank you! Interest payload dispatched.');
  };

  // Add rule helper
  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onAddRule({
      keyword: newKeyword.trim(),
      category: newRuleCategory
    });
    setNewKeyword('');
    showShortFeedback(`Added router: "${newKeyword}" maps to ${newRuleCategory}`);
  };

  // Trigger new account
  const handleAddWalletAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(newAccBalance);
    if (!newAccName || isNaN(balanceNum)) return;

    onAddAccount({
      name: newAccName,
      institution: newAccInstitution,
      paymentMethod: newAccMethod,
      balance: balanceNum,
      lastFour: newAccLastFour || Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'connected',
      color: newAccColor
    });

    setNewAccName('');
    setNewAccBalance('');
    setNewAccLastFour('');
    setIsAddingAcc(false);
    showShortFeedback(`Wallet added: ${newAccName}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Absolute Dynamic Slide-Up Done Alert Notification */}
      <AnimatePresence>
        {actionDoneMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-5 right-5 z-45 bg-slate-900 border border-slate-800 text-white py-3 px-4 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionDoneMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header banner */}
      <div className="bg-slate-900 text-white p-5 pt-7 pb-6 rounded-b-[32px] shadow-md shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px]" />
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Main User Avatar template preview */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-emerald-950 border-2 border-slate-700/60 flex items-center justify-center text-3xl shadow-md">
            {profileAvatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-black text-white">{profileName}</h2>
              {syncStatus === 'synced' ? (
                <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Synced to backend DB" />
              ) : (
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Sync pending..." />
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{profileEmail}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> Ledger Decryption Active
            </span>
          </div>

          <button 
            onClick={onLogout}
            className="ml-auto p-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 rounded-xl transition duration-200"
            title="Dismount Credentials & Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Pills Menu selector */}
      <div className="flex gap-2 overflow-x-auto px-5 py-3 shrink-0 scrollbar-none border-b border-slate-200/50 dark:border-slate-900/65">
        {[
          { id: 'profile', label: '👤 Profile & Statements', icon: User },
          { id: 'app', label: '🏦 Bank Connections', icon: Settings },
          { id: 'rules', label: '🏷️ Category Rules', icon: Sliders },
          { id: 'access', label: '🎨 Appearance Style', icon: Compass },
          { id: 'security', label: '🔑 Passcode Security', icon: ShieldCheck },
          { id: 'features', label: '🗳️ Feature Wishlist', icon: Sparkles }
        ].map((item) => {
          const IconComponent = item.icon;
          const isSelected = activeMenuTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenuTab(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 ${
                isSelected 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Core Scroller body container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        {/* ===================== TAB 1: IDENTITY PROFILE ===================== */}
        {activeMenuTab === 'profile' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Personal Details Form */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-4">✏️ Edit My Profile Details</h3>
              <form onSubmit={handleSaveProfileInfo} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-2 px-3 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-2 px-3 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Mobile Number</label>
                    <input 
                      type="text" 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-100 bg-slate-50 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-2 px-3 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">My Avatar Picture</label>
                    <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none w-full">
                      {AVATAR_TEMPLATES.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setProfileAvatar(emoji)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm shrink-0 border ${
                            profileAvatar === emoji 
                              ? 'bg-emerald-50/70 border-emerald-500 text-slate-950 font-bold dark:bg-emerald-950/40' 
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Physical Address</label>
                  <input 
                    type="text" 
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-2 px-3 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 border border-slate-800 text-white dark:bg-white dark:text-slate-950 hover:bg-emerald-600 rounded-lg text-[10px] font-bold py-2 px-3 shadow-xs uppercase tracking-wider"
                >
                  Save Profile Information
                </button>
              </form>
            </div>

            {/* Documents and Statements Registry */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <div className="flex justify-between items-center mb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Statements & Documents</h3>
                  <p className="text-[10px] text-slate-500">View and download statements or drop custom files.</p>
                </div>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>

              {/* Drag and Drop Box */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/40'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.json"
                />
                <CloudLightning className="w-6 h-6 text-emerald-400 mx-auto mb-1 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Drag & Drop file or Tap to browse</p>
                <p className="text-[9px] text-slate-550 mt-0.5">Instantly match receipts to sandbox transactions</p>
              </div>

              {/* Interactive document list */}
              <div className="mt-4 space-y-2">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/30 dark:border-slate-800/40"
                  >
                    <div className="flex gap-2 min-w-0">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-500 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                        <p className="text-[9px] text-slate-550 font-medium">
                          {doc.category} • {doc.date} • {doc.size}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1 px-1.5 text-[9px] text-indigo-500 hover:bg-indigo-100 rounded font-bold"
                        title="Quick Preview doc details"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => {
                          showShortFeedback(`Simulated file download: "${doc.name}" dispatched down to browser queue.`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 rounded"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: APP SYSTEM SETTINGS ===================== */}
        {activeMenuTab === 'app' && (
          <div className="space-y-6 animate-fade-in font-sans">
            
            {/* Preferences & Localization (Standard consumer preferences) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <h3 className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider mb-3">⚙️ Localization & Preferences</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 mb-4">
                Configure your active ledger currency visual symbols and toggle budget threshold warning notifications.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Standard Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-505 animate-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-slate-500 mb-1">Budget Alert Warnings</label>
                    <div className="flex items-center gap-2 h-10">
                      <input 
                        type="checkbox" 
                        id="notif-toggle-prop"
                        checked={notificationsEv}
                        onChange={(e) => setNotificationsEv(e.target.checked)}
                        className="rounded accent-indigo-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <label htmlFor="notif-toggle-prop" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        Enabled
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveAppCredentials}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-2xs"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved OK!' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>

            {/* Wallet accounts list mapping (Klarna / Revolut Style adaptation) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/55 dark:border-slate-800/85 space-y-6 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-150/40 dark:border-slate-800/50">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider">Connect Financial Institutions</h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">Secure Open Banking read-only pipelines powered by Plaid & TrueLayer.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddingAcc(!isAddingAcc)}
                  className="p-1.5 px-2 bg-emerald-550 hover:bg-emerald-600 rounded-lg flex items-center gap-1 text-[10px] font-black text-white shrink-0 shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Link Custom API
                </button>
              </div>

              {/* Grid of popular Revolut / Klarna supported banks */}
              <div className="space-y-2.5">
                <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest px-0.5">Popular Integrations Available</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { name: 'Chase Checking', inst: 'Chase Bank', l4: '2938', balance: 5240, color: 'indigo', logo: '🏦', bgClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' },
                    { name: 'Revolut Metal', inst: 'Revolut UK', l4: '1029', balance: 3410, color: 'indigo', logo: '💳', bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' },
                    { name: 'Monzo Neon', inst: 'Monzo Bank', l4: '8842', balance: 450, color: 'rose', logo: '⚡', bgClass: 'bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400' },
                    { name: 'Capital One Rewards', inst: 'Capital One', l4: '5401', balance: 1850, color: 'emerald', logo: '💎', bgClass: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400' },
                    { name: 'Barclays Premium', inst: 'Barclays Bank', l4: '1092', balance: 12500, color: 'indigo', logo: '🦅', bgClass: 'bg-sky-50 text-sky-500 dark:bg-sky-950/20 dark:text-sky-400' },
                    { name: 'Coinbase Custody', inst: 'Coinbase Inc', l4: 'BTC', balance: 14500, color: 'indigo', logo: '🪙', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' },
                    { name: 'Apple Cash Account', inst: 'Apple Inc', l4: '7749', balance: 650, color: 'slate', logo: '🍏', bgClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100' },
                    { name: 'Wells Fargo Plus', inst: 'Wells Fargo', l4: '0015', balance: 7520, color: 'orange', logo: '🐎', bgClass: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' }
                  ].map((bank) => (
                    <button
                      key={bank.name}
                      type="button"
                      onClick={() => {
                        setSecureBankTarget(bank);
                        setSecureBankLoading(true);
                        setTimeout(() => setSecureBankLoading(false), 800);
                      }}
                      className="border border-slate-200/50 dark:border-slate-800/80 p-3 rounded-2xl hover:border-slate-400 dark:hover:border-slate-600 hover:scale-105 active:scale-95 transition flex flex-col items-center justify-between text-center gap-1 shadow-3xs group"
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-3xs group-hover:bg-indigo-500 group-hover:text-white transition duration-200 ${bank.bgClass}`}>
                        {bank.logo}
                      </span>
                      <span className="text-[8.5px] font-black tracking-tight text-slate-450 leading-tight block truncate w-full uppercase mt-1.5">{bank.inst}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Open Banking API Link Authentication Modal Overlay */}
              <AnimatePresence>
                {secureBankTarget && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 font-sans">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-slate-900 border border-slate-800 text-white rounded-[28px] p-6 w-full max-w-sm space-y-5 shadow-2xl relative overflow-hidden"
                    >
                      {/* Geometric accent glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                      {secureBankLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                          <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Establishing Sandbox Gateway</span>
                            <p className="text-[10px] text-slate-450">Performing secure Open Banking handshakes with {secureBankTarget.inst}...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 text-center pb-1 border-b border-slate-800">
                            <span className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto shadow-inner">
                              {secureBankTarget.logo}
                            </span>
                            <h4 className="text-sm font-extrabold text-white">Authorize {secureBankTarget.inst} Account Feed</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                              You are connecting your <b>{secureBankTarget.name}</b> read-only statement to your Krypton Ledger workspace.
                            </p>
                          </div>

                          {/* Security Info Panel */}
                          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-350 uppercase select-none">Secure Open Banking handshakes</span>
                                <p className="text-[9px] text-slate-400 leading-tight">This pipeline is STRICTLY read-only. We cannot initiate payments, move funds, or change parameters.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-350 uppercase select-none">Encrypted Credentials</span>
                                <p className="text-[9px] text-slate-400 leading-tight">Your API authorization payloads are kept in a local closed loops sandbox.</p>
                              </div>
                            </div>
                          </div>

                          {/* Trigger Authorization action button */}
                          <div className="space-y-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                onAddAccount({
                                  name: secureBankTarget.name,
                                  institution: secureBankTarget.inst,
                                  paymentMethod: secureBankTarget.name.toLowerCase().includes('credit') ? 'Credit Card' : 'Debit Card',
                                  balance: secureBankTarget.balance,
                                  lastFour: secureBankTarget.l4,
                                  status: 'connected',
                                  color: secureBankTarget.color
                                });
                                setSecureBankTarget(null);
                                showShortFeedback(`Successfully linked Open Banking feed: ${secureBankTarget.name}!`);
                              }}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 rounded-xl text-xs font-black uppercase py-2.5 shadow-md tracking-wider transition duration-150"
                            >
                              Authorize Secure Connection
                            </button>
                            <button
                              type="button"
                              onClick={() => setSecureBankTarget(null)}
                              className="w-full bg-slate-800 hover:bg-slate-750 rounded-xl text-[10px] font-bold text-slate-400 py-2 transition"
                            >
                              Decline Connection
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {isAddingAcc && (
                <form onSubmit={handleAddWalletAccountSubmit} className="mb-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-3">
                  <p className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 select-none">Custom Open Banking Provider Sandbox</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Card/Wallet Name</label>
                      <input 
                        type="text" 
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        placeholder="E.g. Chase Checkings"
                        className="w-full bg-white dark:bg-slate-900 py-1.5 px-2.5 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Institution</label>
                      <input 
                        type="text" 
                        value={newAccInstitution}
                        onChange={(e) => setNewAccInstitution(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 py-1.5 px-2.5 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Wallet Type</label>
                      <select 
                        value={newAccMethod}
                        onChange={(e) => setNewAccMethod(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 py-1.5 px-2 border rounded-xl text-xs font-bold text-slate-850 dark:text-slate-250 border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Bank Transfer">Checking Account</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Starting Balance</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5000"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 py-1.5 px-2.5 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Last 4-digits</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        value={newAccLastFour}
                        onChange={(e) => setNewAccLastFour(e.target.value)}
                        placeholder="4295"
                        className="w-full bg-white dark:bg-slate-900 py-1.5 px-2.5 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-extrabold uppercase text-slate-500 mb-0.5 block">Visual Highlights</label>
                      <select 
                        value={newAccColor}
                        onChange={(e) => setNewAccColor(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 py-1.5 px-2 border rounded-xl text-xs font-bold text-slate-850 dark:text-slate-250 border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="indigo">Indigo Corporate</option>
                        <option value="emerald">Emerald Rewards</option>
                        <option value="purple">Amex Purple Metallic</option>
                        <option value="slate">Apple Titanium Steel</option>
                        <option value="rose">Pink Gold Exclusive</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-950 text-white font-bold text-[10px] py-1.5 uppercase rounded-xl hover:bg-emerald-550 transition"
                  >
                    Confirm custom Open Banking link
                  </button>
                </form>
              )}

              {/* Connected Lists */}
              <div className="space-y-2.5">
                <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest px-0.5">Active Synced Banking Streams ({connectedAccounts.length})</span>
                {connectedAccounts.map((acc) => {
                  const isCredit = acc.paymentMethod === 'Credit Card';
                  return (
                    <div 
                      key={acc.id} 
                      className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 shadow-3xs transition-all duration-300"
                    >
                      <div className="flex gap-3 items-center min-w-0">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                          isCredit 
                            ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-450' 
                            : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}>
                          {acc.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight">{acc.name}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="API Status details: Healthy Stream connection" />
                          </div>
                          <p className="text-[9px] text-slate-450 mt-0.5 flex items-center gap-1">
                            <span className="font-semibold uppercase truncate">{acc.institution}</span>
                            <span>•</span>
                            <span className="font-mono">•••• {acc.lastFour}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="block text-xs font-black text-slate-800 dark:text-slate-100 font-sans">
                            {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : 'C$'}
                            {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[7.5px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded uppercase block mt-0.5 tracking-wider font-sans leading-none">
                            Synced Read-Only
                          </span>
                        </div>
                        <button 
                          onClick={() => onDeleteAccount(acc.id)}
                          className="text-slate-350 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 p-2 rounded-xl transition"
                          title="Sever bank stream connection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extended Collapsible Developer Console (Admin Tools nicely packaged) */}
            <div className="border border-slate-200/80 dark:border-slate-850 rounded-[28px] overflow-hidden shadow-3xs bg-white dark:bg-slate-900 font-sans">
              <button
                type="button"
                onClick={() => setDevModeOpen(!devModeOpen)}
                className="w-full flex items-center justify-between p-4 px-5 bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-950 text-slate-650 dark:text-slate-350 font-black text-xs uppercase tracking-wider transition select-none"
              >
                <span className="flex items-center gap-2 text-[10px] text-indigo-550 dark:text-indigo-400 font-extrabold">
                  <Terminal className="w-4 h-4 text-indigo-500 shrink-0" />
                  🔧 Technical Sandbox & Developer Testing
                </span>
                <span className="text-[10px] font-black">{devModeOpen ? "Collapse ▴ " : "Expand ▾"}</span>
              </button>

              {devModeOpen && (
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-850 space-y-5 animate-fade-in text-slate-750 dark:text-slate-305">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Testing & Simulation Convenience</span>
                      <p className="text-[10px] text-slate-605 dark:text-slate-400 leading-relaxed font-medium">
                        A typical consumer of micro-budgeting would NEVER need raw API integrations like Plaid client configurations, disaster database reseeding, or continuous charge emulators in their settings tab. They are gathered here solely for your development convenience in the AI Studio cloud workspace, in order to rapidly test extreme overspending calculations, trigger instant state resets, or load remote server state. We have packed them cleanly into this toggle so that standard users get only a clean, simple, and clutter-free software experience.
                      </p>
                    </div>
                  </div>

                  {/* Real-time Webhook Streamer Control */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-850 space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Real-time Charge Simulation</span>
                      <p className="text-[10px] text-slate-500 leading-tight">Simulate background transaction swiping sequences to test notifications, thresholds, and limits dynamic updates.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="tab-sim-trigger-expense"
                        onClick={() => {
                          onTriggerRandomExpense();
                          showShortFeedback("Dispatched single swipe charge notification!");
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-205 text-white dark:text-slate-900 rounded-xl text-[10px] font-bold transition active:scale-95 shadow-xs uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> Single Manual Swipe
                      </button>

                      <button
                        type="button"
                        id="tab-sim-toggle-feed"
                        onClick={() => {
                          onToggleAutoEmulation();
                          showShortFeedback(isAutoEmulating ? "Stopped emulation ticker." : "Continuous streamer enabled! (swipes every 6s)");
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-bold transition uppercase tracking-wider ${
                          isAutoEmulating
                            ? 'bg-rose-500 hover:bg-rose-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isAutoEmulating ? 'Stop Stream Feed' : 'Start Auto Feed'}
                      </button>
                    </div>

                    {isAutoEmulating && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse mt-2 text-center flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 py-1.5 rounded-lg border border-emerald-500/10">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" /> Continuous streamer ticker active (adds transaction updates every 6 seconds).
                      </p>
                    )}
                  </div>

                  {/* System Sandbox Credentials Overrides */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-850 space-y-3.5">
                    <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">API Integration Sandbox Keys</span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Plaid Sandbox Client ID</label>
                        <input 
                          type="text" 
                          value={plaidClientId}
                          onChange={(e) => setPlaidClientId(e.target.value)}
                          className="w-full text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-505 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Plaid Sandbox Secret Protocol</label>
                        <input 
                          type="password" 
                          value={plaidSecret}
                          onChange={(e) => setPlaidSecret(e.target.value)}
                          className="w-full text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-505 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">TrueLayer Public Open Sandbox Token</label>
                        <input 
                          type="text" 
                          value={trueLayerToken}
                          onChange={(e) => setTrueLayerToken(e.target.value)}
                          className="w-full text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-505 shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAppCredentials}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-[10px] py-1.5 uppercase rounded-xl transition tracking-wide"
                    >
                      Update Keys Sandbox
                    </button>
                  </div>

                  {/* Seed Resets & Recovers */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-850 space-y-2">
                    <span className="text-[9px] font-bold text-rose-500 dark:text-rose-450 uppercase tracking-wider block">Factory Database Seeds</span>
                    <p className="text-[10px] text-slate-505">Force synchronization to restore standard testing templates or purge ledger cache files.</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await onForceServerSync();
                          showShortFeedback("Successfully pulled master database from server-db.json!");
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-[9px] font-bold text-slate-655 dark:text-slate-300 transition active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3 text-indigo-500" /> Pull Server DB
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Restore factory database? This wipes all custom simulated transactions and profile data.")) {
                            await onResetServerDb();
                            showShortFeedback("Restored factory fresh ledger states on server.");
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[9px] font-bold transition active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" /> Factory DB Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: SMART ROUTING RULES ===================== */}
        {activeMenuTab === 'rules' && (
          <div className="space-y-6 animate-fade-in">
            {/* Automatic Categorizer Keywords mapping */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <div className="flex justify-between items-center mb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Dynamic Categorization Hooks</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Incoming Webhooks that match these keywords automatically class into selected budgets.
                  </p>
                </div>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddNewRule} className="mb-4 flex gap-2">
                <input 
                  type="text" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Keyword: e.g. Deliveroo" 
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 px-2 py-1.5 rounded-lg text-xs font-bold"
                  required
                />
                <select 
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value as Category)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 p-1.5 rounded-lg text-xs font-bold w-32"
                >
                  {INITIAL_CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button 
                  type="submit"
                  className="p-2 bg-emerald-500 hover:bg-emerald-650 rounded-lg text-slate-955"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Display tags registry */}
              <div className="flex flex-wrap gap-2">
                {categorizationRules.map((rule) => (
                  <div key={rule.id} className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-full border border-slate-200/40 dark:border-slate-850/50">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-250">
                      "{rule.keyword}" → <span className="text-emerald-500 dark:text-emerald-400">{rule.category}</span>
                    </span>
                    <button 
                      onClick={() => {
                        onDeleteRule(rule.id);
                        showShortFeedback(`Removed keyword identifier rule: ${rule.keyword}`);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {categorizationRules.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic py-2">No router heuristics loaded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ACCESSIBILITY & LAYOUTS ===================== */}
        {activeMenuTab === 'access' && (
          <div className="space-y-6 animate-fade-in">
            {/* Visual customization settings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85 space-y-5">
              
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Appearance Config</h3>
                <p className="text-[10px] text-slate-505">Modify themes, scale coefficients, and highlight hues.</p>
              </div>

              {/* Highlights color */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-505 block">Theme Color Accentuation</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'emerald', label: 'Emerald Mint', colorClass: 'bg-emerald-500' },
                    { id: 'indigo', label: 'Indigo Tech', colorClass: 'bg-indigo-500' },
                    { id: 'rose', label: 'Rose Gold', colorClass: 'bg-rose-500' },
                    { id: 'amber', label: 'Amber Warmth', colorClass: 'bg-amber-500' },
                  ].map((colorObj) => {
                    const isPicked = (userProfile.avatar === '💼' && colorObj.id === 'emerald') || (userProfile.avatar === '🚀' && colorObj.id === 'indigo') || (userProfile.avatar === '🦊' && colorObj.id === 'amber'); // simulated
                    return (
                      <button
                        key={colorObj.id}
                        type="button"
                        onClick={() => {
                          showShortFeedback(`Simulated theme highlighted to: ${colorObj.label}`);
                        }}
                        className={`p-2 bg-slate-50 dark:bg-slate-950 border rounded-xl flex items-center gap-1.5 text-[9px] font-bold ${
                          isPicked ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-850'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${colorObj.colorClass}`} />
                        <span className="truncate">{colorObj.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font scale sizing which alters state callback */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-extrabold uppercase text-slate-505">
                  <span>Accessibility Font Scale Size</span>
                  <span className="text-emerald-500 font-black">{userProfile.accessibilityFontScale.toUpperCase()}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {['small', 'medium', 'large'].map((scaleId) => (
                    <button
                      key={scaleId}
                      type="button"
                      onClick={() => {
                        const updated: UserProfile = {
                          ...userProfile,
                          accessibilityFontScale: scaleId as any
                        };
                        onUpdateUserProfile(updated);
                        showShortFeedback(`Adapted accessibility font scale to: ${scaleId.toUpperCase()}`);
                      }}
                      className={`py-1.5 rounded-lg border text-[10px] font-black uppercase transition shrink-0 ${
                        userProfile.accessibilityFontScale === scaleId
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-black'
                          : 'border-slate-200 dark:border-slate-850 text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-950/60'
                      }`}
                    >
                      {scaleId}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal leading-relaxed">
                  Tip: Adjusting font size updates layout properties on all synchronized dashboard modules.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">High Contrast Layout Option</p>
                    <p className="text-[9px] text-slate-500">Raises text contrasts to conform to WCAG AAA levels.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={userProfile.accessibilityHighContrast}
                    onChange={(e) => {
                      const updated: UserProfile = {
                        ...userProfile,
                        accessibilityHighContrast: e.target.checked
                      };
                      onUpdateUserProfile(updated);
                      showShortFeedback(e.target.checked ? 'High contrast color profiles loaded.' : 'Standard layout colors restored.');
                    }}
                    className="accent-emerald-500 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">Visual Keyboard Highlights Key focus</p>
                    <p className="text-[9px] text-slate-500">Injects custom visual outlines on clickable elements.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={userProfile.accessibilityKeyboardFocus}
                    onChange={(e) => {
                      const updated: UserProfile = {
                        ...userProfile,
                        accessibilityKeyboardFocus: e.target.checked
                      };
                      onUpdateUserProfile(updated);
                      showShortFeedback(e.target.checked ? 'Keyboard element highlight overlays activated.' : 'Standard highlights.');
                    }}
                    className="accent-emerald-500 cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================== TAB 5: PRIVACY & PASSCODE ===================== */}
        {activeMenuTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            {/* Decryption Passcode */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-3">Update Ledger Passcode</h3>
              <form onSubmit={handleUpdatePasscode} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-extrabold uppercase text-slate-505 block mb-1">New 4-Digit PIN</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-950 py-1.5 px-3 border border-slate-200 dark:border-slate-850 rounded text-center font-bold tracking-widest text-xs"
                      placeholder="••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-extrabold uppercase text-slate-550 block mb-1">Confirm PIN</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      inputMode="numeric"
                      value={repeatPin}
                      onChange={(e) => setRepeatPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-950 py-1.5 px-3 border border-slate-200 dark:border-slate-850 rounded text-center font-bold tracking-widest text-xs"
                      placeholder="••••"
                      required
                    />
                  </div>
                </div>

                {pinChangeErr && (
                  <p className="text-[9px] text-rose-500 font-semibold">{pinChangeErr}</p>
                )}

                <button 
                  type="submit"
                  className="w-full text-slate-100 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-955 hover:text-white py-2 px-3 rounded text-[10px] uppercase font-bold"
                >
                  Change Lock Passcode
                </button>
              </form>
            </div>

            {/* Privacy preferences / export */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Privacy & Sandbox Control</h3>
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-855 dark:text-slate-205">Share Anonymous Telemetry compilation</p>
                    <p className="text-[9px] text-slate-500">Transmits anonymous crash logs containing sandbox bugs.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={userProfile.telemetryLogsEnabled}
                    onChange={(e) => {
                      const updatedUserProfile: UserProfile = { ...userProfile, telemetryLogsEnabled: e.target.checked };
                      onUpdateUserProfile(updatedUserProfile);
                      showShortFeedback(e.target.checked ? 'Telemetry logs collection active.' : 'Telemetry compiled stopped.');
                    }}
                    className="accent-emerald-500 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-855 dark:text-slate-205">Compile Personalized Cookie Identifiers</p>
                    <p className="text-[9px] text-slate-505">Store temporary cookies locally to secure Sandbox connections.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={userProfile.cookieTrackingConsent}
                    onChange={(e) => {
                      const updatedUserProfile: UserProfile = { ...userProfile, cookieTrackingConsent: e.target.checked };
                      onUpdateUserProfile(updatedUserProfile);
                      showShortFeedback(e.target.checked ? 'Secure storage tracking cookies configured.' : 'Wiped link browser cookies.');
                    }}
                    className="accent-emerald-505 cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-2">
                <p className="text-[9px] text-slate-500">
                  By downloading your database, you export your connected cards listings, categorization rules, and current spending transactions list.
                </p>
                <button
                  onClick={handleExportDataJSON}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 font-black text-[10px] uppercase rounded-xl border border-slate-800 dark:border-slate-200"
                >
                  <Download className="w-4 h-4" /> Export Ledger States (JSON)
                </button>
              </div>
            </div>

            {/* Biometric Active Devices sessions */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Active Secure Sessions</h3>
                  <p className="text-[10px] text-slate-505">Revoke connected sessions or sever terminal authentication.</p>
                </div>
                <UsersGroupIcon className="w-4 h-3.5 text-indigo-400" />
              </div>

              <div className="space-y-2.5">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 flex justify-between items-center">
                    <div className="min-w-0 flex gap-2 items-center">
                      <div className="p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-lg shrink-0">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sess.deviceName}</p>
                        <p className="text-[9px] text-slate-500">
                          {sess.location} • {sess.ipAddress} • {sess.lastActive}
                        </p>
                      </div>
                    </div>
                    
                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleSeverSession(sess.id)}
                        className="py-1 px-2 border border-rose-200 dark:border-rose-950 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-[9px] font-bold"
                        title="Disconnect device token"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: NEW CORES & VOTING ROADMAP ===================== */}
        {activeMenuTab === 'features' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Newly Shipped capabilities */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-950/15 p-5 rounded-[24px] border border-emerald-500/10 dark:border-emerald-950/30">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-extrabold uppercase mb-2">
                New Shipped Releases (v2.5)
              </span>
              <h3 className="text-sm font-black text-slate-850 dark:text-white">Continuous Plaid Swiper Sandbox</h3>
              <p className="text-[10px] text-slate-655 dark:text-slate-400 leading-normal mt-1 leading-relaxed">
                We successfully established the Full-stack sqlite backup replication layers. When you update credentials, profiles, or trigger simulated continuous swipes, state reflects on our node.js middleware server in mock-realtime.
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-0.5">
                  <span className="text-[9px] font-bold text-emerald-500">✓ SQLite REST API</span>
                  <p className="text-[9px] text-slate-550 leading-relaxed">Continuous syncing of categories, alerts, and wallets variables.</p>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-0.5">
                  <span className="text-[9px] font-bold text-indigo-500">✓ MFA Identity Gate</span>
                  <p className="text-[9px] text-slate-550 leading-relaxed">Simulated cryptographic pin encryption to seal files logs.</p>
                </div>
              </div>
            </div>

            {/* Voting roadmap */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85">
              <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2">Upcoming Features Vote</h3>
              <p className="text-[10.5px] text-slate-500 mb-4 leading-normal">
                Determine what features our sandbox middleware engineers implement next. Press like to cast payload votes:
              </p>

              <div className="space-y-3">
                {[
                  { id: 'p1', title: 'Deep Neural AI Category Classifier', subtitle: 'Uses localized Gemini API parameters to automatically split grocery stores tags.' },
                  { id: 'p2', title: 'Real Plaid Link Integration', subtitle: 'Replace sandboxes with real account feeds and secure bank tokens.' },
                  { id: 'p3', title: 'Interactive CSV Ledger Importation', subtitle: 'Convert standard bank sheets exports down to Krypton templates.' },
                  { id: 'p4', title: 'Cryptocurrency Asset Linkers', subtitle: 'Link hardware ledger keys to watch BTC and ETH valuations.' },
                ].map((roadmapObj) => {
                  const alreadyVoted = hasVoted[roadmapObj.id];
                  return (
                    <div 
                      key={roadmapObj.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/30 dark:border-slate-800/50 flex justify-between items-center"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-150">{roadmapObj.title}</p>
                        <p className="text-[9px] text-slate-550 leading-relaxed mt-0.5">{roadmapObj.subtitle}</p>
                      </div>
                      
                      <button
                        onClick={() => handleVoteFeature(roadmapObj.id)}
                        className={`px-3 py-1.5 rounded-lg shrink-0 text-[10px] font-bold transition flex items-center gap-1.5 ${
                          alreadyVoted 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' 
                            : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 active:scale-95'
                        }`}
                      >
                        <span>👍</span>
                        <span>{votes[roadmapObj.id]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===================== SIMULATED DOCUMENT PREVIEW MODAL ===================== */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-[28px] max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Heading */}
            <div className="p-4 bg-slate-50 dark:bg-slate-955 border-b border-slate-200/50 dark:border-slate-850/60 flex justify-between items-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 p-1 px-2.5 rounded-full">
                <FileText className="w-3 h-3" /> Secure Certificate
              </span>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-rose-500 transition text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{previewDoc.name}</h4>
                <p className="text-[9px] text-slate-505 font-medium uppercase font-mono">SHA-256 Digest Certificate</p>
              </div>

              <div className="border border-slate-150 dark:border-slate-850 rounded-xl p-3 bg-slate-50 dark:bg-slate-950 font-mono text-[8px] space-y-1.5 text-slate-500 overflow-x-auto">
                <p><span className="text-slate-400 font-bold">Issuer:</span> Krypton Sandbox Middleware Engine v2.5</p>
                <p><span className="text-slate-400 font-bold">Encrypted Size:</span> {previewDoc.size}</p>
                <p><span className="text-slate-400 font-bold">Verified Date:</span> {previewDoc.date}</p>
                <p><span className="text-slate-400 font-bold">Verify Signature:</span> md5_fd88a6d923fcda129c9a0952cb2aee76b</p>
                <p><span className="text-slate-400 font-bold">Fingerprint Token:</span> sha256_6a42ebd2ddda11cba4fed582e98711352f75a6c0b396791e84</p>
              </div>

              <p className="text-[10px] text-slate-505 leading-relaxed text-center italic">
                Notice: Sandbox documents are generated locally within safety sandbox frames. To export files, use the PDF download proxies.
              </p>

              <button
                onClick={() => {
                  setPreviewDoc(null);
                  showShortFeedback(`Dispatched secure export payload for ${previewDoc.name}`);
                }}
                className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 py-2.5 rounded-xl font-bold text-xs uppercase"
              >
                Export certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Micro fallback icons
function UsersGroupIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
