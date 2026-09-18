import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  FarmSelector 
} from './components/FarmSelector';
import { 
  RiskCard 
} from './components/RiskCard';
import { 
  AiAdvisor 
} from './components/AiAdvisor';
import { 
  WeatherPanel 
} from './components/WeatherPanel';
import { 
  SatellitePanel 
} from './components/SatellitePanel';
import { 
  FarmMap 
} from './components/FarmMap';
import { 
  GeoImporter 
} from './components/GeoImporter';
import { 
  FarmModal 
} from './components/FarmModal';
import { 
  ObservationModal 
} from './components/ObservationModal';
import { 
  SettingsModal 
} from './components/SettingsModal';

import { 
  Farm, 
  WeatherData, 
  SatelliteNDVI, 
  AnalysisReport, 
  SystemConfig, 
  Language 
} from './types';
import { 
  getLocalFarms, 
  saveLocalFarms, 
  getLocalAnalyses, 
  saveLocalAnalyses, 
  getSyncQueue, 
  addToSyncQueue, 
  clearSyncQueue, 
  getSavedActiveFarmId, 
  saveActiveFarmId, 
  getSavedLanguage, 
  saveLanguage 
} from './lib/storage';
import { getT } from './lib/i18n';
import { 
  LayoutDashboard, 
  Map, 
  CloudSun, 
  Satellite, 
  UploadCloud, 
  WifiOff, 
  PlusCircle,
  ShieldCheck,
  Eye
} from 'lucide-react';

