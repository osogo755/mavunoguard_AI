import React, { useState, useRef } from 'react';
import { Upload, FileCode, Camera, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Language } from '../types';
import { getT } from '../lib/i18n';

interface GeoImporterProps {
  onApplyCoordinates: (lat: number, lon: number, formatName: string) => void;
  language: Language;
}

export const GeoImporter: React.FC<GeoImporterProps> = ({
  onApplyCoordinates,
  language,
}) => {
  const t = getT(language);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    format: string;
    latitude: number;
    longitude: number;
    point_count: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setError(null);
    setResult(null);

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 10MB.');
      return;
    }

    const filename = file.name.toLowerCase();
    const isGpx = filename.endsWith('.gpx');
    const isKml = filename.endsWith('.kml');
    const isPhoto = filename.endsWith('.jpg') || filename.endsWith('.jpeg');

    if (!isGpx && !isKml && !isPhoto) {
      setError('Unsupported file type. Please upload a .gpx, .kml, or a geotagged .jpg image.');
      return;
    }

    setIsUploading(true);

    try {
      if (isGpx || isKml) {
        const textContent = await file.text();
        const resp = await fetch('/api/garmin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, textContent })
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Failed to parse file coordinates');
        }

        setResult(data);
      } else {
        // Photo EXIF parsing
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const resp = await fetch('/api/garmin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentBase64: base64 })
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Failed to extract GPS EXIF from image');
        }

        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while importing location data.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 overflow-hidden">
      
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Garmin & Geo-Data Boundary Importer
            </h3>
            <p className="text-xs text-stone-500">
              Directly import farm boundaries from Garmin (.gpx), Google Earth (.kml), or geotagged field photos
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-stone-300 hover:border-emerald-400 bg-stone-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,.kml,.jpg,.jpeg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex justify-center gap-3 mb-2 text-stone-400">
            <FileCode className="w-6 h-6 text-emerald-600" />
            <Camera className="w-6 h-6 text-sky-600" />
          </div>

          <p className="text-xs font-semibold text-stone-700">
            {isUploading ? 'Extracting GPS Coordinates...' : t.dropFileHere}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Supports: Garmin GPX tracks, Google Earth KML polygon centroids, and JPEG photos with GPS EXIF.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Preview */}
        {result && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Location Decoded: {result.format}
                  </h4>
                  <p className="text-[11px] text-emerald-800">{result.message}</p>
                </div>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-stone-500 block">Centroid Coordinates:</span>
                <span className="font-mono font-bold text-stone-800">
                  {result.latitude}, {result.longitude}
                </span>
              </div>
              <button
                onClick={() => onApplyCoordinates(result.latitude, result.longitude, result.format)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Use for Farm Plot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
