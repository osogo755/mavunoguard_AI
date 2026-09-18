import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Farm, AnalysisReport, Language } from '../types';
import { getT } from '../lib/i18n';
import { MapPin, Navigation } from 'lucide-react';

interface FarmMapProps {
  farms: Farm[];
  activeFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onCoordinateClick?: (lat: number, lon: number) => void;
  analysesByFarmId?: Record<string, AnalysisReport>;
  language: Language;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  farms,
  activeFarm,
  onSelectFarm,
  onCoordinateClick,
  analysesByFarmId = {},
  language,
}) => {
  const t = getT(language);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = activeFarm ? activeFarm.latitude : 0.1833;
    const initialLon = activeFarm ? activeFarm.longitude : 35.1500;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // High quality OpenStreetMap carto tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map click for coordinate selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onCoordinateClick) {
        onCoordinateClick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
      }
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    farms.forEach((farm) => {
      const analysis = analysesByFarmId[farm.id];
      const riskLevel = analysis?.risk_level || 'LOW';

      let pinColor = '#10b981'; // Green
      if (riskLevel === 'HIGH') pinColor = '#ef4444'; // Red
      else if (riskLevel === 'MODERATE-HIGH') pinColor = '#f97316'; // Orange
      else if (riskLevel === 'MODERATE') pinColor = '#f59e0b'; // Amber

      const isCurrent = activeFarm?.id === farm.id;

      const customIcon = L.divIcon({
        className: 'custom-farm-marker',
        html: `
          <div style="
            background-color: ${pinColor};
            width: ${isCurrent ? '34px' : '28px'};
            height: ${isCurrent ? '34px' : '28px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: ${isCurrent ? '12px' : '10px'};
            ">
              ${farm.crop[0]?.toUpperCase() || 'F'}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([farm.latitude, farm.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 170px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #1c1917;">${farm.name}</h4>
          <p style="margin: 0; font-size: 11px; color: #57534e;">
            <strong>Crop:</strong> ${farm.crop} (${farm.size} ${farm.unit})
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #57534e;">
            <strong>Risk Status:</strong> <span style="color: ${pinColor}; font-weight: bold;">${riskLevel}</span>
          </p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #a8a29e; font-family: monospace;">
            ${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}
          </p>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectFarm(farm);
      });

      group.addLayer(marker);
    });

    if (activeFarm) {
      map.panTo([activeFarm.latitude, activeFarm.longitude], { animate: true });
    }
  }, [farms, activeFarm, analysesByFarmId]);

  const handleCenterOnUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
        },
        (err) => {
          console.warn('Geolocation failed', err);
        }
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden relative">
      
      {/* Map Header Bar */}
      <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-stone-800">
            Interactive Plot Locator & Risk Boundaries
          </span>
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            ({farms.length} plots registered)
          </span>
        </div>

        <button
          onClick={handleCenterOnUser}
          className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-white border border-stone-200 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          title="Center on my GPS position"
        >
          <Navigation className="w-3 h-3 text-emerald-600" />
          <span>My GPS</span>
        </button>
      </div>

      {/* Map Canvas Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-80 sm:h-96 z-10"
        style={{ minHeight: '320px' }}
      />

      {/* Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs border border-stone-200 p-2 rounded-lg shadow-sm text-[11px] flex items-center gap-3">
        <span className="font-semibold text-stone-700">Risk:</span>
        <span className="flex items-center gap-1 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low
        </span>
        <span className="flex items-center gap-1 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate
        </span>
        <span className="flex items-center gap-1 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High
        </span>
      </div>

    </div>
  );
};
