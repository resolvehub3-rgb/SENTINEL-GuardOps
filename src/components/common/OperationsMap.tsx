import React, { useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { GuardRecord } from '../../types/guardops';

interface OperationsMapProps {
  guards: GuardRecord[];
  selectedGuardId?: string | null;
  onSelectGuard?: (guard: GuardRecord) => void;
  heightClass?: string;
  showLegend?: boolean;
}

export function OperationsMap({
  guards,
  selectedGuardId,
  onSelectGuard,
  heightClass = 'h-72',
  showLegend = true,
}: OperationsMapProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))));
  const handleReset = () => setZoom(1);

  return (
    <div className="flex flex-col">
      <div
        className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E2E4A] bg-[#E8EFF7] dark:bg-[#0D1A30] select-none`}
        data-testid="operations-map"
      >
        {/* Vector City Grid + River Map Surface */}
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 800 440"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {/* Base Urban Zones */}
            <rect width="800" height="440" className="fill-[#EAF0F6] dark:fill-[#0F1C34]" />

            {/* Park / Campus Green Areas */}
            <path
              d="M30 40 L170 40 L150 150 L20 140 Z"
              className="fill-[#D4EBDD] dark:fill-[#132E33]"
            />
            <path
              d="M570 260 L770 250 L780 410 L550 400 Z"
              className="fill-[#D4EBDD] dark:fill-[#132E33]"
            />

            {/* River Bend */}
            <path
              d="M-20 110 C180 120, 290 210, 420 280 C520 335, 620 390, 740 460 L820 460 L820 390 C680 330, 560 270, 460 215 C320 140, 210 60, -20 55 Z"
              className="fill-[#BED8F6] dark:fill-[#163159]"
            />

            {/* Arterial Roads */}
            <g className="stroke-white dark:stroke-[#1E3358]" strokeLinecap="round">
              <path d="M0 95 L800 135" strokeWidth="6" />
              <path d="M0 245 L800 205" strokeWidth="7" />
              <path d="M0 355 L800 325" strokeWidth="5" />
              <path d="M165 0 L195 440" strokeWidth="6" />
              <path d="M395 0 L375 440" strokeWidth="7" />
              <path d="M590 0 L620 440" strokeWidth="6" />
            </g>

            {/* Secondary Street Grid */}
            <g className="stroke-white/70 dark:stroke-[#182A4A]" strokeWidth="2">
              <line x1="80" y1="0" x2="95" y2="440" />
              <line x1="280" y1="0" x2="275" y2="440" />
              <line x1="490" y1="0" x2="505" y2="440" />
              <line x1="710" y1="0" x2="725" y2="440" />
              <line x1="0" y1="165" x2="800" y2="170" />
              <line x1="0" y1="295" x2="800" y2="280" />
            </g>

            {/* Sector Labels */}
            <text
              x="95"
              y="72"
              className="fill-slate-500/70 dark:fill-slate-400/50 text-[11px] font-semibold"
            >
              NORTH RIVERFRONT
            </text>
            <text
              x="408"
              y="185"
              className="fill-slate-500/70 dark:fill-slate-400/50 text-[11px] font-semibold"
            >
              FINANCIAL CORE
            </text>
            <text
              x="595"
              y="112"
              className="fill-slate-500/70 dark:fill-slate-400/50 text-[11px] font-semibold"
            >
              MIDTOWN EAST
            </text>
            <text
              x="210"
              y="338"
              className="fill-slate-500/70 dark:fill-slate-400/50 text-[11px] font-semibold"
            >
              WEST CAMPUS
            </text>
          </svg>

          {/* Guard Location Markers */}
          {guards.map((guard) => {
            const isSelected = guard.id === selectedGuardId;
            const pinBg =
              guard.trackingState === 'On Duty'
                ? 'bg-[#10A878] border-white dark:border-[#0B1324]'
                : guard.trackingState === 'Location Stale'
                  ? 'bg-amber-500 border-white dark:border-[#0B1324]'
                  : 'bg-slate-500 border-white dark:border-[#0B1324]';

            return (
              <button
                key={guard.id}
                type="button"
                onClick={() => onSelectGuard?.(guard)}
                aria-label={`${guard.name} at ${guard.locationName} (${guard.trackingState})`}
                style={{
                  left: `${guard.mapX}%`,
                  top: `${guard.mapY}%`,
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-10"
              >
                {isSelected && (
                  <span className="absolute -inset-3 rounded-full bg-blue-500/25 border border-blue-400/60" />
                )}
                <span
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-md transition-transform duration-150 ${pinBg} ${
                    isSelected ? 'scale-125 ring-4 ring-blue-500/30' : 'group-hover:scale-110'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </span>
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-lg bg-[#10213D] text-white text-[11px] font-semibold whitespace-nowrap shadow-lg border border-white/10">
                  {guard.name} · {guard.locationName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Map Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white/90 dark:bg-[#10213D]/90 backdrop-blur-sm border border-slate-200 dark:border-[#24395D] rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset map zoom"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-md bg-[#10213D]/85 text-white text-[11px] font-medium backdrop-blur-sm">
          Active Duty Tracking · {guards.length} Guards Visible
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-5 mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10A878]" aria-hidden="true" />
            <span>On Duty</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span>Location Stale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" aria-hidden="true" />
            <span>Location Unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
}
