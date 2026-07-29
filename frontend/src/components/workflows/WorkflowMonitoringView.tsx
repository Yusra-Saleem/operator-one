"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";

interface WorkflowItem {
  id: string;
  name: string;
  status: string;
  triggered_by: string;
  start_time: string;
  progress: number;
}

export const WorkflowMonitoringView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingWf, setEditingWf] = useState<WorkflowItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [triggeredBy, setTriggeredBy] = useState("Manager");
  const [status, setStatus] = useState("Active");
  const [progress, setProgress] = useState<number>(25);

  const fetchWorkflows = () => {
    fetchWithAuth("/api/v1/workflows/active")
      .then((res) => res.json())
      .then((data) => setWorkflows(data))
      .catch(() => {
        setWorkflows([]);
      });
  };

  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 10000);
    const handleUpdate = () => fetchWorkflows();
    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("dataUpdated", handleUpdate);
    return () => {
      clearInterval(clockTimer);
      clearInterval(interval);
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("dataUpdated", handleUpdate);
    };
  }, []);

  const openNewModal = () => {
    setEditingWf(null);
    setName("");
    setTriggeredBy("Voice Manager");
    setStatus("Active");
    setProgress(15);
    setShowModal(true);
  };

  const openEditModal = (wf: WorkflowItem) => {
    setEditingWf(wf);
    setName(wf.name);
    setTriggeredBy(wf.triggered_by);
    setStatus(wf.status);
    setProgress(wf.progress);
    setShowModal(true);
  };

  const handleSaveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingWf) {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === editingWf.id ? { ...w, name, triggered_by: triggeredBy, status, progress } : w
        )
      );
    } else {
      const newWf: WorkflowItem = {
        id: `WF-${Math.floor(100 + Math.random() * 900)}`,
        name,
        triggered_by: triggeredBy,
        status,
        progress,
        start_time: "Just now",
      };
      setWorkflows((prev) => [newWf, ...prev]);
    }
    setShowModal(false);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="surface p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3.5 gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">Automated Business Tasks</h3>
            {currentTime && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-950 text-[10px] font-mono font-semibold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-900 animate-ping" />
                <span className="truncate max-w-[170px] sm:max-w-none">Live Clock: {currentTime}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Track automatic background tasks, approvals, and completion progress in real time.</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-md font-semibold text-[11px] transition-all shadow-xs self-start sm:self-auto shrink-0"
        >
          + Trigger Workflow
        </button>
      </div>

      <div className="space-y-2.5">
        {workflows.map((wf) => (
          <div key={wf.id} className="p-3 sm:p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2 text-xs hover:bg-white transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-slate-900 shrink-0">{wf.id}</span>
                <span className="font-semibold text-slate-900 truncate">{wf.name}</span>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    wf.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : wf.status === "Active"
                      ? "bg-purple-100 text-purple-950 border-purple-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {wf.status}
                </span>
                <button
                  onClick={() => openEditModal(wf)}
                  title="Edit Workflow"
                  className="p-1 text-slate-500 hover:text-purple-950 rounded hover:bg-slate-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteWorkflow(wf.id)}
                  title="Delete Workflow"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
              <span>Triggered by: <strong className="text-slate-800">{wf.triggered_by}</strong></span>
              <span className="font-mono text-slate-400">{wf.start_time}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-900 h-full transition-all duration-500"
                style={{ width: `${wf.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>


      {/* Add / Edit Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">
                {editingWf ? `Edit Workflow (${editingWf.id})` : "Trigger New Workflow"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Automated Reorder & Stock Clearance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Triggered By</label>
                  <input
                    type="text"
                    value={triggeredBy}
                    onChange={(e) => setTriggeredBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Progress Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-md font-semibold shadow-2xs"
                >
                  Save Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
