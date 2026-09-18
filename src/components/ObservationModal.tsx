import React, { useState } from 'react';
import { X, CheckSquare, Zap, Eye, AlertTriangle } from 'lucide-react';
import { Language, Farm } from '../types';
import { getT } from '../lib/i18n';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: Farm;
  onTriggerAnalysis: (observations: string[]) => void;
  isAnalyzing: boolean;
  language: Language;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  farm,
  onTriggerAnalysis,
  isAnalyzing,
  language,
}) => {
  const t = getT(language);
  const [selectedObs, setSelectedObs] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const observationCatalog = [
    { id: 'dry soil', label: 'Dry surface soil crusting (Moisture deficit)' },
    { id: 'wilting', label: 'Vegetative leaf curling / midday wilting' },
    { id: 'waterlogging', label: 'Standing puddle / saturated furrow waterlogging' },
    { id: 'yellowing', label: 'Leaf yellowing / chlorosis on lower foliage' },
    { id: 'pest', label: 'Visible caterpillars / stem borer / armyworm holes' },
    { id: 'disease', label: 'Leaf rust / fungal spots / bacterial lesions' },
    { id: 'poor growth', label: 'Stunted plant height / delayed vegetative stage' }
  ];

  const toggleObs = (id: string) => {
    setSelectedObs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStartAnalysis = () => {
    const list = [...selectedObs];
    if (customNote.trim()) {
      list.push(customNote.trim());
    }
    onTriggerAnalysis(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8 border border-stone-200">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="text-base font-bold">Field Observation & Assessment</h3>
              <p className="text-xs text-emerald-200">
                Ground truths for {farm.name} ({farm.crop})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-stone-600">
            Select any symptoms or field signs currently visible on your plot. These ground observations directly calibrate the deterministic risk calculations and AI advisory:
          </p>

          <div className="space-y-2">
            {observationCatalog.map((item) => {
              const checked = selectedObs.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleObs(item.id)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Additional Farmer Note (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Applied manure last week; topsoil cracked 2cm deep"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAnalyzing ? 'Running Assessment...' : 'Run Calibrated Analysis'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
