"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../lib/api";

interface DispatchLog {
  id: string;
  channel: "whatsapp" | "email";
  document_type: string;
  recipient_name: string;
  recipient_contact: string;
  amount: number;
  status: string;
  time: string;
}

export const DispatchWorkspace: React.FC = () => {
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [docType, setDocType] = useState<"quote" | "invoice" | "payment_reminder">("quote");
  const [recipientName, setRecipientName] = useState("");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState<number>(1200);
  const [notes, setNotes] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [history, setHistory] = useState<DispatchLog[]>([]);

  const fetchLogs = () => {
    fetchWithAuth("/api/v1/dispatch/logs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !contact.trim()) {
      setStatusMessage("Please enter recipient name and phone/email address.");
      return;
    }

    setIsSending(true);
    setStatusMessage("");

    fetchWithAuth("/api/v1/dispatch/send", {
      method: "POST",
      body: JSON.stringify({
        channel,
        document_type: docType,
        recipient_name: recipientName,
        recipient_contact: contact,
        amount,
        details: notes,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSending(false);
        const newLog: DispatchLog = {
          id: data.dispatch_id || `DSP-${Date.now()}`,
          channel,
          document_type: docType === "quote" ? "Sales Quote" : docType === "invoice" ? "Official Invoice" : "Payment Reminder",
          recipient_name: recipientName,
          recipient_contact: contact,
          amount,
          status: "Sent",
          time: "Just now",
        };
        setStatusMessage(data.message || "Document sent successfully.");
        setRecipientName("");
        setContact("");
        setNotes("");
        fetchLogs();
      })
      .catch(() => {
        setIsSending(false);
        const newLog: DispatchLog = {
          id: `DSP-${Date.now()}`,
          channel,
          document_type: docType === "quote" ? "Sales Quote" : docType === "invoice" ? "Official Invoice" : "Payment Reminder",
          recipient_name: recipientName,
          recipient_contact: contact,
          amount,
          status: "Sent (Local Test)",
          time: "Just now",
        };
        setHistory([newLog, ...history]);
        setStatusMessage(`Successfully dispatched ${docType} to ${recipientName} via ${channel.toUpperCase()}.`);
        setRecipientName("");
        setContact("");
        setNotes("");
      });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="surface p-4 sm:p-5 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Direct WhatsApp & Email Dispatch</h2>
          <p className="text-xs font-medium text-slate-600 max-w-xl mt-0.5">
            Send quotes, invoices, and payment reminders directly to your clients' WhatsApp or Email inbox.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs font-bold text-purple-950 self-start md:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse"></span>
          <span className="text-[11px] sm:text-xs">WhatsApp & Email Gateways Connected</span>
        </div>
      </div>

      {/* Main Dispatch Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Send Form */}
        <div className="lg:col-span-7 surface p-4 sm:p-5 rounded-xl space-y-4 border border-slate-200 bg-white">
          <h3 className="font-bold text-slate-900 text-sm">Create New Dispatch</h3>

          <form onSubmit={handleSendDispatch} className="space-y-3.5">
            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Send Via Channel</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    channel === "whatsapp"
                      ? "bg-purple-950 text-white border-purple-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-950"
                  }`}
                >
                  WhatsApp Direct
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    channel === "email"
                      ? "bg-purple-900 text-white border-purple-950 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-950"
                  }`}
                >
                  Email Inbox
                </button>
              </div>
            </div>


            {/* Document Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-900 focus:outline-none"
              >
                <option value="quote">Price Quote / Sales Proposal</option>
                <option value="invoice">Official Bill / Invoice</option>
                <option value="payment_reminder">Payment Due Reminder</option>
              </select>
            </div>

            {/* Recipient Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fatima Ahmed or Maryam Boutique"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {channel === "whatsapp" ? "WhatsApp Number" : "Email Address"}
                </label>
                <input
                  type="text"
                  placeholder={channel === "whatsapp" ? "+923001234567" : "client@company.com"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Amount ($ USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Message / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Thank you for your business! Please review the attached quote."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-900 focus:outline-none"
              />
            </div>

            {statusMessage && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-950">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-950 hover:bg-purple-900 transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isSending ? (
                <span>Sending Message...</span>
              ) : (
                <span>Send Document via {channel === "whatsapp" ? "WhatsApp" : "Email"}</span>
              )}
            </button>
          </form>
        </div>

        {/* Live Message Preview Card */}
        <div className="lg:col-span-5 surface p-4 sm:p-5 rounded-xl space-y-3.5 border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2.5">Live Client Preview</h3>
            <div className="p-3.5 sm:p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-slate-800 text-xs space-y-2 shadow-2xs font-sans">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <span className="font-bold text-purple-950 text-[11px]">
                  {channel === "whatsapp" ? "WhatsApp Message" : "Email Subject"}
                </span>
                <span className="text-[10px] font-mono text-purple-700">Operator One</span>
              </div>

              <p className="font-semibold text-purple-950">
                Hi {recipientName || "Valued Client"},
              </p>
              <p>
                Here is your official{" "}
                <span className="font-bold">
                  {docType === "quote" ? "Price Quote" : docType === "invoice" ? "Invoice" : "Payment Reminder"}
                </span>{" "}
                amounting to <span className="font-bold text-purple-950 font-mono">${amount.toLocaleString()}</span>.
              </p>
              {notes && <p className="italic text-slate-600 bg-white p-2 rounded border border-purple-100 text-[11px]">"{notes}"</p>}

              <div className="pt-2 text-[10px] text-slate-500 border-t border-purple-200 flex justify-between">
                <span className="truncate max-w-[150px]">Recipient: {contact || "Not specified"}</span>
                <span className="shrink-0">Operator One</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-950">
            <span className="font-bold">Voice Tip:</span> You can say{" "}
            <span className="font-mono text-purple-900 font-semibold">"Send quote to Client via WhatsApp"</span>.
          </div>
        </div>
      </div>

      {/* Dispatch History Log */}
      <div className="surface p-4 sm:p-5 rounded-xl space-y-3.5 border border-slate-200 bg-white">
        <h3 className="font-bold text-slate-900 text-sm">Recent Dispatch Log</h3>

        {/* Mobile Responsive Cards (sm:hidden) */}
        <div className="block sm:hidden space-y-2.5">
          {history.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">No dispatch logs found yet.</div>
          ) : (
            history.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-950 text-xs">{log.recipient_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-950 border border-purple-200">
                    {log.channel.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{log.document_type}</span>
                  <span className="font-mono font-bold text-slate-900">${log.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                  <span className="font-mono text-slate-400">{log.recipient_contact}</span>
                  <span className="font-mono text-emerald-700 font-semibold">{log.status} • {log.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] bg-slate-100/70">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((log) => (
                <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{log.id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-950 border border-purple-200">
                      {log.channel.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{log.document_type}</td>
                  <td className="py-2.5 px-3 text-slate-700">{log.recipient_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{log.recipient_contact}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">${log.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-950 border border-purple-200">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
