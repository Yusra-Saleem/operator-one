"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../lib/api";

interface DataPoint {
  time: string;
  revenue: number;
  orders: number;
  growth: string;
}

const timeframeDatasets: Record<string, DataPoint[]> = {
  "24H": [
    { time: "00:00", revenue: 14200, orders: 42, growth: "+13.6%" },
    { time: "04:00", revenue: 15800, orders: 51, growth: "+12.8%" },
    { time: "08:00", revenue: 18900, orders: 68, growth: "+18.1%" },
    { time: "12:00", revenue: 24500, orders: 94, growth: "+16.6%" },
    { time: "16:00", revenue: 28900, orders: 112, growth: "+15.6%" },
    { time: "20:00", revenue: 31200, orders: 128, growth: "+11.4%" },
    { time: "Live", revenue: 35400, orders: 145, growth: "+18.0%" },
  ],
  "7D": [
    { time: "Mon", revenue: 125000, orders: 410, growth: "+8.7%" },
    { time: "Tue", revenue: 138000, orders: 460, growth: "+10.4%" },
    { time: "Wed", revenue: 142000, orders: 480, growth: "+9.2%" },
    { time: "Thu", revenue: 156000, orders: 530, growth: "+11.4%" },
    { time: "Fri", revenue: 168000, orders: 590, growth: "+12.0%" },
    { time: "Sat", revenue: 174000, orders: 610, growth: "+12.2%" },
    { time: "Sun", revenue: 185000, orders: 650, growth: "+15.6%" },
  ],
  "30D": [
    { time: "W1", revenue: 420000, orders: 1420, growth: "+10.5%" },
    { time: "W2", revenue: 480000, orders: 1650, growth: "+11.6%" },
    { time: "W3", revenue: 530000, orders: 1840, growth: "+10.4%" },
    { time: "W4", revenue: 610000, orders: 2100, growth: "+12.9%" },
  ],
  "1Y": [
    { time: "Q1", revenue: 1450000, orders: 5200, growth: "+7.4%" },
    { time: "Q2", revenue: 1680000, orders: 6100, growth: "+10.5%" },
    { time: "Q3", revenue: 1920000, orders: 7400, growth: "+9.7%" },
    { time: "Q4", revenue: 2220000, orders: 8600, growth: "+12.1%" },
  ],
};

