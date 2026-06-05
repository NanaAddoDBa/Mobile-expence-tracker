/**
 * A D3-powered responsive trajectory visualization illustrating savings goals' convergence over time.
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { Goal } from "../../domain/goals/goal.types";
import { formatCurrency } from "../../lib/formatCurrency";
import { formatDate } from "../../lib/formatDate";
import { Card } from "../../components/ui/Card";
import { TrendingUp, CalendarDays, Sparkles } from "lucide-react";

import { getTodayDateString } from "../../lib/dateUtils";

interface SavingsTrajectoryChartProps {
  goals: Goal[];
}

interface PreparedGoal extends Goal {
  finalDate: Date;
  color: string;
}

export const SavingsTrajectoryChart: React.FC<SavingsTrajectoryChartProps> = ({ goals }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    goal: PreparedGoal;
    visible: boolean;
  } | null>(null);

  // 1. Handle element resizing gracefully using a ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep height relative and well-proportioned, capping at minimum 260px and maximum 360px
      const calculatedHeight = Math.max(260, Math.min(360, width * 0.4));
      setDimensions({
        width: Math.max(300, width),
        height: calculatedHeight,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Constants for dates & layout margins
  const referenceDateStr = getTodayDateString();
  const referenceDate = useMemo(() => new Date(referenceDateStr), [referenceDateStr]);

  const margins = { top: 25, right: 120, bottom: 45, left: 65 };

  // 3. Filter valid goals and calculate endpoints
  const preparedGoals = useMemo<PreparedGoal[]>(() => {
    return goals.map((g, index) => {
      const targetDateObj = new Date(g.targetDate);
      // Fallback if targetDate is invalid or in the past relative to reference date - ensures trajectory points forward
      const finalDate = targetDateObj.getTime() > referenceDate.getTime() 
        ? targetDateObj 
        : new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Shift 30 days ahead

      // Assign a distinct, beautiful palette color based on index
      const colors = [
        "#10b981", // Emerald
        "#6366f1", // Indigo
        "#f59e0b", // Amber
        "#06b6d4", // Cyan
        "#ec4899", // Pink
        "#8b5cf6", // Violet
        "#14b8a6", // Teal
      ];
      const color = colors[index % colors.length];

      return {
        ...g,
        finalDate,
        color,
      };
    });
  }, [goals, referenceDate]);

  // 4. Calculate scales with D3
  const scales = useMemo(() => {
    if (preparedGoals.length === 0) return null;

    // Dates range: from today to the furthest target date
    const dates = preparedGoals.map(g => g.finalDate);
    const maxDate = d3.max(dates) || new Date(referenceDate.getTime() + 180 * 24 * 60 * 60 * 1000);
    
    // Add 15 days of padding after the maximum date for labels comfort
    const adjustedMaxDate = new Date(maxDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const xScale = d3.scaleTime()
      .domain([referenceDate, adjustedMaxDate])
      .range([margins.left, dimensions.width - margins.right]);

    // Savings amount range: from 0 up to max target amount + safe visual ceiling
    const maxAmount = (d3.max(preparedGoals, (g: PreparedGoal) => Math.max(g.targetAmount, g.currentAmount)) as number) || 1000;
    const paddingMultiplier = 1.15; // 15% visual headroom
    const yScale = d3.scaleLinear()
      .domain([0, maxAmount * paddingMultiplier])
      .range([dimensions.height - margins.bottom, margins.top]);

    return { xScale, yScale };
  }, [preparedGoals, dimensions.width, dimensions.height, referenceDate, margins.left, margins.right, margins.top, margins.bottom]);

  // 5. Build D3 axis tick lists
  const axisTicks = useMemo(() => {
    if (!scales) return { x: [], y: [] };
    const { xScale, yScale } = scales;
    
    // Generate beautiful timeline ticks
    const xTicks = xScale.ticks(Math.max(3, Math.floor(dimensions.width / 130)));
    const yTicks = yScale.ticks(5);

    return { x: xTicks, y: yTicks };
  }, [scales, dimensions.width]);

  // If no goals, return an educational informative state
  if (goals.length === 0) {
    return (
      <Card className="p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Savings Progress</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-sm leading-relaxed">
          Define savings goals below, and we will model linear trajectories mapping your progress targets dynamically over a real-time calendar baseline.
        </p>
      </Card>
    );
  }

  // Draw lines or calculate trajectories
  const trajectoryPaths = preparedGoals.map((g) => {
    if (!scales) return null;
    const { xScale, yScale } = scales;

    const startX = xScale(referenceDate);
    const startY = yScale(g.currentAmount);

    const endX = xScale(g.finalDate);
    const endY = yScale(g.targetAmount);

    return {
      goal: g,
      startX,
      startY,
      endX,
      endY,
      color: g.color,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, path: typeof trajectoryPaths[0]) => {
    const svgRect = (e.currentTarget.ownerSVGElement ?? e.currentTarget).getBoundingClientRect();
    const cursorX = e.clientX - svgRect.left;
    const cursorY = e.clientY - svgRect.top;

    // Determine current interpolated amount based on current cursor X coordinate
    if (!scales) return;
    const { xScale } = scales;
    const cursorDate = xScale.invert(cursorX);
    
    const startMs = referenceDate.getTime();
    const targetMs = path.goal.finalDate.getTime();
    const cursorMs = Math.max(startMs, Math.min(targetMs, cursorDate.getTime()));

    const totalDuration = targetMs - startMs;
    const elapsed = cursorMs - startMs;

    const fraction = totalDuration > 0 ? (elapsed / totalDuration) : 0;
    const projectedAmount = path.goal.currentAmount + (path.goal.targetAmount - path.goal.currentAmount) * fraction;

    setHoveredGoalId(path.goal.id);
    setTooltip({
      x: cursorX + 15,
      y: cursorY - 10,
      goal: {
        ...path.goal,
        // Carry current virtual trajectory amount for the tooltip presentation
        currentAmount: projectedAmount,
      },
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setHoveredGoalId(null);
    setTooltip(null);
  };

  return (
    <Card className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-50 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">
              Savings Progress
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Linear savings vectors tracking progression paths to defined milestone limits.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 sm:gap-x-4">
          {preparedGoals.map((g) => (
            <div 
              key={g.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                hoveredGoalId === g.id 
                  ? "bg-slate-50 dark:bg-slate-800 shadow-xs" 
                  : "opacity-75"
              }`}
              style={{ borderLeft: `3px solid ${g.color}` }}
            >
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                {g.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas wrapper */}
      <div ref={containerRef} className="w-full h-full min-h-[260px] relative select-none">
        {scales && (
          <svg 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible"
          >
            {/* Definitions for gradients and drop shadows */}
            <defs>
              {preparedGoals.map((g) => (
                <linearGradient key={`grad-${g.id}`} id={`grad-${g.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={g.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Gridlines & X Axis */}
            <g className="grid-lines-x">
              {axisTicks.x.map((tick) => {
                const xVal = scales.xScale(tick);
                return (
                  <g key={tick.toISOString()} className="opacity-40 hover:opacity-100 transition-opacity">
                    <line
                      x1={xVal}
                      y1={margins.top}
                      x2={xVal}
                      y2={dimensions.height - margins.bottom}
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <text
                      x={xVal}
                      y={dimensions.height - margins.bottom + 16}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 font-medium text-[9px]"
                    >
                      {d3.timeFormat("%b '%y")(tick)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Gridlines & Y Axis */}
            <g className="grid-lines-y">
              {axisTicks.y.map((tick) => {
                const yVal = scales.yScale(tick);
                return (
                  <g key={tick} className="opacity-60">
                    <line
                      x1={margins.left}
                      y1={yVal}
                      x2={dimensions.width - margins.right}
                      y2={yVal}
                      stroke="currentColor"
                      strokeWidth={1}
                      className="text-slate-100/70 dark:text-slate-800 dark:text-slate-800/40"
                    />
                    <text
                      x={margins.left - 10}
                      y={yVal + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px] font-semibold"
                    >
                      {formatCurrency(tick)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Baseline bounding line */}
            <line 
              x1={margins.left} 
              y1={dimensions.height - margins.bottom} 
              x2={dimensions.width - margins.right} 
              y2={dimensions.height - margins.bottom}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1.5}
            />

            {/* Render shading bands & connection path trajectories */}
            {trajectoryPaths.map((path) => {
              const isHovered = hoveredGoalId === path.goal.id;
              const hasFocus = hoveredGoalId === null || isHovered;

              // Generate linear trajectory pathway
              return (
                <g 
                  key={path.goal.id} 
                  className="transition-all duration-300"
                  style={{ opacity: hasFocus ? 1 : 0.25 }}
                >
                  {/* Under-path filling gradient area */}
                  <path
                    d={`
                      M ${path.startX} ${scales.yScale(0)}
                      L ${path.startX} ${path.startY}
                      L ${path.endX} ${path.endY}
                      L ${path.endX} ${scales.yScale(0)}
                      Z
                    `}
                    fill={`url(#grad-${path.goal.id})`}
                    className="pointer-events-none transition-all duration-300"
                  />

                  {/* Linear growth connection trajectory path */}
                  <line
                    x1={path.startX}
                    y1={path.startY}
                    x2={path.endX}
                    y2={path.endY}
                    stroke={path.color}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={isHovered ? "none" : "3,3"}
                    className="cursor-pointer transition-all transition-duration"
                    filter={isHovered ? "url(#glow-effect)" : undefined}
                    onMouseMove={(e) => handleMouseMove(e, path)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Starting reserves node marker (Current today position) */}
                  <circle
                    cx={path.startX}
                    cy={path.startY}
                    r={isHovered ? 5.5 : 4}
                    fill={path.color}
                    className="stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                    strokeWidth={1.5}
                    onMouseMove={(e) => handleMouseMove(e, path)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Termination node marker (Target envelope position) */}
                  <g className="cursor-pointer">
                    <circle
                      cx={path.endX}
                      cy={path.endY}
                      r={isHovered ? 7 : 5}
                      fill="none"
                      stroke={path.color}
                      strokeWidth={1.5}
                      className="opacity-70 dark:opacity-90 animate-ping"
                      style={{ animationDuration: isHovered ? "1.5s" : "3s" }}
                    />
                    <circle
                      cx={path.endX}
                      cy={path.endY}
                      r={isHovered ? 5.5 : 4.5}
                      fill={path.color}
                      className="stroke-white dark:stroke-slate-900 transition-all"
                      strokeWidth={2}
                      onMouseMove={(e) => handleMouseMove(e, path)}
                      onMouseLeave={handleMouseLeave}
                    />
                  </g>

                  {/* Small inline goal target text annotations in margins */}
                  <g className="pointer-events-none">
                    <text
                      x={path.endX + 8}
                      y={path.endY + 3}
                      className="text-[9px] font-bold fill-slate-500 dark:fill-slate-400 select-none text-left"
                    >
                      {path.goal.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover interactive tooltip floating menu cards */}
        {tooltip && tooltip.visible && (
          <div
            className="absolute z-30 bg-white/95 dark:bg-slate-950/95 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-lg backdrop-blur-xs max-w-[190px] text-[11px] leading-relaxed select-none pointer-events-none animate-fade-in"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              borderLeft: `4px solid ${tooltip.goal.color}`,
            }}
          >
            <div className="font-bold text-slate-900 dark:text-white truncate">
              {tooltip.goal.name}
            </div>
            
            <div className="flex items-center justify-between mt-2 text-slate-400 gap-2">
              <span>Projection Today</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(tooltip.goal.currentAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 gap-2">
              <span>Goal Target</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(tooltip.goal.targetAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 mt-1.5 pt-1.5 text-slate-500 dark:text-slate-400/80 gap-2">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-slate-400" /> Date limit:
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(tooltip.goal.targetDate)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-3.5 mt-2">
        <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
          <span className="font-bold text-slate-800 dark:text-slate-200">Goal Progress:</span> Dashed lines show steady monthly savings toward each goal. Click a goal point to add savings.
        </p>
      </div>
    </Card>
  );
};
