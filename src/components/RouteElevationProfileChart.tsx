import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { RoutePlanResult } from '../types';
import { Mountain, TrendingUp, TrendingDown, Info, Gauge } from 'lucide-react';

interface ElevationPoint {
  distance: number;
  elevation: number;
  grade: number;
  label?: string;
}

interface RouteElevationProfileChartProps {
  routePlan: RoutePlanResult;
}

export const RouteElevationProfileChart: React.FC<RouteElevationProfileChartProps> = ({ routePlan }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltipData, setTooltipData] = useState<ElevationPoint | null>(null);

  // Generate elevation points along the route based on origin, destination, total distance, max elevation, and terrain segments
  const elevationPoints = useMemo<ElevationPoint[]>(() => {
    const totalDist = routePlan.totalDistanceKm || 10;
    const originElev = routePlan.origin.elevationM || 100;
    const destElev = routePlan.destination.elevationM || 100;
    const maxElev = routePlan.maxElevationM || Math.max(originElev, destElev, 500);
    const minElev = Math.min(originElev, destElev, 50);

    const numPoints = 25; // number of sample points along the route
    const points: ElevationPoint[] = [];

    // Create a realistic mountain profile curve
    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      const dist = Math.round((frac * totalDist) * 10) / 10;

      // Interpolate base elevation with sinusoidal mountain variation
      let elev = originElev + (destElev - originElev) * frac;
      
      // Add mountain pass undulations if distance is significant
      if (totalDist > 15) {
        const mountainFactor = Math.sin(frac * Math.PI * 2.5) * (maxElev - minElev) * 0.35;
        const hillSpike = Math.cos(frac * Math.PI * 5) * (maxElev - minElev) * 0.15;
        elev += mountainFactor + hillSpike;
      }

      // Clamp between min and max elevation
      elev = Math.round(Math.max(minElev * 0.8, Math.min(maxElev, elev)));

      // Calculate approximate slope grade relative to previous point
      let grade = 0;
      if (i > 0) {
        const prev = points[i - 1];
        const distDiffKm = dist - prev.distance;
        const elevDiffM = elev - prev.elevation;
        if (distDiffKm > 0) {
          grade = Math.round((elevDiffM / (distDiffKm * 1000)) * 100 * 10) / 10;
        }
      }

      let label: string | undefined = undefined;
      if (i === 0) label = `Start: ${routePlan.origin.name}`;
      else if (i === numPoints) label = `End: ${routePlan.destination.name}`;
      else if (Math.abs(elev - maxElev) < 20) label = `Peak Summit: ${Math.round(maxElev)}m`;

      points.push({ distance: dist, elevation: elev, grade, label });
    }

    return points;
  }, [routePlan]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || elevationPoints.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = 180;
    const margin = { top: 15, right: 25, bottom: 30, left: 45 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const maxDist = d3.max(elevationPoints, (d: ElevationPoint) => d.distance) || 100;
    const minElev = d3.min(elevationPoints, (d: ElevationPoint) => d.elevation) || 0;
    const maxElev = d3.max(elevationPoints, (d: ElevationPoint) => d.elevation) || 1000;

    const xScale = d3
      .scaleLinear()
      .domain([0, maxDist])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, minElev - 50), maxElev + 100])
      .range([innerHeight, 0]);

    // Area generator for elevation gradient fill
    const areaGenerator = d3
      .area<ElevationPoint>()
      .x((d: ElevationPoint) => xScale(d.distance))
      .y0(innerHeight)
      .y1((d: ElevationPoint) => yScale(d.elevation))
      .curve(d3.curveMonotoneX);

    // Line generator for elevation curve
    const lineGenerator = d3
      .line<ElevationPoint>()
      .x((d: ElevationPoint) => xScale(d.distance))
      .y((d: ElevationPoint) => yScale(d.elevation))
      .curve(d3.curveMonotoneX);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'elevation-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.45);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#042f2e').attr('stop-opacity', 0.05);

    // Gridlines (X & Y)
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '3,3');

    svg
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((d: d3.NumberValue) => `${d} km`);
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d: d3.NumberValue) => `${d}m`);

    svg
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    svg.append('g').call(yAxis).selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px');

    svg.selectAll('.domain, .tick line').attr('stroke', '#475569');

    // Append Area
    svg
      .append('path')
      .datum(elevationPoints)
      .attr('fill', 'url(#elevation-gradient)')
      .attr('d', areaGenerator);

    // Append Line
    svg
      .append('path')
      .datum(elevationPoints)
      .attr('fill', 'none')
      .attr('stroke', '#34d399')
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator);

    // Interactive Hover Overlay & Tooltip
    const focus = svg.append('g').style('display', 'none');

    focus
      .append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    focus
      .append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const bisect = d3.bisector((d: ElevationPoint) => d.distance).left;

    svg
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => {
        focus.style('display', 'none');
        setTooltipData(null);
      })
      .on('mousemove', function (event) {
        const [xCoord] = d3.pointer(event);
        const x0 = xScale.invert(xCoord);
        const i = bisect(elevationPoints, x0, 1);
        const d0 = elevationPoints[i - 1];
        const d1 = elevationPoints[i];
        if (!d0) return;
        const d = d1 && x0 - d0.distance > d1.distance - x0 ? d1 : d0;

        focus.select('.x-hover-line').attr('transform', `translate(${xScale(d.distance)},0)`);
        focus.select('.hover-circle').attr('transform', `translate(${xScale(d.distance)},${yScale(d.elevation)})`);

        setTooltipData({
          distance: d.distance,
          elevation: d.elevation,
          grade: d.grade,
          label: d.label,
        });
      });
  }, [elevationPoints]);

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">D3 Elevation Profile & Climb Gradient</h4>
            <p className="text-[11px] text-slate-400">
              {routePlan.origin.name} ➔ {routePlan.destination.name} ({routePlan.totalDistanceKm} km total)
            </p>
          </div>
        </div>

        {/* Elevation Quick Stats Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Climb: +{routePlan.elevationGainM}m</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Summit: {routePlan.maxElevationM}m</span>
          </span>
        </div>
      </div>

      {/* D3 SVG Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hover Tooltip Overlay */}
        {tooltipData && (
          <div className="absolute top-2 right-2 bg-slate-900/95 border border-emerald-500/40 rounded-xl p-2.5 shadow-xl text-xs space-y-1 backdrop-blur-md pointer-events-none z-10">
            <div className="flex items-center justify-between space-x-3">
              <span className="font-bold text-emerald-400">{tooltipData.distance} km along route</span>
              <span className={`font-mono font-bold ${tooltipData.grade > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {tooltipData.grade > 0 ? `+${tooltipData.grade}% grade` : `${tooltipData.grade}% grade`}
              </span>
            </div>
            <div className="text-white font-black text-sm">
              Elevation: {tooltipData.elevation}m ASL
            </div>
            {tooltipData.label && (
              <div className="text-[11px] text-slate-300 italic pt-0.5 border-t border-slate-800">
                📍 {tooltipData.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Legend & Climbing Tips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Hover over chart curve to inspect gradient grade and elevation at any kilometer milestone.</span>
        </div>
        <div className="text-slate-500 font-mono">
          Min: {routePlan.origin.elevationM}m • Max: {routePlan.maxElevationM}m
        </div>
      </div>
    </div>
  );
};
