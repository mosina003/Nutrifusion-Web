'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface BodyDiagramProps {
  points: any[];
  selectedPoint: any | null;
  onPointClick: (point: any) => void;
  bodyPart: 'front' | 'back';
}

interface D3ZoomEvent {
  transform: d3.ZoomTransform;
}

export const BodyDiagram: React.FC<BodyDiagramProps> = ({
  points,
  selectedPoint,
  onPointClick,
  bodyPart,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const d3ZoomRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const filteredPoints = points.filter(p => p.bodyPart === bodyPart);
  const imagePath = bodyPart === 'front' 
    ? '/images/acupressure/front_pose.png' 
    : '/images/acupressure/back_pose.png';

  // Initialize D3 zoom on same element
  useEffect(() => {
    if (!svgRef.current || !zoomLayerRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoomLayer = d3.select(zoomLayerRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 4])
      .on('zoom', (event: D3ZoomEvent) => {
        zoomLayer.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    d3ZoomRef.current = { zoom, svg };

    // Reset on body part change
    svg.transition().duration(500)
      .call(zoom.transform, d3.zoomIdentity);

  }, [bodyPart]);

  // Auto-zoom to selected point
  useEffect(() => {
    if (!selectedPoint || !d3ZoomRef.current || !svgRef.current) {
      // Reset zoom
      if (d3ZoomRef.current?.svg) {
        d3ZoomRef.current.svg.transition().duration(750)
          .call(d3ZoomRef.current.zoom.transform, d3.zoomIdentity);
      }
      return;
    }

    const svg = svgRef.current;
    const viewBox = svg.viewBox.baseVal;
    const svgWidth = viewBox.width;
    const svgHeight = viewBox.height;

    // Parse percentage coordinates to pixels
    let xPercent = 50;
    let yPercent = 50;

    if (typeof selectedPoint.coordinates.x === 'string') {
      xPercent = parseFloat(selectedPoint.coordinates.x);
    } else {
      xPercent = selectedPoint.coordinates.x;
    }

    if (typeof selectedPoint.coordinates.y === 'string') {
      yPercent = parseFloat(selectedPoint.coordinates.y);
    } else {
      yPercent = selectedPoint.coordinates.y;
    }

    const targetX = (xPercent / 100) * svgWidth;
    const targetY = (yPercent / 100) * svgHeight;

    const scale = 3;
    const translateX = (svgWidth / 2) - targetX * scale;
    const translateY = (svgHeight / 2) - targetY * scale;

    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    d3ZoomRef.current.svg.transition().duration(750)
      .call(d3ZoomRef.current.zoom.transform, transform);

  }, [selectedPoint]);

  const getElementColor = (element: string) => {
    const colors: Record<string, { fill: string; glow: string; stroke: string }> = {
      Fire: { fill: '#ff6b81', glow: '#ff6b81', stroke: '#ff4757' },
      Wood: { fill: '#2ecc71', glow: '#2ecc71', stroke: '#27ae60' },
      Earth: { fill: '#f1c40f', glow: '#f1c40f', stroke: '#f39c12' },
      Metal: { fill: '#ecf0f1', glow: '#ecf0f1', stroke: '#bdc3c7' },
      Water: { fill: '#3498db', glow: '#3498db', stroke: '#2980b9' },
    };
    return colors[element] || colors.Water;
  };

  // ViewBox dimensions (should match image aspect ratio)
  const viewBoxWidth = 1000;
  const viewBoxHeight = 1500;

  // Calculate point radius based on viewBox
  const baseRadius = Math.min(viewBoxWidth, viewBoxHeight) * 0.018;
  const selectedRadius = baseRadius * 1.8;
  const glowRadius = baseRadius * 2.8;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
          <div className="text-white text-sm font-medium">Loading body diagram...</div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMin meet"
        style={{ cursor: 'grab', display: 'block', backgroundColor: 'transparent' }}
        onClick={(e) => {
          if ((e.target as SVGElement).tagName !== 'circle' && (e.target as SVGElement).className.baseVal !== 'point-label') {
            // Click on background, deselect
          }
        }}
      >
        <defs>
          <filter id="pointGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="pointHover" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Zoom/Pan layer */}
        <g ref={zoomLayerRef}>
          {/* Background image */}
          <image
            href={imagePath}
            x="0"
            y="0"
            width={viewBoxWidth}
            height={viewBoxHeight}
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              console.error('Error loading image:', imagePath, e);
              setIsLoading(false);
            }}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none select-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />

          {/* Acupressure points layer */}
          <g id="acupoints-layer" style={{ pointerEvents: 'auto' }}>
            {filteredPoints.map((point) => {
              const xPercent = typeof point.coordinates.x === 'string' 
                ? parseFloat(point.coordinates.x) 
                : point.coordinates.x;
              const yPercent = typeof point.coordinates.y === 'string' 
                ? parseFloat(point.coordinates.y) 
                : point.coordinates.y;

              const cx = (xPercent / 100) * viewBoxWidth;
              const cy = (yPercent / 100) * viewBoxHeight;

              const color = getElementColor(point.element);
              const isActive = selectedPoint?.id === point.id;
              const isHovered = hoveredPoint === point.id;

              return (
                <g
                  key={point.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPointClick(point);
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(point.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Glow circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? glowRadius * 1.2 : glowRadius}
                    fill={color.glow}
                    opacity={isActive ? 0.5 : isHovered ? 0.35 : 0.2}
                    className="transition-all duration-200"
                    filter="url(#pointGlow)"
                  />

                  {/* Main point circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? selectedRadius : baseRadius}
                    fill={color.fill}
                    stroke="white"
                    strokeWidth={isActive ? 3 : 2}
                    className="point transition-all duration-200 drop-shadow-lg"
                    style={{
                      filter: isActive ? 'url(#pointHover)' : 'url(#pointGlow)',
                    }}
                  />

                  {/* Point label */}
                  <text
                    x={cx + (isActive ? selectedRadius : baseRadius) + 8}
                    y={cy + 4}
                    fontSize={Math.max(baseRadius * 1.6, 12)}
                    fontWeight="700"
                    fill={isActive ? '#fff' : '#e2e8f0'}
                    fontFamily="Inter, system-ui, sans-serif"
                    pointerEvents="none"
                    className="point-label select-none"
                    paintOrder="stroke"
                    stroke={isActive ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)'}
                    strokeWidth={isActive ? 2.5 : 2}
                  >
                    {point.id}
                  </text>

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <g pointerEvents="none">
                      <rect
                        x={cx}
                        y={cy - 35}
                        width="120"
                        height="32"
                        rx="6"
                        fill="rgba(0,0,0,0.9)"
                        stroke={color.fill}
                        strokeWidth="1"
                      />
                      <text
                        x={cx + 60}
                        y={cy - 18}
                        fontSize="11"
                        fontWeight="600"
                        fill="white"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {point.name}
                      </text>
                      <text
                        x={cx + 60}
                        y={cy - 6}
                        fontSize="9"
                        fill="#9ca3af"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {point.meridianAbbr} • {point.element}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <span className="font-medium">
          {filteredPoints.length} {bodyPart === 'front' ? 'Front' : 'Back'} Points
        </span>
        <span className="text-slate-500 dark:text-slate-500">Scroll to zoom • Drag to pan</span>
      </div>

      {/* Selected point info */}
      {selectedPoint && (
        <div className="absolute top-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {selectedPoint.id} - {selectedPoint.name}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {selectedPoint.meridian}
          </div>
        </div>
      )}
    </div>
  );
};
