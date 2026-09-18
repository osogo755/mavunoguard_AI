import React from 'react';
import { 
  Sprout, 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Globe, 
  Sliders, 
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { Language } from '../types';
import { getT } from '../lib/i18n';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSync: () => void;
  isSyncing: boolean;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  onOpenSettings: () => void;
  onOpenNewFarm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isOnline,
  pendingSyncCount,
  onSync,
  isSyncing,
  canInstallPwa,
  onInstallPwa,
  onOpenSettings,
  onOpenNewFarm,
}) => {
  const t = getT(language);

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-inner">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  MavunoGuard <span className="text-emerald-400 font-semibold text-sm px-1.5 py-0.5 rounded bg-emerald-800/80 border border-emerald-700/50">AI</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-200/80 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Kenya
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 hidden md:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Online / Offline status badge */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isOnline 
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300' 
                  : 'bg-amber-950/70 border-amber-600/70 text-amber-300 animate-pulse'
              }`}
              title={isOnline ? t.onlineBanner : t.offlineBanner}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Sync button (if pending) */}
            {pendingSyncCount > 0 && (
              <button
                onClick={onSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-amber-950 transition-colors shadow-sm disabled:opacity-50"
                title={t.syncNow}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} {language === 'sw' ? 'Mabadiliko' : 'Sync'}</span>
              </button>
            )}

            {/* PWA Install Button */}
            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.installPwa}</span>
                <span className="md:hidden">Install</span>
              </button>
            )}

            {/* Register New Farm Button */}
            <button
              onClick={onOpenNewFarm}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-emerald-950 hover:bg-emerald-50 transition-colors font-semibold shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">{t.newFarm}</span>
              <span className="sm:hidden">{language === 'sw' ? 'Shamba' : 'Add'}</span>
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <label htmlFor="language-select" className="sr-only">Language</label>
              <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-700/60 rounded-lg px-2 py-1 text-xs">
                <Globe className="w-3 h-3 text-emerald-300" />
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="bg-transparent text-emerald-100 font-medium focus:outline-none cursor-pointer text-xs"
                >
                  <option value="en" className="bg-emerald-900 text-white">EN</option>
                  <option value="sw" className="bg-emerald-900 text-white">Kiswahili</option>
                  <option value="ek" className="bg-emerald-900 text-white">Ekegusii</option>
                </select>
              </div>
            </div>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-800 text-emerald-200 transition-colors border border-emerald-700/60"
              title={t.settingsTab}
            >
              <Sliders className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
