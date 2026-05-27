import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Compass, Wifi, Battery, Volume2, Moon, Sun } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  onThemeToggle?: () => void;
  isDarkTheme?: boolean;
  fontScale?: 'small' | 'medium' | 'large';
  highContrast?: boolean;
  keyboardFocus?: boolean;
  useBezel: boolean;
  setUseBezel: (useBezel: boolean) => void;
}

export default function MobileFrame({ 
  children, 
  onThemeToggle, 
  isDarkTheme = false,
  fontScale = 'medium',
  highContrast = false,
  keyboardFocus = false,
  useBezel,
  setUseBezel
}: MobileFrameProps) {
  const [time, setTime] = useState('03:40');

  useEffect(() => {
    // Keep clock in sync with a simple mock update or current real minutes
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      setTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkTheme ? 'bg-slate-950 text-slate-150' : 'bg-slate-50 text-slate-900'} font-sans flex flex-col items-center justify-start p-2 sm:p-4 md:p-8`}>
      {/* Upper Control Bar */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-slate-800/60 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-550/10">
              <Compass className="w-5 h-5 animate-pulse" />
            </span>
            Krypton <span className="font-light text-slate-500 text-base sm:text-lg">SpendTracker v1.5</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-category mobile spending tracker, trend forecaster and smart buffer alerts.
          </p>
        </div>

        {/* View Toggle / Control Segment */}
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl shadow-xs border border-slate-200/65 dark:border-slate-800/80">
          <button
            id="toggle-bezel-app"
            onClick={() => setUseBezel(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              useBezel 
                ? 'bg-indigo-650 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Switch to Mobile Emulator View"
          >
            <Smartphone className="w-4.5 h-4.5" />
            <span>Mobile Device</span>
          </button>
          
          <button
            id="toggle-desktop-app"
            onClick={() => setUseBezel(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !useBezel 
                ? 'bg-indigo-650 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Switch to Edge-to-Edge Responsive Web View"
          >
            <Monitor className="w-4.5 h-4.5" />
            <span>Full Canvas</span>
          </button>

          {onThemeToggle && (
            <button
              id="theme-toggle-button"
              onClick={onThemeToggle}
              className="p-1.5 ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Toggle visual contrast theme"
            >
              {isDarkTheme ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Wrapper */}
      {useBezel ? (
        /* Mobile Bezel Simulation container */
        <div className="relative flex flex-col justify-center items-center py-4 select-none">
          {/* Subtle phone shadow backdrops */}
          <div className="absolute top-10 w-[385px] h-[812px] bg-indigo-500/5 blur-2xl rounded-[50px] -z-10 pointer-events-none"></div>
          <div className="absolute -bottom-2 w-[340px] h-[30px] bg-slate-950/10 dark:bg-black/40 blur-xl rounded-full pointer-events-none"></div>

          {/* Physical Phone Shell */}
          <div className="w-[390px] h-[844px] rounded-[52px] border-12 border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col relative shrink-0 transition-transform duration-300">
            {/* Top Ear Piece & Notch Overlay */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-900 dark:bg-slate-800 rounded-b-3xl z-50 flex items-center justify-center">
              {/* Dynamic Camera Notch Indicators */}
              <div className="w-12 h-4.5 bg-black rounded-full flex items-center justify-between px-2 gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
              </div>
            </div>

            {/* Simulated Phone Bar Buttons Left/Right */}
            <div className="absolute left-[-15px] top-[140px] w-[3px] h-[50px] bg-slate-900 rounded-r z-50"></div>
            <div className="absolute left-[-15px] top-[200px] w-[3px] h-[50px] bg-slate-900 rounded-r z-50"></div>
            <div className="absolute right-[-15px] top-[170px] w-[3px] h-[75px] bg-slate-900 rounded-l z-50"></div>

            {/* System Status Bar */}
            <div className="h-11 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-end px-7 pb-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 z-40 select-none">
              <div>{time}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">5G</span>
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              </div>
            </div>

            {/* Inner App Container with standard scrolling */}
            <div className={`flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 relative ${
              fontScale === 'large' ? 'accessibility-scale-large' : 
              fontScale === 'small' ? 'accessibility-scale-small' : ''
            } ${
              highContrast ? 'accessibility-high-contrast' : ''
            } ${
              keyboardFocus ? 'accessibility-keyboard-focus' : ''
            }`}>
              {children}
            </div>

            {/* System Bottom Home Indicator */}
            <div className="h-7 bg-white dark:bg-slate-950 flex justify-center items-center z-40 relative">
              <div className="w-32 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        /* Edge to Edge Viewport mode for beautiful desktop dashboards */
        <div className={`w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden flex flex-col h-[820px] ${
          fontScale === 'large' ? 'accessibility-scale-large' : 
          fontScale === 'small' ? 'accessibility-scale-small' : ''
        } ${
          highContrast ? 'accessibility-high-contrast' : ''
        } ${
          keyboardFocus ? 'accessibility-keyboard-focus' : ''
        }`}>
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
