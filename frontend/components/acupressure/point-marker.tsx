import React from 'react';

interface PointMarkerProps {
  point: any;
  isSelected: boolean;
  onClick: () => void;
}

export const PointMarker: React.FC<PointMarkerProps> = ({
  point,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className="absolute group cursor-pointer"
      style={{
        left: point.coordinates.x,
        top: point.coordinates.y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {/* Main point circle */}
      <div
        className={`w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center group-hover:scale-125 ${
          isSelected
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 ring-4 ring-orange-300 dark:ring-orange-500 scale-125 shadow-lg shadow-orange-400/50'
            : 'bg-gradient-to-r from-blue-400 to-cyan-500 ring-2 ring-blue-200 dark:ring-blue-700 hover:ring-4 shadow-md hover:shadow-lg hover:shadow-blue-400/30'
        }`}
      >
        {/* Point ID (hidden by default, shown on hover) */}
        <span className="text-white font-bold text-xs">{point.id}</span>
      </div>

      {/* Glow effect when selected */}
      {isSelected && (
        <div className="absolute inset-0 w-5 h-5 rounded-full bg-orange-400 opacity-20 animate-pulse" style={{ left: '-2.5px', top: '-2.5px' }} />
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
        <div className="font-bold text-yellow-300">{point.name}</div>
        <div className="text-slate-200">{point.location}</div>
        <div className="text-slate-300 text-xs mt-1">{point.meridian} ({point.meridianAbbr})</div>
        <div className="text-slate-400 text-xs">Click for details</div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" style={{ width: 0, height: 0 }} />
      </div>
    </div>
  );
};
