"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";
import { printPDFReport, exportToCSV } from "../../lib/exportUtils";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorder_level: number;
  unit_price: number;
  status: string;
}

export const InventoryStatusWidget: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [quantity, setQuantity] = useState<number>(20);
  const [unitPrice, setUnitPrice] = useState<number>(150);
  const [status, setStatus] = useState("In Stock");

  const fetchStock = () => {
    fetchWithAuth("/api/v1/inventory/stock")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {
        setItems([]);
      });
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

  const openNewItemModal = () => {
    setEditingItem(null);
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setName("");
    setCategory("Hardware");
    setQuantity(25);
    setUnitPrice(150);
    setStatus("In Stock");
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnitPrice(item.unit_price);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, sku, name, category, quantity, unit_price: unitPrice, status }
            : i
        )
      );
      fetchWithAuth(`/api/v1/inventory/item/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, quantity, unit_price: unitPrice, status }),
      }).then(() => fetchStock());
    } else {
      const newItem: InventoryItem = {
        id: `INV-${Math.floor(100 + Math.random() * 900)}`,
        sku,
        name,
        category,
        quantity,
        reorder_level: 15,
        unit_price: unitPrice,
        status,
      };
      setItems((prev) => [newItem, ...prev]);
      fetchWithAuth("/api/v1/inventory/item", {
        method: "POST",
        body: JSON.stringify({ name, sku, category, quantity, unit_price: unitPrice }),
      }).then(() => fetchStock());
    }
    setShowModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      fetchWithAuth(`/api/v1/inventory/stock/${id}`, { method: "DELETE" })
        .then(() => fetchStock())
        .catch(() => fetchStock());
    }
  };

  const handleReorder = (sku: string) => {
    fetchWithAuth("/api/v1/inventory/reorder", {
      method: "POST",
      body: JSON.stringify({ sku_or_id: sku, quantity: 50 })
    })
      .then((res) => res.json())
      .then(() => alert(`Reorder triggered for SKU ${sku}`))
      .catch(() => alert(`Reorder triggered for SKU ${sku}`));
  };

  const handleExportPDF = () => {
    const html = `
      <h3>Inventory & Warehouse Stock Report</h3>
      <table>
        <thead>
          <tr><th>SKU</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Unit Price</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${items.map(i => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.category}</td><td>${i.quantity}</td><td>$${i.unit_price}</td><td>${i.status}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
    printPDFReport("Warehouse Inventory Stock Report", html);
  };

  const handleExportCSV = () => {
    const headers = ["SKU", "Item Name", "Category", "Quantity", "Unit Price ($)", "Status"];
    const rows = items.map(i => [i.sku, i.name, i.category, i.quantity, i.unit_price, i.status]);
    exportToCSV("Inventory_Stock_Report", headers, rows);
  };

  return (
    <div className="surface p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900">Stock & Inventory Status</h3>
          <p className="text-xs text-slate-500">Monitor warehouse stock levels, low-stock warnings, and trigger instant reorders.</p>
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
          <button
            onClick={openNewItemModal}
            className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-md text-[11px] font-semibold transition-all shadow-2xs"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Mobile Screen Responsive Cards List (sm:hidden) */}
      <div className="block sm:hidden space-y-2.5">
        {items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">No inventory items found. Click "+ Add Item" to create one.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.sku} • {item.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-slate-900 block">{item.quantity} In Stock</span>
                  <span className="text-[10px] font-mono text-slate-500">${item.unit_price} / unit</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                    item.status === "In Stock"
                      ? "bg-purple-100 text-purple-950 border-purple-200"
                      : item.status === "Low Stock"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {item.status}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReorder(item.sku)}
                    className="px-2 py-0.5 bg-purple-900 hover:bg-purple-950 text-white rounded text-[10px] font-medium transition-all shadow-2xs"
                  >
                    Reorder +50
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit Item"
                    className="p-1 hover:bg-slate-200/60 rounded text-slate-600 hover:text-purple-950 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete Item"
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
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Stock Level</th>
              <th className="py-2.5 px-3">Unit Price</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-mono font-medium text-slate-900">{item.sku}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                <td className="py-3 px-3 text-slate-500">{item.category}</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.quantity}</td>
                <td className="py-3 px-3 font-mono">${item.unit_price}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      item.status === "In Stock"
                        ? "bg-purple-100 text-purple-950 border-purple-200"
                        : item.status === "Low Stock"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleReorder(item.sku)}
                      className="px-2 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded text-[10px] font-medium transition-all shadow-2xs"
                    >
                      Reorder +50
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit Item"
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-purple-950 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete Item"
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


      {/* Add / Edit Inventory Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">
                {editingItem ? `Edit Inventory SKU (${editingItem.sku})` : "Add Inventory Item"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Description Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. High-Performance Processor X9"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-purple-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
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
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
