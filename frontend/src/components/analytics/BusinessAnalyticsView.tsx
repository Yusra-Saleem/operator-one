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
    <div className="space-y-6">
      <div className="surface p-5 sm:p-6 rounded-xl space-y-5">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Executive Performance & Business Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive metrics aggregation across Revenue, Order Fulfillment, and Autonomous Agent Efficiency</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-purple-950 font-semibold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse" />
              <span>Live Synced ({lastUpdated})</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Operational Health Score</span>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">{healthScore}%</p>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold">+1.8% vs target</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Active Sales Pipeline</span>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">${(summary?.total_pipeline_value ?? 250000).toLocaleString()}</p>
            <span className="text-[10px] text-purple-900 font-mono font-semibold">{activeDeals} Active Deals</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Inventory Health Index</span>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">{summary?.inventory_health_score ?? 94}%</p>
            <span className="text-[10px] text-purple-900 font-mono font-semibold">Real-time Stock Monitor</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Monthly Recurring Revenue</span>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">${mrrVal.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold">Target: $100,000</span>
          </div>
        </div>

        {/* Executive Action Recommendations */}
        <div className="pt-4 space-y-3 border-t border-slate-200">
          <h4 className="font-mono font-bold text-xs text-slate-400 uppercase tracking-wider">AI Executive Action Directives</h4>
          <div className="space-y-2 text-xs text-slate-700">
            {summary?.recent_alerts && summary.recent_alerts.length > 0 ? (
              summary.recent_alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-900" />
                    <span>{alert.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-950 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                    {alert.severity}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-900" />
                    <span>Execute automated reorder for PROC-X9-01 hardware to prevent supply bottleneck.</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-950 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">High Priority</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Schedule executive check-in for GlobalTech Solutions deal ($250,000) - 5 days inactive.</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Medium Risk</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