// 1. Pure Monochromatic Dark Purple Revenue Area Line Chart
export const RevenueTrendChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<string>("7D");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<{ mrr: number; arr: number; total_pipeline_value: number } | null>(null);

  const fetchLiveMetrics = () => {
    fetchWithAuth("/api/v1/operations/summary")
      .then((res) => res.json())
      .then((d) => setSummaryData(d))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 10000);
    const handleUpdate = () => fetchLiveMetrics();
    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("dataUpdated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("dataUpdated", handleUpdate);
    };
  }, []);

  const baseDataset = timeframeDatasets[timeframe] || timeframeDatasets["7D"];

  // Scale dataset dynamically using live MRR / pipeline values when available
  const dataset = summaryData && summaryData.mrr > 0
    ? baseDataset.map((d, idx) => {
        const factor = 1 + (idx / baseDataset.length) * 0.15;
        const liveRev = Math.round((summaryData.mrr / (timeframe === "24H" ? 30 : timeframe === "7D" ? 4 : 1)) * factor);
        return {
          ...d,
          revenue: liveRev > 0 ? liveRev : d.revenue,
        };
      })
    : baseDataset;

  const maxVal = Math.max(...dataset.map((d) => d.revenue)) * 1.15;

  const height = 180;
  const width = 600;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = dataset.map((d, i) => {
    const x = paddingLeft + (i / (dataset.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const activeItem = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];

  return (
    <div className="surface p-4 sm:p-5 rounded-xl space-y-3.5 bg-white shadow-2xs border border-slate-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-900" />
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
            Revenue Telemetry & Velocity
          </h4>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
          {["24H", "7D", "30D", "1Y"].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                timeframe === tf
                  ? "bg-purple-950 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Highlight Header */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline gap-3">
          <span className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            ${activeItem.revenue.toLocaleString()}
          </span>
          <span className="text-xs font-mono font-bold text-purple-950 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
            {activeItem.growth}
          </span>
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          Period: <strong className="text-purple-950">{activeItem.time}</strong> ({activeItem.orders} orders)
        </div>
      </div>

      {/* Modern SVG Graph Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="purpleThemeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#581c87" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Clean Horizontal Grid Lines */}
          {yTicks.map((val, idx) => {
            const yPos = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            const label =
              val >= 1000000
                ? `$${(val / 1000000).toFixed(1)}M`
                : val >= 1000
                ? `$${(val / 1000).toFixed(0)}k`
                : `$0`;

            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-slate-400 font-medium"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#purpleThemeGradient)" />

          {/* Solid Dark Purple Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#581c87"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx || (hoveredIdx === null && idx === points.length - 1);
            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)}>
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={paddingTop + chartHeight}
                    stroke="#581c87"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="opacity-40"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "4.5" : "2.5"}
                  fill={isHovered ? "#3b0764" : "#ffffff"}
                  stroke="#581c87"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-all ${
                    isHovered ? "fill-purple-950 font-bold" : "fill-slate-400 font-medium"
                  }`}
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-900" /> Live Operations Telemetry Stream
        </span>
        <span className="text-purple-950 font-semibold">Updated 10s ago</span>
      </div>
    </div>
  );
};

// 2. Dynamic Sales Funnel Chart
export const SalesFunnelChart: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([]);

  const fetchDeals = () => {
    fetchWithAuth("/api/v1/sales/deals")
      .then((res) => res.json())
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .catch(() => setDeals([]));
  };

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 10000);
    const handleUpdate = () => fetchDeals();
    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("dataUpdated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("dataUpdated", handleUpdate);
    };
  }, []);

  const totalDeals = deals.length;
  const stageMap: Record<string, { count: number; value: number; color: string; percent: number }> = {
    "Qualified": { count: 0, value: 0, color: "bg-purple-950", percent: 45 },
    "Proposal": { count: 0, value: 0, color: "bg-purple-900", percent: 65 },
    "Negotiation": { count: 0, value: 0, color: "bg-purple-800", percent: 85 },
    "Closed Won": { count: 0, value: 0, color: "bg-purple-700", percent: 100 },
  };

  deals.forEach((d) => {
    const st = d.stage || "Qualified";
    if (!stageMap[st]) {
      stageMap[st] = { count: 0, value: 0, color: "bg-purple-800", percent: 50 };
    }
    stageMap[st].count += 1;
    stageMap[st].value += Number(d.value || 0);
  });

  const stagesList = Object.entries(stageMap).map(([stage, info]) => ({
    stage,
    ...info,
  }));

  const wonDeals = stageMap["Closed Won"]?.count || 0;
  const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : "0.0";

  return (
    <div className="surface p-4 sm:p-5 rounded-xl space-y-3.5 bg-white shadow-2xs border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-900" />
            <h4 className="font-display font-bold text-sm text-slate-900">Sales Conversion Funnel</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Live pipeline volume & stage breakdown</p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-100 text-purple-950 rounded border border-purple-200">
          {totalDeals} Active Deals
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {stagesList.map((st, idx) => (
          <div key={idx} className="space-y-1.5 group cursor-pointer">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 group-hover:text-purple-950 transition-colors">
                {st.stage}
              </span>
              <span className="font-mono text-slate-500">
                <strong className="text-slate-900">${st.value.toLocaleString()}</strong> ({st.count} deals)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60">
              <div
                className={`${st.color} h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110 shadow-2xs`}
                style={{ width: `${Math.max(10, (st.count / (totalDeals || 1)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
        <span>Real-time Live Pipeline</span>
        <span className="text-purple-950 font-semibold">Conversion Rate: {conversionRate}%</span>
      </div>
    </div>
  );
};

// 3. Dynamic Inventory Donut Chart
export const InventoryHealthDonut: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  const fetchStock = () => {
    fetchWithAuth("/api/v1/inventory/stock")
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 10000);
    const handleUpdate = () => fetchStock();
    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("dataUpdated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("dataUpdated", handleUpdate);
    };
  }, []);

  const totalSKUs = items.length;
  const inStock = items.filter((i) => i.status === "In Stock").length;
  const lowStock = items.filter((i) => i.status === "Low Stock").length;
  const outOfStock = items.filter((i) => i.status === "Out of Stock").length;

  const healthScore = totalSKUs > 0 ? Math.round(((totalSKUs - outOfStock - lowStock) / totalSKUs) * 100) : 100;

  const stockCategories = [
    { label: "Optimal Stock", count: inStock, color: "#581c87" },
    { label: "Low Stock Alert", count: lowStock, color: "#7c3aed" },
    { label: "Out of Stock", count: outOfStock, color: "#c084fc" },
  ];

  return (
    <div className="surface p-4 sm:p-5 rounded-xl space-y-4 bg-white shadow-2xs border border-slate-200 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-900" />
            <h4 className="font-display font-bold text-sm text-slate-900">Inventory Stock Health</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time SKU safety buffers</p>
        </div>
        <span className="text-xs font-mono font-bold text-purple-950 bg-purple-100 px-2.5 py-1 rounded border border-purple-200">
          {healthScore}% Score
        </span>
      </div>

      <div className="flex items-center justify-center gap-6 py-2">
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="#581c87" strokeWidth="4.5" strokeDasharray={`${healthScore}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display font-bold text-xl text-slate-900">{totalSKUs}</span>
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Total SKUs</span>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          {stockCategories.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: c.color }} />
              <span className="text-slate-600 font-medium">{c.label}:</span>
              <strong className="text-slate-900 font-mono">{c.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Auto-Procurement: <strong className="text-slate-800">Active</strong></span>
        <span className="text-purple-950 font-semibold">{outOfStock + lowStock} Critical Items</span>
      </div>
    </div>
  );
};
