import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Sparkles, 
  Satellite, 
  CloudSun, 
  HardDrive, 
  User, 
  Wifi, 
  Layers,
  Download,
  FileCode2
} from 'lucide-react';
import { SystemConfig, Language } from '../types';
import { getT } from '../lib/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig | null;
  farmsCount: number;
  analysesCount: number;
  pendingSyncCount: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  farmsCount,
  analysesCount,
  pendingSyncCount,
  language,
  onLanguageChange,
}) => {
  const t = getT(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 border border-stone-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              {t.settingsTab}
            </h3>
            <p className="text-xs text-stone-400">
              System health, integrations, offline cache & profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Farmer Profile */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                DO
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Daniel Osogo</h4>
                <p className="text-stone-500 text-xs">Smallholder Lead Farmer &bull; Nandi County, Kenya</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-200/80 grid grid-cols-2 gap-2 text-stone-600">
              <div>
                <span className="text-stone-400 block text-[11px]">Primary Language</span>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="mt-0.5 font-semibold text-stone-800 bg-white border border-stone-300 rounded px-2 py-1 text-xs"
                >
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="ek">Ekegusii</option>
                </select>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Contact Channel</span>
                <span className="font-semibold text-stone-800 block mt-1">+254 700 000000 (SMS/USSD)</span>
              </div>
            </div>
          </div>

          {/* Integration Statuses */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-stone-500 text-[11px] mb-2">
              Connected Infrastructure
            </h4>

            <div className="space-y-2">
              
              {/* Gemini */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-stone-800 block">Google Gemini AI</span>
                    <span className="text-[11px] text-stone-500">gemini-3.8-flash server-side advisory</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>

              {/* Weather */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-semibold text-stone-800 block">Agro-Meteorological APIs</span>
                    <span className="text-[11px] text-stone-500">Open-Meteo with MET Norway fallback</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              </div>

              {/* Sentinel-2 */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-semibold text-stone-800 block">Copernicus Sentinel-2 L2A</span>
                    <span className="text-[11px] text-stone-500">Copernicus Data Space Ecosystem (CDSE)</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                  config?.sentinel_configured 
                    ? 'text-emerald-700 bg-emerald-100' 
                    : 'text-amber-800 bg-amber-100'
                }`}>
                  {config?.sentinel_configured ? (
                    <><CheckCircle2 className="w-3 h-3" /> Configured</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> Unconfigured</>
                  )}
                </span>
              </div>

              {/* Supabase */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-stone-800 block">Supabase PostgreSQL DB</span>
                    <span className="text-[11px] text-stone-500">Row-Level Security & Sync</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                  config?.supabase_configured 
                    ? 'text-emerald-700 bg-emerald-100' 
                    : 'text-stone-700 bg-stone-200'
                }`}>
                  {config?.supabase_configured ? 'Connected' : 'Local Storage Mode'}
                </span>
              </div>

            </div>
          </div>

          {/* Project Codebase Export */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-stone-500 text-[11px] mb-2">
              Full Application Codebase
            </h4>
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                  <FileCode2 className="w-4 h-4 text-emerald-700" />
                  <span>MavunoGuard AI Source Code (.ZIP)</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Complete archive with React/TypeScript frontend, Python FastAPI backend, risk algorithms, Supabase schemas, PWA assets, and test suite.
                </p>
              </div>
              <a
                href="/api/download/codebase.zip"
                download="mavunoguard-codebase.zip"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ZIP</span>
              </a>
            </div>
          </div>

          {/* Local Storage & Offline Cache */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-stone-500 text-[11px] mb-2">
              Offline Storage Status
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Cached Farms</span>
                <span className="text-base font-bold text-stone-800">{farmsCount}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Risk Analyses</span>
                <span className="text-base font-bold text-stone-800">{analysesCount}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Pending Sync</span>
                <span className="text-base font-bold text-amber-600">{pendingSyncCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>MavunoGuard AI v1.0.0 &bull; Progressive Web App</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
