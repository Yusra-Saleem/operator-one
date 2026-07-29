"use client";

import React, { useEffect, useState } from "react";
import { RevenueTrendChart, SalesFunnelChart, InventoryHealthDonut } from "./AnalyticsCharts";
import { fetchWithAuth } from "../../lib/api";
import { printPDFReport, exportToCSV } from "../../lib/exportUtils";

interface ExecutiveSummaryData {
  mrr: number;
  arr: number;
  active_deals_count: number;
  total_pipeline_value: number;
  inventory_health_score: number;
  operational_health_score: number;
  pending_approvals_count: number;
  open_alerts_count: number;
  recent_alerts: Array<{
    id: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    category: string;
  }>;
}

export const ExecutiveOverview: React.FC = () => {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");

  const handleExportPDF = () => {
    if (!data) return;
    const html = `
      <div style="margin-bottom: 20px;">
        <div class="metric-card"><div class="metric-title">Monthly Revenue</div><div class="metric-val">$${data.mrr.toLocaleString()}</div></div>
        <div class="metric-card"><div class="metric-title">Annual Revenue</div><div class="metric-val">$${data.arr.toLocaleString()}</div></div>
        <div class="metric-card"><div class="metric-title">Pipeline Deals</div><div class="metric-val">$${data.total_pipeline_value.toLocaleString()} (${data.active_deals_count} deals)</div></div>
        <div class="metric-card"><div class="metric-title">Stock Health Score</div><div class="metric-val">${data.inventory_health_score}%</div></div>
      </div>
      <h3>Recent Business Warnings & Alerts</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Severity</th><th>Title</th><th>Description</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${data.recent_alerts.map(a => `<tr><td>${a.id}</td><td>${a.severity.toUpperCase()}</td><td>${a.title}</td><td>${a.message}</td><td>${a.timestamp}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
    printPDFReport("Executive Business Summary Report", html);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["Metric Name", "Value", "Status"];
    const rows = [
      ["Monthly Recurring Revenue (MRR)", `$${data.mrr}`, "Active"],
      ["Annual Recurring Revenue (ARR)", `$${data.arr}`, "Active"],
      ["Active Sales Pipeline Value", `$${data.total_pipeline_value}`, `${data.active_deals_count} Deals`],
      ["Inventory Health Score", `${data.inventory_health_score}%`, "Good"],
      ["Operational Health Score", `${data.operational_health_score}%`, "Optimal"],
    ];
    exportToCSV("Business_Summary_Report", headers, rows);
  };

  const fetchSummary = () => {
    fetchWithAuth("/api/v1/operations/summary")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        setLastSyncedTime(new Date().toLocaleTimeString());
      })
      .catch(() => {
        setData({
          mrr: 0,
          arr: 0,
          active_deals_count: 0,
          total_pipeline_value: 0,
          inventory_health_score: 100,
          operational_health_score: 100,
          pending_approvals_count: 0,
          open_alerts_count: 0,
          recent_alerts: []
        });
        setLoading(false);
        setLastSyncedTime(new Date().toLocaleTimeString());
      });
  };

  useEffect(() => {
    fetchSummary();
    const timer = setInterval(() => {
      fetchSummary();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !data) {
    return <div className="surface rounded-lg p-6 text-xs text-slate-400 animate-pulse">Loading real-time executive metrics...</div>;
  }

  const metrics = [
    {
      title: "Monthly Recurring Revenue",
      value: `$${data.mrr.toLocaleString()}`,
      badge: "+14.2% MoM",
      badgeType: "success",
      icon: (
        <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Active Sales Pipeline",
      value: `$${data.total_pipeline_value.toLocaleString()}`,
      badge: `${data.active_deals_count} Deals`,
      badgeType: "neutral",
      icon: (
        <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
        </svg>
      )
    },
    {
      title: "Inventory Health Score",
      value: `${data.inventory_health_score}%`,
      badge: data.inventory_health_score < 85 ? "Attention" : "Optimal",
      badgeType: data.inventory_health_score < 85 ? "warning" : "success",
      icon: (
        <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    },
    {
      title: "Operational Efficiency",
      value: `${data.operational_health_score}%`,
      badge: "High Perf.",
      badgeType: "success",
      icon: (
        <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Summary Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="eyebrow text-[10px]">Operations Briefing</span>
          <h1 className="display-heading text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            Executive Summary Overview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-white rounded-md text-[11px] font-bold transition-all shadow-xs"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold transition-all shadow-2xs"
          >
            Export Excel
          </button>
          <div className="hidden xs:flex items-center gap-1.5 text-[10px] text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-900 animate-pulse" />
            <span className="font-mono">Synced: {lastSyncedTime}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="surface surface-hover p-3 sm:p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-1 sm:p-1.5 rounded-md bg-purple-100/70 border border-purple-200">
                {m.icon}
              </div>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-950 border-purple-200 truncate max-w-[80px]">
                {m.badge}
              </span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">{m.title}</p>
              <p className="text-base sm:text-lg lg:text-xl font-display font-bold text-slate-900 tracking-tight mt-0.5">
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>


      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart />
        </div>
        <div>
          <InventoryHealthDonut />
        </div>
      </div>

      {/* Funnel & Risk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesFunnelChart />

        {/* Operational Warnings & Risk Identification */}
        <div className="surface p-4 rounded-lg space-y-3 bg-white shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-xs text-slate-900">Operational Risk Alerts</h3>
              <p className="text-[11px] text-slate-500">Autonomous anomaly telemetry</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded">
              {data.open_alerts_count} Alerts
            </span>
          </div>

          <div className="space-y-2">
            {data.recent_alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded border border-slate-200 bg-slate-50/50 flex items-start justify-between text-[11px] hover:bg-white hover:border-purple-300 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        alert.severity === "high" ? "bg-rose-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="font-semibold text-slate-900">{alert.title}</span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">
                      [{alert.category}]
                    </span>
                  </div>
                  <p className="text-slate-600 pl-3 leading-snug">{alert.message}</p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
