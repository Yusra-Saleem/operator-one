"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";

interface SummaryData {
  mrr: number;
  arr: number;
  active_deals_count: number;
  total_pipeline_value: number;
  inventory_health_score: number;
  operational_health_score: number;
  recent_alerts?: Array<{ title: string; severity: string }>;
}

export const BusinessAnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchAnalytics = () => {
    fetchWithAuth("/api/v1/operations/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    const handleUpdate = () => fetchAnalytics();
    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("dataUpdated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("dataUpdated", handleUpdate);
    };
  }, []);

  const mrrVal = summary?.mrr ?? 0;
  const healthScore = summary?.operational_health_score ?? 100;
  const activeDeals = summary?.active_deals_count ?? 0;

  return (
    <div className="space-y-4">
      <div className="surface p-4 sm:p-6 rounded-xl space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">Executive Performance & Business Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive metrics aggregation across Revenue, Order Fulfillment, and Autonomous Agent Efficiency</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] text-purple-950 font-semibold bg-purple-50 border border-purple-200 px-2 py-1 rounded-md self-start sm:self-auto shrink-0">
              <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse" />
              <span>Live Synced ({lastUpdated})</span>
            </div>
          )}
        </div>

        {/* 2x2 Metric Grid on Mobile, 4 columns on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">Operational Health</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-slate-900">{healthScore}%</p>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 font-mono font-semibold block truncate">+1.8% vs target</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">Active Sales Pipeline</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-slate-900">${(summary?.total_pipeline_value ?? 0).toLocaleString()}</p>
            <span className="text-[9px] sm:text-[10px] text-purple-900 font-mono font-semibold block truncate">{activeDeals} Active Deals</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">Inventory Health</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-slate-900">{summary?.inventory_health_score ?? 100}%</p>
            <span className="text-[9px] sm:text-[10px] text-purple-900 font-mono font-semibold block truncate">Real-time Monitor</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">Monthly Revenue</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-slate-900">${mrrVal.toLocaleString()}</p>
            <span className="text-[9px] sm:text-[10px] text-purple-950 font-mono font-semibold block truncate">Live Revenue</span>
          </div>
        </div>

        {/* Executive Action Recommendations */}
        <div className="pt-3 space-y-2.5 border-t border-slate-200">
          <h4 className="font-mono font-bold text-xs text-slate-400 uppercase tracking-wider">AI Executive Action Directives</h4>
          <div className="space-y-2 text-xs text-slate-700">
            {summary?.recent_alerts && summary.recent_alerts.length > 0 ? (
              summary.recent_alerts.map((alert, idx) => (
                <div key={idx} className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-900 shrink-0" />
                    <span className="text-xs leading-snug">{alert.title}</span>
                  </div>
                  <span className="text-[9px] font-mono text-purple-950 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200 self-start sm:self-auto shrink-0">
                    {alert.severity}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-900 shrink-0" />
                    <span className="text-xs leading-snug">Execute automated reorder for PROC-X9-01 hardware to prevent supply bottleneck.</span>
                  </div>
                  <span className="text-[9px] font-mono text-purple-950 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200 self-start sm:self-auto shrink-0">High Priority</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs leading-snug">Schedule executive check-in for GlobalTech Solutions deal ($250,000) - 5 days inactive.</span>
                  </div>
                  <span className="text-[9px] font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 self-start sm:self-auto shrink-0">Medium Risk</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

  );
};
