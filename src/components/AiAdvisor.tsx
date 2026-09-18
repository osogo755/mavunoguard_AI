import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Square, 
  Eye, 
  HelpCircle, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { AnalysisReport, Language } from '../types';
import { getT } from '../lib/i18n';

interface AiAdvisorProps {
  analysis: AnalysisReport | null;
  language: Language;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  analysis,
  language,
}) => {
  const t = getT(language);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  if (!analysis) return null;

  const toggleAction = (index: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getProviderBadge = (provider: string) => {
    if (provider.includes('Gemini')) {
      return {
        name: 'Google Gemini',
        bg: 'bg-emerald-900 text-emerald-200 border-emerald-700',
        dot: 'bg-emerald-400'
      };
    } else if (provider.includes('OpenAI')) {
      return {
        name: 'OpenAI Fallback',
        bg: 'bg-blue-900 text-blue-200 border-blue-700',
        dot: 'bg-blue-400'
      };
    }
    return {
      name: 'Deterministic Rules',
      bg: 'bg-stone-800 text-stone-300 border-stone-700',
      dot: 'bg-stone-400'
    };
  };

  const badge = getProviderBadge(analysis.ai_provider);

  return (
    <div className="bg-stone-900 text-stone-100 rounded-xl border border-stone-800 shadow-sm overflow-hidden">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-stone-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {t.latestAdvice}
            </h3>
            <span className="text-[11px] text-stone-400">
              Low-cost smallholder decision guidance
            </span>
          </div>
        </div>

        {/* AI Provider Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <span>{badge.name}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Headline & Explanation */}
        <div className="bg-stone-800/60 rounded-lg p-3.5 border border-stone-700/60">
          <h4 className="text-sm font-bold text-emerald-300 mb-1">
            {analysis.ai_headline || 'Field Management Advisory'}
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed">
            {analysis.ai_explanation || 'Follow the recommended practical actions to protect yield potential and mitigate identified risks.'}
          </p>
        </div>

        {/* Recommended Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              {t.recommendedActions}
            </h4>
            <span className="text-[11px] text-stone-400">
              Tap task to mark completed
            </span>
          </div>

          <div className="space-y-2">
            {analysis.recommended_actions.map((action, idx) => {
              const done = !!completedActions[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleAction(idx)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    done
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200 line-through opacity-75'
                      : 'bg-stone-800/40 border-stone-700/80 text-stone-200 hover:bg-stone-800 hover:border-stone-600'
                  }`}
                >
                  <button className="mt-0.5 text-stone-400 hover:text-emerald-400 shrink-0">
                    {done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <span className="leading-snug">{action}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* What to Monitor Next */}
        {analysis.watch_next && analysis.watch_next.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              {t.watchNext}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.watch_next.map((watch, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-stone-800/30 border border-stone-800 text-xs text-stone-300">
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{watch}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisory Disclaimer */}
        <div className="pt-3 border-t border-stone-800/80 flex items-start gap-2 text-[11px] text-stone-400">
          <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <p>
            This advisory provides climate-risk decision assistance grounded exclusively in provided weather and field parameters. It does not replace physical inspection by an agricultural extension officer.
          </p>
        </div>

      </div>
    </div>
  );
};
