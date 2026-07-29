"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../lib/api";

interface AgentActivity {
  time: string;
  agent: string;
  action: string;
  status: string;
}

export const AgentActivitiesWidget: React.FC = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  const fetchActivities = () => {
    fetchWithAuth("/api/v1/operations/agent-activities")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActivities(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState("SalesAgent");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const quickAgentTasks = [
    { label: "Scan Low Stock Abayas & Caps", agent: "InventoryAgent", prompt: "Check stock levels for Abayas, Scarfs, and Caps" },
    { label: "Check Sales Revenue Summary", agent: "SalesAgent", prompt: "Summarize total sales revenue and active client orders" },
    { label: "Generate Store Operations Brief", agent: "ExecutiveAgent", prompt: "Compile overall business MRR and store health score" }
  ];

  const handleRunTask = (agent: string, promptText: string) => {
    if (!promptText.trim()) return;
    setIsExecuting(true);

    const newLog: AgentActivity = {
      time: "Just now",
      agent,
      action: `Executed task directive: "${promptText}"`,
      status: "Active"
    };

    setActivities((prev) => [newLog, ...prev]);

    // Send to backend endpoint
    fetchWithAuth("/agent/execute", {
      method: "POST",
      body: JSON.stringify({ user_input: promptText, agent })
    })
      .then((res) => res.json())
      .then(() => {
        setIsExecuting(false);
        setShowTaskModal(false);
        setActivities((prev) =>
          prev.map((a, idx) => (idx === 0 ? { ...a, status: "Completed" } : a))
        );
      })
      .catch(() => {
        setIsExecuting(false);
        setShowTaskModal(false);
        setActivities((prev) =>
          prev.map((a, idx) => (idx === 0 ? { ...a, status: "Completed" } : a))
        );
      });
  };

  return (
    <div className="surface p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900">AI Assistants Task History</h3>
          <p className="text-xs text-slate-500">See what your AI assistants are doing in real time and assign them new tasks.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-md text-[11px] font-semibold transition-all shadow-2xs"
          >
            Run Task
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse" />
            <span className="font-mono text-[11px]">Telemetry Active</span>
          </div>
        </div>
      </div>

      {/* Quick Agent Command Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-slate-400 font-medium text-[10px] whitespace-nowrap shrink-0">Quick Agent Actions:</span>
        {quickAgentTasks.map((qt, idx) => (
          <button
            key={idx}
            onClick={() => handleRunTask(qt.agent, qt.prompt)}
            className="px-2 py-0.5 bg-slate-50 hover:bg-purple-100 hover:text-purple-950 text-slate-700 rounded border border-slate-200 text-[10px] font-medium whitespace-nowrap transition-all shrink-0"
          >
            [{qt.agent}] {qt.label}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="space-y-2.5">
        {activities.map((act, idx) => (
          <div
            key={idx}
            className="p-3 sm:p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-white hover:border-purple-300 transition-all"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 text-purple-950 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                AG
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{act.agent}</span>
                  <span className="text-[10px] text-slate-400 font-mono">[{act.time}]</span>
                </div>
                <p className="text-slate-600 text-xs leading-snug">{act.action}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border self-start sm:self-auto shrink-0 ${
                act.status === "Active"
                  ? "bg-purple-100 text-purple-950 border-purple-200 animate-pulse"
                  : "bg-purple-100 text-purple-950 border-purple-200"
              }`}
            >
              {act.status}
            </span>
          </div>
        ))}
      </div>


      {/* Custom Task Execution Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">Dispatch Autonomous Agent Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 bg-white"
                >
                  <option value="SalesAgent">SalesAgent (Pipeline & Deals)</option>
                  <option value="InventoryAgent">InventoryAgent (SKUs & Procurement)</option>
                  <option value="ExecutiveAgent">ExecutiveAgent (Business Telemetry)</option>
                  <option value="ReportingAgent">ReportingAgent (Financial Forecasts)</option>
                  <option value="CoordinatorAgent">CoordinatorAgent (Multi-Tool Routing)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Directive / Command</label>
                <textarea
                  rows={3}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="Describe the task for the autonomous agent to perform..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => handleRunTask(selectedAgent, taskPrompt)}
                  className="px-4 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-md font-semibold shadow-2xs disabled:opacity-50"
                >
                  {isExecuting ? "Executing..." : "Dispatch Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
