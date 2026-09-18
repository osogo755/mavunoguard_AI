import React from 'react';
import { MapPin, Calendar, Layers, Activity, Edit2, Trash2, Droplets } from 'lucide-react';
import { Farm, Language, AnalysisReport } from '../types';
import { getT } from '../lib/i18n';

interface FarmSelectorProps {
  farms: Farm[];
  activeFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onEditFarm: (farm: Farm) => void;
  onDeleteFarm: (farmId: string) => void;
  latestAnalysis: AnalysisReport | null;
  language: Language;
}

export const FarmSelector: React.FC<FarmSelectorProps> = ({
  farms,
  activeFarm,
  onSelectFarm,
  onEditFarm,
  onDeleteFarm,
  latestAnalysis,
  language,
}) => {
  const t = getT(language);

  if (!activeFarm) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 text-center shadow-xs">
        <p className="text-stone-500 text-sm mb-2">{t.noFarmsYet}</p>
      </div>
    );
  }

  const getRiskBadgeColor = (level?: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MODERATE-HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5">
        
        {/* Top bar: Selector and Edit/Delete controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base">
              {activeFarm.crop[0]?.toUpperCase() || 'F'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="farm-dropdown" className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  {t.selectFarm}:
                </label>
                <select
                  id="farm-dropdown"
                  value={activeFarm.id}
                  onChange={(e) => {
                    const found = farms.find(f => f.id === e.target.value);
                    if (found) onSelectFarm(found);
                  }}
                  className="font-semibold text-stone-800 bg-transparent hover:bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latestAnalysis && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getRiskBadgeColor(latestAnalysis.risk_level)}`}>
                <Activity className="w-3.5 h-3.5" />
                {latestAnalysis.risk_level} RISK ({latestAnalysis.overall_score}/100)
              </span>
            )}
            <button
              onClick={() => onEditFarm(activeFarm)}
              className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-stone-200"
              title={t.edit}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${activeFarm.name}?`)) {
                  onDeleteFarm(activeFarm.id);
                }
              }}
              className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-stone-200"
              title={t.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Farm Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-600 block">{t.cropType}</span>
              <span className="font-semibold text-stone-800">{activeFarm.crop}</span>
              {activeFarm.variety && (
                <span className="text-stone-600 block text-[11px]">{activeFarm.variety}</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-600 block">{t.acreage}</span>
              <span className="font-semibold text-stone-800">
                {activeFarm.size} {activeFarm.unit}
              </span>
              <span className="text-stone-600 block text-[11px] capitalize">{activeFarm.soil_type || 'Loam'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-600 block">{t.coordinates}</span>
              <span className="font-mono font-semibold text-stone-800 text-[11px]">
                {activeFarm.latitude.toFixed(4)}, {activeFarm.longitude.toFixed(4)}
              </span>
              <span className="text-stone-600 block text-[11px] capitalize">{activeFarm.slope || 'Gentle'} slope</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-600 block">Planting Window</span>
              <span className="font-semibold text-stone-800">
                {activeFarm.planting_date || 'Not specified'}
              </span>
              {activeFarm.drainage && (
                <span className="text-stone-600 block text-[11px] flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-500" /> {activeFarm.drainage} drainage
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Current field problems tags if any */}
        {activeFarm.current_problems && activeFarm.current_problems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-stone-500 mr-1">Noted Field Issues:</span>
            {activeFarm.current_problems.map((prob, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                {prob}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
