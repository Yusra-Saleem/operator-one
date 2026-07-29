"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";
import { printPDFReport, exportToCSV } from "../../lib/exportUtils";

interface Deal {
  id: string;
  client_name: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  last_contact: string;
}

export const SalesPipelineWidget: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Form State
  const [clientName, setClientName] = useState("");
  const [value, setValue] = useState<number>(50000);
  const [stage, setStage] = useState("Qualified");
  const [probability, setProbability] = useState<number>(50);
  const [owner, setOwner] = useState("Yusra Saleem");

  const fetchDeals = () => {
    fetchWithAuth("/api/v1/sales/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data))
      .catch(() => {
        setDeals([]);
      });
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

  const totalValue = deals.reduce((acc, d) => acc + d.value, 0);

  const openNewDealModal = () => {
    setEditingDeal(null);
    setClientName("");
    setValue(50000);
    setStage("Qualified");
    setProbability(50);
    setOwner("Yusra Saleem");
    setShowModal(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setClientName(deal.client_name);
    setValue(deal.value);
    setStage(deal.stage);
    setProbability(deal.probability);
    setOwner(deal.owner);
    setShowModal(true);
  };

  const handleSaveDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    if (editingDeal) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === editingDeal.id
            ? { ...d, client_name: clientName, value, stage, probability, owner, last_contact: "Just now" }
            : d
        )
      );
      fetchWithAuth(`/api/v1/sales/deals/${editingDeal.id}`, {
        method: "PUT",
        body: JSON.stringify({ client_name: clientName, value, stage, probability, owner }),
      }).then(() => fetchDeals());
    } else {
      const newDeal: Deal = {
        id: `DEAL-${Math.floor(100 + Math.random() * 900)}`,
        client_name: clientName,
        value,
        stage,
        probability,
        owner,
        last_contact: "Just now",
      };
      setDeals((prev) => [newDeal, ...prev]);
      fetchWithAuth("/api/v1/sales/deals", {
        method: "POST",
        body: JSON.stringify({ client_name: clientName, value, stage }),
      }).then(() => fetchDeals());
    }
    setShowModal(false);
  };

  const handleDeleteDeal = (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      setDeals((prev) => prev.filter((d) => d.id !== id));
      fetchWithAuth(`/api/v1/sales/deals/${id}`, { method: "DELETE" })
        .then(() => fetchDeals())
        .catch(() => fetchDeals());
    }
  };
  const handleExportPDF = () => {
    const html = `
      <h3>Total Sales Pipeline: $${totalValue.toLocaleString()}</h3>
      <table>
        <thead>
          <tr><th>Deal ID</th><th>Client Name</th><th>Value</th><th>Stage</th><th>Winning Chance</th><th>Owner</th><th>Last Contact</th></tr>
        </thead>
        <tbody>
          ${deals.map(d => `<tr><td>${d.id}</td><td>${d.client_name}</td><td>$${d.value.toLocaleString()}</td><td>${d.stage}</td><td>${d.probability}%</td><td>${d.owner}</td><td>${d.last_contact}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
    printPDFReport("Sales Pipeline & Deals Report", html);
  };

  const handleExportCSV = () => {
    const headers = ["Deal ID", "Client Name", "Value ($)", "Stage", "Winning Chance (%)", "Owner", "Last Contact"];
    const rows = deals.map(d => [d.id, d.client_name, d.value, d.stage, `${d.probability}%`, d.owner, d.last_contact]);
    exportToCSV("Sales_Pipeline_Report", headers, rows);
  };

  return (
    <div className="surface p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900">Sales & Active Deals</h3>
          <p className="text-xs text-slate-500">Track your active sales pipeline, deal values, winning chances, and client contacts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handleExportPDF}
            className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-white rounded-md text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold transition-all shadow-2xs flex items-center gap-1"
          >
            Export CSV
          </button>
          <span className="text-[11px] font-mono font-semibold px-2 py-1 bg-purple-100 text-purple-950 border border-purple-200 rounded-md">
            Total: ${totalValue.toLocaleString()}
          </span>
          <button
            onClick={openNewDealModal}
            className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-md text-[11px] font-semibold transition-all shadow-2xs"
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* Mobile Screen Responsive Cards List (sm:hidden) */}
      <div className="block sm:hidden space-y-2.5">
        {deals.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">No active deals found. Click "+ New Deal" to create one.</div>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">{deal.client_name}</span>
                  <span className="text-[10px] font-mono text-slate-400">[{deal.id}] • {deal.owner}</span>
                </div>
                <span className="font-mono font-bold text-sm text-purple-900">${deal.value.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                      deal.stage === "Closed Won"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : deal.stage === "Negotiation"
                        ? "bg-purple-100 text-purple-950 border border-purple-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {deal.stage}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{deal.probability}% Win</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(deal)}
                    title="Edit Deal"
                    className="p-1 hover:bg-slate-200/60 rounded text-slate-600 hover:text-purple-950 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    title="Delete Deal"
                    className="p-1 hover:bg-rose-100/60 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tablet & Desktop Data Table (hidden sm:block) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider bg-slate-100/70">
              <th className="py-2.5 px-3">Deal ID</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Value</th>
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Winning Chance</th>
              <th className="py-2.5 px-3">Owner</th>
              <th className="py-2.5 px-3">Last Contact</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-mono font-medium text-slate-900">{deal.id}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{deal.client_name}</td>
                <td className="py-3 px-3 font-mono font-bold text-purple-900">${deal.value.toLocaleString()}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      deal.stage === "Closed Won"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : deal.stage === "Negotiation"
                        ? "bg-purple-100 text-purple-950 border border-purple-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {deal.stage}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono">{deal.probability}%</td>
                <td className="py-3 px-3">{deal.owner}</td>
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{deal.last_contact}</td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(deal)}
                      title="Edit Deal"
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-purple-950 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      title="Delete Deal"
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Add / Edit Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">
                {editingDeal ? `Edit Deal (${editingDeal.id})` : "Create New Sales Deal"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Maryam Boutique Wholesale"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Value ($)</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 bg-white"
                  >
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deal Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
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
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
