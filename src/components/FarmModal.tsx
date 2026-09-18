import React, { useState } from 'react';
import { X, MapPin, Navigation, Save, Sprout, AlertCircle } from 'lucide-react';
import { Farm, Language } from '../types';
import { getT } from '../lib/i18n';

interface FarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (farmData: Partial<Farm>) => void;
  initialFarm?: Farm | null;
  defaultCoords?: { lat: number; lon: number } | null;
  language: Language;
}

export const FarmModal: React.FC<FarmModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFarm,
  defaultCoords,
  language,
}) => {
  const t = getT(language);

  const [name, setName] = useState(initialFarm?.name || '');
  const [latitude, setLatitude] = useState(
    initialFarm?.latitude ?? defaultCoords?.lat ?? 0.1833
  );
  const [longitude, setLongitude] = useState(
    initialFarm?.longitude ?? defaultCoords?.lon ?? 35.1500
  );
  const [size, setSize] = useState(initialFarm?.size ?? 2.0);
  const [unit, setUnit] = useState<'acres' | 'hectares'>(initialFarm?.unit || 'acres');
  const [crop, setCrop] = useState(initialFarm?.crop || 'Maize');
  const [variety, setVariety] = useState(initialFarm?.variety || '');
  const [plantingDate, setPlantingDate] = useState(initialFarm?.planting_date || '');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(initialFarm?.expected_harvest_date || '');
  const [soilType, setSoilType] = useState(initialFarm?.soil_type || 'Volcanic Clay Loam');
  const [drainage, setDrainage] = useState(initialFarm?.drainage || 'moderate');
  const [floodHistory, setFloodHistory] = useState(initialFarm?.flood_history || 'never');
  const [slope, setSlope] = useState(initialFarm?.slope || 'gentle');
  const [cropHealth, setCropHealth] = useState(initialFarm?.crop_health || 'good');
  const [currentProblems, setCurrentProblems] = useState<string[]>(
    initialFarm?.current_problems || []
  );
  const [notes, setNotes] = useState(initialFarm?.notes || '');
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const problemOptions = [
    'Dry surface soil',
    'Vegetative wilting',
    'Waterlogging / ponding',
    'Leaf chlorosis (yellowing)',
    'Pest signs (fall armyworm/stalk borer)',
    'Disease lesions / rust / blight',
    'Stunted growth'
  ];

  const toggleProblem = (prob: string) => {
    setCurrentProblems(prev =>
      prev.includes(prob) ? prev.filter(p => p !== prob) : [...prev, prob]
    );
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation failed', err);
          alert('Could not acquire device GPS coordinates.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation not supported on this browser.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a farm name.');
      return;
    }

    onSave({
      name: name.trim(),
      latitude,
      longitude,
      size: Number(size) || 1.0,
      unit,
      crop,
      variety: variety.trim(),
      planting_date: plantingDate,
      expected_harvest_date: expectedHarvestDate,
      soil_type: soilType,
      drainage,
      flood_history: floodHistory,
      slope,
      crop_health: cropHealth as any,
      current_problems: currentProblems,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 border border-emerald-700 flex items-center justify-center text-emerald-300">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialFarm ? 'Edit Farm Record' : t.newFarm}
              </h3>
              <p className="text-xs text-emerald-200">
                Register smallholder plot details for targeted climate monitoring
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Farm Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t.farmName} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cheptarit Shamba 1, Kericho Upper Terrace"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Coordinates & GPS acquisition */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {t.coordinates} *
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1 text-xs text-emerald-800 font-semibold hover:text-emerald-900 bg-white border border-stone-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                <Navigation className={`w-3 h-3 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Acquiring GPS...' : t.useCurrentLocation}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-500 mb-0.5">Latitude (-90 to +90)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-0.5">Longitude (-180 to +180)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md text-xs font-mono bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              Tip: You can also tap anywhere on the Farm Map or import a Garmin GPX / KML boundary.
            </p>
          </div>

          {/* Crop, Variety, Acreage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{t.cropType} *</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
              >
                <option value="Maize">Maize (Mahindi)</option>
                <option value="Beans">Beans (Maharage)</option>
                <option value="Tea">Tea (Chai)</option>
                <option value="Coffee">Coffee (Kahawa)</option>
                <option value="Sorghum">Sorghum (Mtama)</option>
                <option value="Millet">Millet (Uwele / Wimbi)</option>
                <option value="Potatoes">Irish Potatoes (Viazi)</option>
                <option value="Cassava">Cassava (Muhogo)</option>
                <option value="Vegetables">Vegetables / Kales (Sukuma)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{t.variety}</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. H614D, DK8031, Rosecoco"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{t.acreage}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={size}
                  onChange={(e) => setSize(parseFloat(e.target.value) || 1)}
                  className="w-2/3 px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-1/3 px-2 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Ha</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Planting Date</label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Soil, Drainage, Slope, Flood History */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              >
                <option value="Volcanic Clay Loam">Volcanic Clay Loam</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Heavy Clay">Heavy Clay</option>
                <option value="Black Cotton">Black Cotton Soil</option>
                <option value="Silt Loam">Silt Loam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Drainage</label>
              <select
                value={drainage}
                onChange={(e) => setDrainage(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              >
                <option value="poor">Poor (Ponds easily)</option>
                <option value="moderate">Moderate</option>
                <option value="good">Good (Free draining)</option>
                <option value="excessive">Excessive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Slope</label>
              <select
                value={slope}
                onChange={(e) => setSlope(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              >
                <option value="flat">Flat / Basin</option>
                <option value="gentle">Gentle Slope</option>
                <option value="moderate">Moderate Slope</option>
                <option value="steep">Steep Terraces</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Flood History</label>
              <select
                value={floodHistory}
                onChange={(e) => setFloodHistory(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              >
                <option value="never">Never Floods</option>
                <option value="occasional">Occasional Flash Flood</option>
                <option value="frequent">Frequent Waterlogging</option>
              </select>
            </div>
          </div>

          {/* Field Issue Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Current Field Observations (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {problemOptions.map((prob, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs text-stone-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentProblems.includes(prob)}
                    onChange={() => toggleProblem(prob)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{prob}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Field Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Terraces reconstructed in February. Intercropped with beans."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-semibold cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.saveFarm}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
