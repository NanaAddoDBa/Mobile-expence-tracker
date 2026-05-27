import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle, 
  Fingerprint, 
  Chrome, 
  ArrowRight, 
  UserPlus, 
  Check, 
  Smartphone, 
  Wallet, 
  HelpCircle, 
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (name: string, pin: string) => void;
  savedPin: string;
  savedName: string;
}

export default function LoginScreen({ onLoginSuccess, savedPin, savedName }: LoginScreenProps) {
  // Screen views: 'onboarding' | 'login' | 'signup'
  const [activeScreen, setActiveScreen] = useState<'onboarding' | 'login' | 'signup'>('onboarding');
  
  // Onboarding slider step index
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  // Profile Edit states
  const [name, setName] = useState(savedName || 'Andy Bampoe');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Google login modal simulator
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  // New account sign up states
  const [signUpName, setSignUpName] = useState('');
  const [signUpPin, setSignUpPin] = useState('');
  const [signUpConfirmPin, setSignUpConfirmPin] = useState('');

  const onboardingSlides = [
    {
      title: "Smart Budgeting Made Easy",
      description: "No complicated charts or accounting jargon. Experience full financial tracking that fits right in your palm.",
      icon: <Wallet className="w-12 h-12 text-emerald-450 mx-auto" />,
      tag: "Zero Learning Curves"
    },
    {
      title: "Automated Transaction Sync Feeds",
      description: "Connect and monitor bank statements, card logs, and cash flow automatically in real-time. Simply sync, plan, and analyze safely!",
      icon: <Smartphone className="w-12 h-12 text-indigo-450 mx-auto" />,
      tag: "Simulated Contactless Scanning Feed"
    },
    {
      title: "1-Click Secure Sandbox Wallet",
      description: "Connect standard banking APIs with zero latency. Safe, military-grade client-side encryption keeps credentials shielded.",
      icon: <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />,
      tag: "Encrypted Ledgers"
    }
  ];

  const handlePinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setError(null);
  };

  const handleSignUpPinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setSignUpPin(cleaned);
  };

  const handleSignUpConfirmPinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setSignUpConfirmPin(cleaned);
  };

  const executeLogin = (inputName: string, inputPin: string) => {
    const corePin = savedPin || '1234';
    if (inputPin === corePin || inputPin === '0000') {
      onLoginSuccess(inputName, inputPin);
    } else {
      setError('Invalid Sandbox PIN. Try the preset passcode "1234" or click Quick Sign-In.');
    }
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Passcode must be exactly 4 digits');
      return;
    }
    executeLogin(name, pin);
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleAccountSelect = (selectedName: string, email: string) => {
    setShowGoogleModal(false);
    // Google sign-in is instant and sets up standard name
    onLoginSuccess(selectedName, '1234');
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setError('Please provide a name');
      return;
    }
    if (signUpPin.length !== 4) {
      setError('PIN must be exactly 4 numbers');
      return;
    }
    if (signUpPin !== signUpConfirmPin) {
      setError('PIN confirmations do match');
      return;
    }

    // Success - log them in instantly with their custom credentials!
    onLoginSuccess(signUpName.trim(), signUpPin);
  };

  const handleQuickLogin = (pName: string, pPin: string) => {
    setName(pName);
    setPin(pPin);
    executeLogin(pName, pPin);
  };

  const handleBiometricAuth = () => {
    setIsBiometricAuthenticating(true);
    setTimeout(() => {
      setIsBiometricAuthenticating(false);
      executeLogin(name, savedPin || '1234');
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-955 text-slate-805 px-6 py-8 h-full overflow-y-auto relative font-sans transition-colors duration-300">
      
      {/* Decorative ambient backdrop gradients */}
      <div className="absolute top-0 left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-16 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand logo at the top */}
      <div className="text-center mt-3 mb-2 relative z-10">
        <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-1.5 text-slate-805">
          <ShieldCheck className="w-6 h-6 text-emerald-450" />
          KRYPTON<span className="text-emerald-450 font-medium font-sans">.</span>
        </h1>
        <p className="text-[10px] text-slate-450 uppercase tracking-widest font-extrabold mt-0.5">Simple Personal Money App</p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ==================== 1. ONBOARDING SCREEN ==================== */}
        {activeScreen === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="flex-1 flex flex-col justify-between py-4 relative z-10"
          >
            {/* Slide Info Graphics */}
            <div className="my-auto space-y-6 text-center max-w-xs mx-auto">
              <div className="p-3 bg-slate-905 border border-slate-850 rounded-[28px] max-w-[140px] mx-auto shadow-inner">
                {onboardingSlides[onboardingStep].icon}
              </div>

              <div className="space-y-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 uppercase tracking-wide">
                  {onboardingSlides[onboardingStep].tag}
                </span>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-805 px-2">
                  {onboardingSlides[onboardingStep].title}
                </h2>
                <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                  {onboardingSlides[onboardingStep].description}
                </p>
              </div>

              {/* Step indicator pills */}
              <div className="flex justify-center gap-1.5 pt-2">
                {onboardingSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setOnboardingStep(idx)}
                    className={`h-2 rounded-full transition-all duration-350 ${onboardingStep === idx ? 'w-6 bg-emerald-505' : 'w-2 bg-slate-205'}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions at the bottom of Onboarding */}
            <div className="space-y-3 max-w-sm w-full mx-auto mt-8">
              
              {/* Massive Quick Sign In with Google! */}
              <button
                type="button"
                id="btn-google-swipe"
                onClick={handleGoogleSignInClick}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-905 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-900 dark:text-slate-105 rounded-2xl py-3 px-4 text-xs font-black shadow-lg transition active:scale-98 border border-slate-200 dark:border-slate-805"
              >
                <Chrome className="w-4.5 h-4.5 text-indigo-505" />
                <span>Continue with Google Account</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingStep(0);
                    setActiveScreen('login');
                  }}
                  className="bg-slate-905 hover:bg-slate-105 border border-slate-850 text-slate-805 text-xs font-bold py-2.5 px-3 rounded-xl transition"
                >
                  Enter with PIN
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveScreen('signup');
                  }}
                  className="bg-emerald-505 hover:bg-emerald-450 text-slate-955 dark:text-slate-955 text-xs font-black py-2.5 px-3 rounded-xl shadow-md transition"
                >
                  New Account 🚀
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Direct bypass
                  onLoginSuccess('Andy Bampoe', '1234');
                }}
                className="block text-center text-[10px] text-slate-500 hover:text-slate-805 transition py-1 font-semibold underline"
              >
                Skip right to Sandbox Demo
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== 2. PIN SECURE LOGIN ==================== */}
        {activeScreen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="flex-1 flex flex-col justify-between py-4 relative z-10"
          >
            {/* Header info */}
            <div className="text-center my-2 space-y-1">
              <h2 className="text-lg font-black text-slate-805">🔐 Enter Security PIN</h2>
              <p className="text-[11px] text-slate-450">Type your private 4-digit passcode below to unlock your app</p>
            </div>

            {/* Card Badge preview for security */}
            <div className="my-4">
              <div className="max-w-xs mx-auto bg-slate-905 p-4 rounded-3xl border border-slate-850 shadow-md relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] tracking-widest text-slate-450 font-bold block">PERSONAL SECURITY CARD</span>
                    <span className="text-[11px] font-bold text-slate-805 mt-0.5 block flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-505" /> Krypton Safe Active
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-505" />
                </div>

                <div className="mt-6 flex gap-1.5 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx} 
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        pin.length > idx ? 'bg-emerald-505 scale-125 shadow-xs' : 'bg-slate-205'
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-6 text-[9px] text-slate-450 text-center font-mono">AUTHORIZED ID: {name}</p>
              </div>
            </div>

            {/* PIN Entry Form */}
            <form onSubmit={handleSubmitLogin} className="space-y-4 max-w-sm w-full mx-auto">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider mb-1">
                  My Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-905 border border-slate-850 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-805 font-bold placeholder-slate-405 focus:outline-none transition animate-none"
                  placeholder="E.g., Andy Bampoe"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider mb-1">
                  4-Digit PIN Passcode
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="w-full bg-slate-905 border border-slate-850 focus:border-emerald-500/50 rounded-xl pl-8.5 pr-8 py-2 text-center text-xs tracking-widest text-emerald-450 font-black focus:outline-none transition"
                    placeholder="••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2 text-slate-500 hover:text-slate-855"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-2.5 bg-rose-955 border border-rose-505/20 rounded-xl text-[10px] text-rose-505">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={isBiometricAuthenticating}
                  className="flex items-center justify-center p-2.5 bg-slate-905 hover:bg-slate-105 text-slate-450 hover:text-emerald-505 border border-slate-850 rounded-xl transition shrink-0"
                  title="Authenticate Face ID / Touch ID"
                >
                  <Fingerprint className={`w-4.5 h-4.5 ${isBiometricAuthenticating ? 'animate-pulse text-emerald-505' : ''}`} />
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-emerald-505 hover:bg-emerald-450 text-slate-955 rounded-xl text-xs font-black py-2.5 px-4 shadow-md transition uppercase tracking-wider"
                >
                  Login & Unlock Now!
                </button>
              </div>

              {/* Standard Switch options */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-850 mt-2 text-[10px] font-bold text-slate-450">
                <button onClick={() => setActiveScreen('onboarding')} type="button" className="hover:text-slate-805 transition">
                  ← Back to Tour
                </button>
                <button onClick={handleGoogleSignInClick} type="button" className="text-emerald-450 hover:text-emerald-505 transition flex items-center gap-1">
                  <Chrome className="w-3.5 h-3.5" /> Google Sign-In
                </button>
              </div>
            </form>

            {/* Quick prefill helps tester */}
            <div className="bg-slate-905 border border-slate-850 rounded-xl p-3 max-w-sm mt-4 mx-auto w-full">
              <p className="text-[9px] font-bold text-slate-450 flex items-center gap-1 uppercase mb-1.5">
                <Sparkles className="w-3 h-3 text-emerald-505" /> Presets (Skip Setup)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Andy Bampoe', '1234')}
                  className="text-[9px] p-2 bg-slate-955 hover:bg-slate-105 hover:border-emerald-500/30 rounded-lg border border-slate-850 text-left text-slate-805"
                >
                  <span className="block font-bold text-emerald-450">Andy Bampoe</span>
                  <span className="text-[8px] text-slate-450">Secure Pin: 1234</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Guest Auditor', '0000')}
                  className="text-[9px] p-2 bg-slate-955 hover:bg-slate-105 hover:border-emerald-500/30 rounded-lg border border-slate-850 text-left text-slate-805"
                >
                  <span className="block font-bold text-indigo-505">Guest Auditor</span>
                  <span className="text-[8px] text-slate-450">Unlock Pin: 0000</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 3. EASY SIGN-UP FORM ==================== */}
        {activeScreen === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="flex-1 flex flex-col justify-between py-4 relative z-10"
          >
            <div className="text-center my-2 space-y-1">
              <h2 className="text-lg font-black text-white">✍️ Create a Free Account</h2>
              <p className="text-[11px] text-slate-400">Safe and easy helper for your money. Set up in seconds!</p>
            </div>

            {/* Simple signup form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-4 max-w-sm w-full mx-auto my-auto">
              
              <div className="space-y-3 bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none transition"
                    placeholder="E.g., Andy Bampoe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Choose 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={signUpPin}
                      onChange={(e) => handleSignUpPinChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-center text-xs tracking-widest text-emerald-400 font-bold focus:outline-none transition"
                      placeholder="••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={signUpConfirmPin}
                      onChange={(e) => handleSignUpConfirmPinChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-center text-xs tracking-widest text-emerald-400 font-bold focus:outline-none transition"
                      placeholder="••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-2.5 bg-rose-950/40 border border-rose-900/40 rounded-xl text-[10px] text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black py-2.5 px-4 shadow-md transition uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4.5 h-4.5" /> Let's Go, Create My App!
              </button>

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1">
                <button onClick={() => setActiveScreen('onboarding')} type="button" className="hover:text-white transition">
                  ← Back
                </button>
                <button onClick={() => setActiveScreen('login')} type="button" className="text-white hover:underline transition">
                  Already have an account? Sign In
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-[9px] text-slate-550 leading-relaxed max-w-xxs mx-auto">
                By ticking sign up, you activate Krypton Local Database storage. All metrics stay stored exclusively on your browser sandbox database.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== SIMULATED GOOGLE ACCOUNT SELECT MODAL ===================== */}
      {showGoogleModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50 animate-fade-in font-sans">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-905 border border-slate-850 rounded-3xl p-5 w-full max-w-xs space-y-4"
          >
            <div className="text-center space-y-1">
              <Chrome className="w-8 h-8 text-indigo-505 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-805">Sign up with Google</h3>
              <p className="text-[10px] text-slate-450">Choose an account to continue to Krypton Money</p>
            </div>

            <div className="space-y-2 mt-2">
              {[
                { name: 'Andy Bampoe', email: 'Andybampoe.ad@gmail.com', desc: 'Current Active User' },
                { name: 'Andy Guest Workspace', email: 'andy.bampoe@google.com', desc: 'Enterprise Node' },
              ].map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleGoogleAccountSelect(account.name, account.email)}
                  className="w-full text-left p-3 rounded-xl bg-slate-955 hover:bg-slate-105 border border-slate-850 transition flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 bg-indigo-505 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase border border-slate-700">
                    {account.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-805 truncate">{account.name}</p>
                    <p className="text-[9px] text-slate-450 truncate">{account.email}</p>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const cust = window.prompt("Enter custom Google Account Username:", "Testing Agent");
                  if (cust) {
                    handleGoogleAccountSelect(cust, `${cust.toLowerCase().replace(/\s+/g, '')}@gmail.com`);
                  }
                }}
                className="w-full text-center py-2 border border-dashed border-slate-805 hover:border-slate-505 rounded-xl text-[10px] text-slate-450 font-bold transition mt-1"
              >
                + Link Another Google ID
              </button>
            </div>

            <button
              onClick={() => setShowGoogleModal(false)}
              className="w-full py-2 bg-slate-105 hover:bg-slate-205 rounded-xl text-[10px] font-bold text-slate-450 transition"
            >
              Cancel OAuth Simulation
            </button>
          </motion.div>
        </div>
      )}

      {/* Trust Pledge Footer */}
      <div className="mt-4 pt-3 border-t border-slate-850 relative z-10 text-center text-[9px] text-slate-450 flex justify-center items-center gap-1.5 max-w-sm mx-auto">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-505" />
        <span>Krypton Sandbox uses standard browser encryption protocols.</span>
      </div>
    </div>
  );
}
