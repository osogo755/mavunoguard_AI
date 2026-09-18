import React, { useState } from 'react';
import { 
  CloudRain, 
  Sun, 
  Droplets, 
  Thermometer, 
  Calendar, 
  Info,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line 
} from 'recharts';
import { WeatherData, Language } from '../types';
import { getT } from '../lib/i18n';

interface WeatherPanelProps {
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  language: Language;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  weather,
  isLoading,
  onRefresh,
  language,
}) => {
  const t = getT(language);
  const [viewRange, setViewRange] = useState<'7d' | '14d'>('7d');

  if (isLoading && !weather) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-stone-500">Fetching live agro-meteorological data...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
        <CloudRain className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-xs text-stone-500">Weather data unavailable for this coordinate.</p>
        <button
          onClick={onRefresh}
          className="mt-3 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const daysToShow = viewRange === '7d' ? weather.daily.slice(0, 7) : weather.daily;

  const chartData = daysToShow.map((d) => ({
    name: new Date(d.date).toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }),
    rain: d.precipitation,
    tempMax: d.temp_max,
    tempMin: d.temp_min,
  }));

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-emerald-600" />
            {t.weatherTab}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            14-day smallholder agro-meteorological forecast
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Badge */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
            <span className={`w-1.5 h-1.5 rounded-full ${weather.source_status === 'Live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {weather.provider} ({weather.source_status})
          </span>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-stone-200 cursor-pointer"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Current Temp
            </span>
            <div className="text-xl font-bold text-stone-800 mt-1">
              {weather.current_temp}°C
            </div>
            <span className="text-[11px] text-stone-600 font-medium block truncate">
              {weather.current_condition}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-500" /> {t.rainfall7d}
            </span>
            <div className="text-xl font-bold text-stone-800 mt-1">
              {weather.rainfall_7d} mm
            </div>
            <span className={`text-[11px] font-medium block ${weather.rainfall_7d < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {weather.rainfall_7d < 10 ? 'Dry window' : 'Adequate showers'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {t.rainfall14d}
            </span>
            <div className="text-xl font-bold text-stone-800 mt-1">
              {weather.rainfall_14d} mm
            </div>
            <span className="text-[11px] text-stone-600 font-medium block">
              Cumulative total
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-emerald-500" /> {t.soilMoisture}
            </span>
            <div className="text-xl font-bold text-stone-800 mt-1">
              {weather.soil_moisture !== null ? `${(weather.soil_moisture * 100).toFixed(0)}%` : 'Estimating'}
            </div>
            <span className="text-[11px] text-stone-600 font-medium block">
              0-1cm top layer
            </span>
          </div>

        </div>

        {/* Chart View Range Switcher */}
        <div className="flex items-center justify-between pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Precipitation Forecast
          </h4>
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setViewRange('7d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewRange === '7d' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewRange('14d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewRange === '14d' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>

        {/* Rainfall Bar Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} unit="mm" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                formatter={(val: any) => [`${val} mm`, 'Rainfall']}
              />
              <Bar dataKey="rain" fill="#0284c7" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature Trend Line Chart */}
        <div className="pt-2 border-t border-stone-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Daily High & Low Temperatures (°C)
          </h4>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78716c' }} unit="°C" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="tempMax" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="High Temp (°C)" />
                <Line type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Low Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
