import React from 'react';
import { AlertTriangle, ShieldCheck, Sun, CloudRain, Zap, CheckCircle2 } from 'lucide-react';
import { AnalysisReport, Language } from '../types';
import { getT } from '../lib/i18n';

interface RiskCardProps {
  analysis: AnalysisReport | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  language: Language;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  analysis,
  onRunAnalysis,
  isAnalyzing,
  language,
}) => {
  const t = getT(language);

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 text-center shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-stone-800">No Assessment Recorded</h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
          Run an explainable agro-climatic assessment to evaluate drought, flood, and canopy stress.
        </p>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
        >
          {t.runAnalysis}
        </button>
      </div>
    );
  }

  const getRiskTheme = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          gauge: 'text-emerald-700 stroke-emerald-600',
          bg: 'bg-emerald-50/60',
          border: 'border-emerald-200',
          icon: ShieldCheck,
          label: t.lowRisk
        };
      case 'MODERATE':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          gauge: 'text-amber-600 stroke-amber-500',
          bg: 'bg-amber-50/60',
          border: 'border-amber-200',
          icon: AlertTriangle,
          label: t.moderateRisk
        };
      case 'MODERATE-HIGH':
        return {
          badge: 'bg-orange-100 text-orange-800 border-orange-300',
          gauge: 'text-orange-600 stroke-orange-500',
          bg: 'bg-orange-50/60',
          border: 'border-orange-200',
          icon: AlertTriangle,
          label: t.moderateHighRisk
        };
      case 'HIGH':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          gauge: 'text-rose-600 stroke-rose-600',
          bg: 'bg-rose-50/60',
          border: 'border-rose-200',
          icon: AlertTriangle,
          label: t.highRisk
        };
      default:
        return {
          badge: 'bg-stone-100 text-stone-800 border-stone-300',
          gauge: 'text-stone-600 stroke-stone-500',
          bg: 'bg-stone-50',
          border: 'border-stone-200',
          icon: ShieldCheck,
          label: 'Unknown'
        };
    }
  };

  const theme = getRiskTheme(analysis.risk_level);
  const StatusIcon = theme.icon;

  return (
    <div className={`rounded-xl border ${theme.border} bg-white shadow-xs overflow-hidden`}>
      
      {/* Header */}
      <div className={`p-4 sm:p-5 ${theme.bg} border-b ${theme.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs border ${theme.border}`}>
            <StatusIcon className={`w-6 h-6 ${theme.gauge}`} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t.overallScore}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-bold text-stone-900">
                {analysis.overall_score}<span className="text-sm font-normal text-stone-500">/100</span>
              </h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                {theme.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>{isAnalyzing ? t.analyzing : t.runAnalysis}</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        
        {/* Risk Component Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Drought Risk */}
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> {t.droughtRisk}
              </span>
              <span className="font-bold text-stone-900">{analysis.drought_risk}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.drought_risk > 60 ? 'bg-rose-500' : analysis.drought_risk > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${analysis.drought_risk}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              {analysis.drought_risk > 50 ? 'High water deficit threat' : 'Safe soil moisture balance'}
            </p>
          </div>

          {/* Flood Risk */}
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-500" /> {t.floodRisk}
              </span>
              <span className="font-bold text-stone-900">{analysis.flood_risk}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.flood_risk > 60 ? 'bg-rose-500' : analysis.flood_risk > 35 ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${analysis.flood_risk}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              {analysis.flood_risk > 50 ? 'Standing water risk high' : 'Adequate surface runoff'}
            </p>
          </div>

          {/* Crop Stress */}
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-orange-500" /> {t.cropStress}
              </span>
              <span className="font-bold text-stone-900">{analysis.crop_stress}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.crop_stress > 60 ? 'bg-rose-500' : analysis.crop_stress > 35 ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${analysis.crop_stress}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              {analysis.crop_stress > 50 ? 'Significant physiological strain' : 'Canopy vigor normal'}
            </p>
          </div>

        </div>

        {/* Evidence & Decision Drivers */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            {t.evidenceReasons}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 bg-stone-50/70 p-2.5 rounded-lg border border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deterministic transparency notice */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
          <span>Engine: Deterministic Agro-Climatic Rule Engine v1.0</span>
          <span>Last Calculated: {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

      </div>
    </div>
  );
};