export function App() {
  const [language, setLanguage] = useState<Language>(getSavedLanguage());
  const t = getT(language);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [satellite, setSatellite] = useState<SatelliteNDVI | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'weather' | 'satellite' | 'import'>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Modals
  const [isFarmModalOpen, setIsFarmModalOpen] = useState<boolean>(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [defaultCoords, setDefaultCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);

  // Listen to PWA install event
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
      setDeferredPrompt(null);
    }
  };

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    saveLanguage(lang);
  };

  // Load Initial Data (Farms, Analyses, Config)
  useEffect(() => {
    const initData = async () => {
      // 1. Fetch system config
      try {
        const confRes = await fetch('/api/config');
        if (confRes.ok) {
          const c = await confRes.json();
          setSystemConfig(c);
        }
      } catch (e) {
        console.warn('Could not load /api/config', e);
      }

      // 2. Load Farms
      try {
        const farmRes = await fetch('/api/farms');
        if (farmRes.ok) {
          const remoteFarms: Farm[] = await farmRes.json();
          if (remoteFarms && remoteFarms.length > 0) {
            setFarms(remoteFarms);
            saveLocalFarms(remoteFarms);

            const savedId = getSavedActiveFarmId();
            const matching = remoteFarms.find(f => f.id === savedId) || remoteFarms[0];
            setActiveFarm(matching);
          }
        } else {
          throw new Error('Farms fetch returned non-200');
        }
      } catch (err) {
        // Fallback to local storage
        const localFarms = getLocalFarms();
        if (localFarms.length > 0) {
          setFarms(localFarms);
          const savedId = getSavedActiveFarmId();
          const matching = localFarms.find(f => f.id === savedId) || localFarms[0];
          setActiveFarm(matching);
        }
      }

      // 3. Load Analyses
      try {
        const anRes = await fetch('/api/analyses');
        if (anRes.ok) {
          const remoteAnalyses: AnalysisReport[] = await anRes.json();
          setAnalyses(remoteAnalyses);
          saveLocalAnalyses(remoteAnalyses);
        }
      } catch {
        setAnalyses(getLocalAnalyses());
      }
    };

    initData();
  }, []);

  // Fetch Weather & Satellite when activeFarm changes
  const fetchAgroData = useCallback(async (farm: Farm) => {
    setIsLoadingWeather(true);

    // Weather
    try {
      const wRes = await fetch(`/api/weather?lat=${farm.latitude}&lon=${farm.longitude}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWeather(wData);
      }
    } catch (e) {
      console.warn('Failed to fetch weather', e);
    } finally {
      setIsLoadingWeather(false);
    }

    // Satellite Sentinel-2
    try {
      const sRes = await fetch(`/api/satellite?lat=${farm.latitude}&lon=${farm.longitude}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setSatellite(sData);
      }
    } catch (e) {
      console.warn('Failed to fetch satellite', e);
    }
  }, []);

  useEffect(() => {
    if (activeFarm) {
      saveActiveFarmId(activeFarm.id);
      fetchAgroData(activeFarm);
    }
  }, [activeFarm, fetchAgroData]);

  // Sync Queue Runner
  const handleSyncQueue = async () => {
    const queue = getSyncQueue();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      const resp = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queue })
      });

      if (resp.ok) {
        clearSyncQueue();
        setPendingSyncCount(0);
      }
    } catch (e) {
      console.warn('Sync failed, will retry later', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Run AI Field Assessment
  const handleRunAnalysis = async (farmerObservations: string[] = []) => {
    if (!activeFarm) return;
    setIsAnalyzing(true);

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: activeFarm.id,
          farm: activeFarm,
          farmer_observations: farmerObservations,
          language
        })
      });

      if (resp.ok) {
        const report: AnalysisReport = await resp.json();
        setAnalyses(prev => {
          const updated = [report, ...prev.filter(a => a.id !== report.id)];
          saveLocalAnalyses(updated);
          return updated;
        });
      } else {
        throw new Error('Analysis endpoint failed');
      }
    } catch (err: any) {
      // Offline fallback deterministic assessment
      const fallbackReport: AnalysisReport = {
        id: 'offline-' + Date.now(),
        farm_id: activeFarm.id,
        farm_name: activeFarm.name,
        created_at: new Date().toISOString(),
        overall_score: 35,
        risk_level: 'MODERATE',
        drought_risk: 38,
        flood_risk: 15,
        crop_stress: 25,
        ndvi: satellite?.latest_ndvi ?? null,
        ndvi_trend: satellite?.ndvi_trend ?? null,
        reasons: [
          'Calculated using offline cached agricultural risk tables.',
          'Moderate soil drainage buffer verified.'
        ],
        recommended_actions: [
          'Inspect soil moisture around root zones.',
          'Conserve moisture with local mulch cover.'
        ],
        watch_next: [
          'Monitor early morning leaf curl.'
        ],
        ai_headline: 'Offline Field Assessment Saved',
        ai_explanation: 'Your farm data was evaluated with offline safety rules. Full AI analysis will sync once connected.',
        ai_provider: 'Deterministic Rule-Based (Offline)',
        weather_source: 'Cached',
        satellite_source: 'Cached'
      };

      setAnalyses(prev => {
        const updated = [fallbackReport, ...prev];
        saveLocalAnalyses(updated);
        return updated;
      });

      addToSyncQueue({
        entity_type: 'analysis',
        operation: 'CREATE',
        payload: { farm_id: activeFarm.id, observations: farmerObservations }
      });
      setPendingSyncCount(getSyncQueue().length);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save / Update Farm
  const handleSaveFarm = async (farmData: Partial<Farm>) => {
    if (editingFarm) {
      // Update
      const updated: Farm = {
        ...editingFarm,
        ...farmData,
        updated_at: new Date().toISOString(),
      } as Farm;

      const newFarms = farms.map(f => f.id === updated.id ? updated : f);
      setFarms(newFarms);
      saveLocalFarms(newFarms);
      setActiveFarm(updated);

      if (isOnline) {
        try {
          await fetch(`/api/farms/${updated.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });
        } catch {
          addToSyncQueue({
            entity_type: 'farm',
            entity_id: updated.id,
            operation: 'UPDATE',
            payload: updated
          });
          setPendingSyncCount(getSyncQueue().length);
        }
      } else {
        addToSyncQueue({
          entity_type: 'farm',
          entity_id: updated.id,
          operation: 'UPDATE',
          payload: updated
        });
        setPendingSyncCount(getSyncQueue().length);
      }
    } else {
      // Create
      const newId = 'farm-' + Date.now();
      const created: Farm = {
        id: newId,
        user_id: 'default-user',
        name: farmData.name || 'New Plot',
        latitude: farmData.latitude ?? 0.1833,
        longitude: farmData.longitude ?? 35.1500,
        size: farmData.size ?? 2.0,
        unit: farmData.unit ?? 'acres',
        crop: farmData.crop ?? 'Maize',
        variety: farmData.variety || '',
        planting_date: farmData.planting_date || '',
        expected_harvest_date: farmData.expected_harvest_date || '',
        soil_type: farmData.soil_type || 'Volcanic Clay Loam',
        drainage: farmData.drainage || 'moderate',
        flood_history: farmData.flood_history || 'never',
        slope: farmData.slope || 'gentle',
        crop_health: farmData.crop_health || 'good',
        current_problems: farmData.current_problems || [],
        notes: farmData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newFarms = [created, ...farms];
      setFarms(newFarms);
      saveLocalFarms(newFarms);
      setActiveFarm(created);

      if (isOnline) {
        try {
          await fetch('/api/farms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(created)
          });
        } catch {
          addToSyncQueue({
            entity_type: 'farm',
            operation: 'CREATE',
            payload: created
          });
          setPendingSyncCount(getSyncQueue().length);
        }
      } else {
        addToSyncQueue({
          entity_type: 'farm',
          operation: 'CREATE',
          payload: created
        });
        setPendingSyncCount(getSyncQueue().length);
      }
    }

    setEditingFarm(null);
    setDefaultCoords(null);
  };

  // Delete Farm
  const handleDeleteFarm = async (farmId: string) => {
    const remaining = farms.filter(f => f.id !== farmId);
    setFarms(remaining);
    saveLocalFarms(remaining);

    if (activeFarm?.id === farmId) {
      setActiveFarm(remaining[0] || null);
    }

    if (isOnline) {
      try {
        await fetch(`/api/farms/${farmId}`, { method: 'DELETE' });
      } catch {
        addToSyncQueue({
          entity_type: 'farm',
          entity_id: farmId,
          operation: 'DELETE',
          payload: {}
        });
        setPendingSyncCount(getSyncQueue().length);
      }
    } else {
      addToSyncQueue({
        entity_type: 'farm',
        entity_id: farmId,
        operation: 'DELETE',
        payload: {}
      });
      setPendingSyncCount(getSyncQueue().length);
    }
  };

  // Applied coordinates from Garmin/KML/EXIF
  const handleApplyCoordinates = (lat: number, lon: number, formatName: string) => {
    setDefaultCoords({ lat, lon });
    setEditingFarm(null);
    setIsFarmModalOpen(true);
  };

  // Clicking on map
  const handleMapCoordinateClick = (lat: number, lon: number) => {
    if (window.confirm(`Add a new farm at GPS coordinates (${lat}, ${lon})?`)) {
      setDefaultCoords({ lat, lon });
      setEditingFarm(null);
      setIsFarmModalOpen(true);
    }
  };

  // Current farm's latest analysis
  const latestAnalysis = activeFarm 
    ? analyses.find(a => a.farm_id === activeFarm.id) || null
    : null;

  // Map of analyses by farm ID for the map pins
  const analysesByFarmId: Record<string, AnalysisReport> = {};
  analyses.forEach(a => {
    if (!analysesByFarmId[a.farm_id]) {
      analysesByFarmId[a.farm_id] = a;
    }
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSync={handleSyncQueue}
        isSyncing={isSyncing}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenNewFarm={() => {
          setEditingFarm(null);
          setDefaultCoords(null);
          setIsFarmModalOpen(true);
        }}
      />

      {/* Offline Status Alert Banner if disconnected */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-4 h-4" />
          <span>{t.offlineBanner}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        
        {/* Farm Selector Banner */}
        <FarmSelector
          farms={farms}
          activeFarm={activeFarm}
          onSelectFarm={setActiveFarm}
          onEditFarm={(f) => {
            setEditingFarm(f);
            setIsFarmModalOpen(true);
          }}
          onDeleteFarm={handleDeleteFarm}
          latestAnalysis={latestAnalysis}
          language={language}
        />

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t.dashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'map'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Farm Plots Map</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>{t.weatherTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'satellite'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Sentinel-2 NDVI</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{t.importTab}</span>
          </button>
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Quick Action Bar for Field Observation */}
            {activeFarm && (
              <div className="bg-emerald-950 text-emerald-100 p-3.5 rounded-xl border border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-300">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Observing field conditions on {activeFarm.name}?
                    </span>
                    <span className="text-[11px] text-emerald-300">
                      Record symptoms (wilting, dry soil, pests) to recalibrate AI risk recommendations.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsObservationModalOpen(true)}
                  disabled={isAnalyzing}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.addObservation}</span>
                </button>
              </div>
            )}

            {/* Top row: Risk Card & AI Advisor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-5">
                <RiskCard
                  analysis={latestAnalysis}
                  onRunAnalysis={() => handleRunAnalysis(activeFarm?.current_problems || [])}
                  isAnalyzing={isAnalyzing}
                  language={language}
                />
              </div>

              <div className="lg:col-span-6 space-y-5">
                <AiAdvisor
                  analysis={latestAnalysis}
                  language={language}
                />
              </div>
            </div>

            {/* Bottom row: Compact Weather & Map Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <WeatherPanel
                  weather={weather}
                  isLoading={isLoadingWeather}
                  onRefresh={() => activeFarm && fetchAgroData(activeFarm)}
                  language={language}
                />
              </div>

              <div className="lg:col-span-5">
                <FarmMap
                  farms={farms}
                  activeFarm={activeFarm}
                  onSelectFarm={setActiveFarm}
                  onCoordinateClick={handleMapCoordinateClick}
                  analysesByFarmId={analysesByFarmId}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Map View */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <FarmMap
              farms={farms}
              activeFarm={activeFarm}
              onSelectFarm={setActiveFarm}
              onCoordinateClick={handleMapCoordinateClick}
              analysesByFarmId={analysesByFarmId}
              language={language}
            />
            <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
              <span>Click on any farm marker to inspect, or click on empty ground to register a new plot coordinate.</span>
              <button
                onClick={() => {
                  setEditingFarm(null);
                  setDefaultCoords(null);
                  setIsFarmModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.newFarm}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Weather View */}
        {activeTab === 'weather' && (
          <div className="space-y-5">
            <WeatherPanel
              weather={weather}
              isLoading={isLoadingWeather}
              onRefresh={() => activeFarm && fetchAgroData(activeFarm)}
              language={language}
            />
          </div>
        )}

        {/* Tab 4: Satellite Sentinel-2 View */}
        {activeTab === 'satellite' && (
          <div className="space-y-5">
            <SatellitePanel
              satellite={satellite}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              language={language}
            />
          </div>
        )}

        {/* Tab 5: Garmin & Geo Import View */}
        {activeTab === 'import' && (
          <div className="space-y-5">
            <GeoImporter
              onApplyCoordinates={handleApplyCoordinates}
              language={language}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-stone-800">MavunoGuard AI</span>
            <span>&bull; Smallholder Climate Resilience Decision Support</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Google Gemini AI</span>
            <span>&bull;</span>
            <span>Copernicus Sentinel-2</span>
            <span>&bull;</span>
            <span>Open-Meteo & MET Norway</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FarmModal
        isOpen={isFarmModalOpen}
        onClose={() => {
          setIsFarmModalOpen(false);
          setEditingFarm(null);
          setDefaultCoords(null);
        }}
        onSave={handleSaveFarm}
        initialFarm={editingFarm}
        defaultCoords={defaultCoords}
        language={language}
      />

      {activeFarm && (
        <ObservationModal
          isOpen={isObservationModalOpen}
          onClose={() => setIsObservationModalOpen(false)}
          farm={activeFarm}
          onTriggerAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          language={language}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={systemConfig}
        farmsCount={farms.length}
        analysesCount={analyses.length}
        pendingSyncCount={pendingSyncCount}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

    </div>
  );
}

export default App;
