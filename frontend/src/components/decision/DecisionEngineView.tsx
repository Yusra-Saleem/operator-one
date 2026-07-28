"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";

interface Recommendation {
  id: string;
  title: string;
  category: string;
  confidence_score: number;
  impact_estimate: string;
  explanation: string;
  suggested_action: string;
}

interface DecisionData {
  overall_risk_score: number;
  active_risks_count: number;
  data_freshness: string;
  top_recommendations: Recommendation[];
}

export const DecisionEngineView: React.FC = () => {
  const [data, setData] = useState<DecisionData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sales");
  const [confidence, setConfidence] = useState<number>(0.92);
  const [impact, setImpact] = useState("");
  const [explanation, setExplanation] = useState("");
  const [action, setAction] = useState("");

  const fetchDecisionInsights = () => {
    fetchWithAuth("/api/v1/decision/insights")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setRecommendations(d.top_recommendations || []);
      })
      .catch(() => {
        const defaultData: DecisionData = {
          overall_risk_score: 0,
          active_risks_count: 0,
          data_freshness: "Live DB Sync",
          top_recommendations: []
        };
        setData(defaultData);
        setRecommendations([]);
      });
  };

  useEffect(() => {
    fetchDecisionInsights();
    const interval = setInterval(fetchDecisionInsights, 10000);
    return () => clearInterval(interval);
  }, []);

  const openNewRecModal = () => {
    setEditingRec(null);
    setTitle("");
    setCategory("sales");
    setConfidence(0.92);
    setImpact("High impact on MRR conversion");
    setExplanation("");
    setAction("");
    setShowModal(true);
  };

  const openEditRecModal = (rec: Recommendation) => {
    setEditingRec(rec);
    setTitle(rec.title);
    setCategory(rec.category);
    setConfidence(rec.confidence_score);
    setImpact(rec.impact_estimate);
    setExplanation(rec.explanation);
    setAction(rec.suggested_action);
    setShowModal(true);
  };

  const handleSaveRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingRec) {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === editingRec.id
            ? { ...r, title, category, confidence_score: confidence, impact_estimate: impact, explanation, suggested_action: action }
            : r
        )
      );
    } else {
      const newRec: Recommendation = {
        id: `REC-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
        title,
        category,
        confidence_score: confidence,
        impact_estimate: impact,
        explanation,
        suggested_action: action,
      };
      setRecommendations((prev) => [newRec, ...prev]);
    }
    setShowModal(false);
  };

  const handleDeleteRec = (id: string) => {
    if (confirm("Are you sure you want to delete this decision recommendation?")) {
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (!data) return <div className="p-6 text-sm text-slate-400 animate-pulse">Evaluating enterprise business risk engine...</div>;

  return (
    <div className="space-y-6">
      {/* Risk Header Overview */}
      <div className="surface p-5 sm:p-6 rounded-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Smart AI Business Advice</h3>
            <p className="text-xs text-slate-500 mt-0.5">Get AI-generated suggestions to increase sales, prevent stock delays, and reduce business risks.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openNewRecModal}
              className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-md text-xs font-semibold transition-all shadow-2xs"
            >
              + Create Recommendation
            </button>
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-purple-900">{data.overall_risk_score} / 100</span>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-medium">Risk Index Score</p>
            </div>
          </div>
        </div>

        {/* Predictive Recommendations */}
        <div className="space-y-3 pt-2">
          <h4 className="font-mono font-bold text-xs uppercase text-slate-400 tracking-wider">
            AI & Manual Decision Directives ({recommendations.length})
          </h4>
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-lg space-y-3 text-xs hover:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{rec.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">[{rec.id}]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-950 border border-purple-200">
                    {(rec.confidence_score * 100).toFixed(0)}% Confidence
                  </span>
                  <button
                    onClick={() => openEditRecModal(rec)}
                    title="Edit Directive"
                    className="p-1 text-slate-500 hover:text-purple-950 rounded hover:bg-slate-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRec(rec.id)}
                    title="Delete Directive"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-slate-600"><strong>Rationale:</strong> {rec.explanation}</p>
              <div className="p-3 bg-purple-100/70 border border-purple-200 rounded-md text-purple-950 font-medium">
                <strong className="text-purple-900">Suggested Action:</strong> {rec.suggested_action}
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Estimated Impact: <strong>{rec.impact_estimate}</strong></span>
                <button
                  onClick={() => alert(`Executed decision directive: ${rec.title}`)}
                  className="px-3 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded font-medium text-[11px] transition-all shadow-2xs"
                >
                  Execute Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Recommendation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">
                {editingRec ? `Edit Decision Directive (${editingRec.id})` : "Create Decision Directive"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRec} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Executive Review for Enterprise Accounts"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 bg-white"
                  >
                    <option value="sales">Sales & Revenue</option>
                    <option value="inventory">Inventory & Logistics</option>
                    <option value="operations">Operations & Risks</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confidence (0.0 - 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Explanation / Rationale</label>
                <textarea
                  rows={2}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why this decision is recommended..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Suggested Action</label>
                <input
                  type="text"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="e.g. Trigger automated email campaign to key leads"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Impact Estimate</label>
                <input
                  type="text"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  placeholder="e.g. Protects $150,000 pipeline value"
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
                  Save Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
