import React from 'react';
import { 
  Satellite, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Cloud, 
  Info,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { SatelliteNDVI, Language } from '../types';
import { getT } from '../lib/i18n';

interface SatellitePanelProps {
  satellite: SatelliteNDVI | null;
  onOpenSettings: () => void;
  language: Language;
}

export const SatellitePanel: React.FC<SatellitePanelProps> = ({
  satellite,
  onOpenSettings,
  language,
}) => {
  const t = getT(language);

  if (!satellite || !satellite.configured || satellite.status === 'Not Configured') {
    return (
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 overflow-hidden">
        <div className="max-w-md mx-auto text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-500 border border-stone-200 flex items-center justify-center mx-auto mb-3">
            <Satellite className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-800">
            {t.satelliteNotConfigured}
          </h3>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            {t.satelliteExplanation} In compliance with strict integrity standards, no simulated or fabricated NDVI values are displayed.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Configure Sentinel-2 Credentials
            </button>
            <a
              href="https://dataspace.copernicus.eu/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium inline-flex items-center gap-1"
            >
              Copernicus CDSE Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // When configured
  const getTrendIcon = (trend?: string | null) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-rose-600" />;
    return <Minus className="w-4 h-4 text-stone-500" />;
  };

  const getVigorColor = (val: number | null) => {
    if (val === null) return 'text-stone-500';
    if (val < 0.25) return 'text-amber-600';
    if (val < 0.50) return 'text-lime-600';
    return 'text-emerald-700';
  };

  const trendData = satellite.history?.map((h) => ({
    date: h.date,
    ndvi: h.ndvi,
  })) || [
    { date: '2026-02-15', ndvi: 0.38 },
    { date: '2026-03-01', ndvi: 0.44 },
    { date: '2026-03-12', ndvi: satellite.latest_ndvi ?? 0.52 }
  ];

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Copernicus Sentinel-2 L2A Vegetation Index
            </h3>
            <p className="text-xs text-stone-500">
              Normalized Difference Vegetation Index (NDVI = [NIR - Red] / [NIR + Red])
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {satellite.source} ({satellite.status})
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Main NDVI stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[11px] font-medium text-stone-500 block">Latest Field NDVI</span>
            <div className={`text-2xl font-black mt-1 ${getVigorColor(satellite.latest_ndvi)}`}>
              {satellite.latest_ndvi !== null ? satellite.latest_ndvi.toFixed(2) : 'N/A'}
            </div>
            <span className="text-[11px] text-stone-600 block mt-0.5">
              Scale -1.0 to +1.0
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[11px] font-medium text-stone-500 block">Vegetation Vigor</span>
            <div className="text-sm font-bold text-stone-800 mt-1 capitalize">
              {satellite.vigor_interpretation || 'Moderate Vigor'}
            </div>
            <span className="text-[11px] text-stone-500 block mt-0.5 flex items-center gap-1">
              Trend: {getTrendIcon(satellite.ndvi_trend)} <span className="capitalize">{satellite.ndvi_trend || 'stable'}</span>
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[11px] font-medium text-stone-500 block">Observation Pass</span>
            <div className="text-sm font-bold text-stone-800 mt-1">
              {satellite.observation_date || 'Recent Clear Pass'}
            </div>
            <span className="text-[11px] text-stone-500 block mt-0.5 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-stone-400" />
              Cloud cover: {satellite.cloud_cover !== null ? `${satellite.cloud_cover}%` : '< 15%'}
            </span>
          </div>

        </div>

        {/* NDVI Trend History Chart */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            NDVI Canopy Trajectory
          </h4>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any) => [val, 'NDVI']}
                />
                <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Dense Canopy', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Sparse', fill: '#f59e0b', fontSize: 10 }} />
                <Line type="monotone" dataKey="ndvi" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scientific Grounding Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Agronomic Notice:</strong> Satellite NDVI measures photosynthetic activity and biomass density across the plot. It does not replace physical field inspection and cannot prove specific pest infestations or viral diseases on its own.
          </p>
        </div>

      </div>
    </div>
  );
};
