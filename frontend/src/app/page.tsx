"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { ExecutiveOverview } from "../components/dashboard/ExecutiveOverview";
import { SalesPipelineWidget } from "../components/dashboard/SalesPipelineWidget";
import { InventoryStatusWidget } from "../components/dashboard/InventoryStatusWidget";
import { AgentActivitiesWidget } from "../components/dashboard/AgentActivitiesWidget";
import { VoiceCommandBar } from "../components/dashboard/VoiceCommandBar";
import { BusinessAnalyticsView } from "../components/analytics/BusinessAnalyticsView";
import { WorkflowMonitoringView } from "../components/workflows/WorkflowMonitoringView";
import { IntegrationsWorkspace } from "../components/integrations/IntegrationsWorkspace";
import { DecisionEngineView } from "../components/decision/DecisionEngineView";
import { DispatchWorkspace } from "../components/dispatch/DispatchWorkspace";
import { AuthModal } from "../components/auth/AuthModal";
import VoiceChat from "./voice/VoiceChat";
import { fetchWithAuth } from "../lib/api";

interface AgentOutput {
  agent?: string;
  response?: unknown;
  output?: unknown;
  intent?: { intent?: string; confidence?: number };
}

function MainApp() {
  const { user, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [agentOutput, setAgentOutput] = useState<AgentOutput | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);


  // Auth Form State for Landing Portal
  const [portalIsSignUp, setPortalIsSignUp] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalName, setPortalName] = useState("");
  const [portalRole, setPortalRole] = useState("Chief Executive Officer");
  const [portalError, setPortalError] = useState("");

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError("");
    if (!portalEmail.trim() || !portalPassword.trim()) {
      setPortalError("Please enter both email and password.");
      return;
    }
    if (portalIsSignUp) {
      if (!portalName.trim()) {
        setPortalError("Please enter your full name.");
        return;
      }
      signUp(portalEmail.trim(), portalName.trim(), portalRole, portalPassword.trim());
    } else {
      signIn(portalEmail.trim(), portalPassword.trim());
    }
  };

  const handleDemoSignIn = () => {
    signIn("yusra.saleem@operatorone.ai", "demo123456");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafbfd] flex flex-col items-center justify-center p-4 text-slate-900 font-sans relative">
        {/* Bespoke Executive Card */}
        <div className="w-full max-w-[360px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-900/5 space-y-5">
          {/* Brand Mark & Title */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-950 text-white font-display font-bold text-sm flex items-center justify-center shadow-xs">
              O<span className="text-purple-300">1</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-slate-900 tracking-tight leading-none">Operator One</h1>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Enterprise Assistant Console</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 bg-slate-100/70 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => { setPortalIsSignUp(false); setPortalError(""); }}
              className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                !portalIsSignUp
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setPortalIsSignUp(true); setPortalError(""); }}
              className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                portalIsSignUp
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create account
            </button>
          </div>

          {portalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {portalError}
            </div>
          )}

          {/* Clean Form */}
          <form onSubmit={handlePortalSubmit} className="space-y-3 text-xs">
            {portalIsSignUp && (
              <>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Full name</label>
                  <input
                    type="text"
                    required
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                    placeholder="Yusra Saleem"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-900 focus:ring-1 focus:ring-purple-900/20 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Role</label>
                  <select
                    value={portalRole}
                    onChange={(e) => setPortalRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-900 font-sans cursor-pointer"
                  >
                    <option value="Chief Executive Officer">Chief Executive Officer</option>
                    <option value="Store Operations Manager">Store Operations Manager</option>
                    <option value="Sales Director">Sales Director</option>
                    <option value="Inventory Lead">Inventory Lead</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="yusra.saleem@operatorone.ai"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-900 focus:ring-1 focus:ring-purple-900/20 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-900 focus:ring-1 focus:ring-purple-900/20 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-950 hover:bg-slate-900 text-white font-medium text-xs rounded-lg shadow-2xs transition-all cursor-pointer active:scale-[0.98] mt-1"
            >
              {portalIsSignUp ? "Continue" : "Sign in"}
            </button>
          </form>

          {/* Quick CEO Sign In */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/70 rounded-lg font-medium transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <span>Quick Sign In (Yusra Saleem - CEO)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExecuteVoiceCommand = (query: string) => {
    setIsExecuting(true);
    fetchWithAuth("/agent/execute", {
      method: "POST",
      body: JSON.stringify({ user_input: query })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status} ${res.statusText}` }));
          throw new Error(errData.detail || `Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then((resData) => {
        setAgentOutput(resData);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("inventoryUpdated"));
          window.dispatchEvent(new CustomEvent("dataUpdated"));
        }
      })
      .catch((error) => {
        setAgentOutput({
          agent: "Operator One System Error",
          response: `Failed to communicate with Agent execution API for "${query}". Error: ${error instanceof Error ? error.message : "Network/Connection error"}`,
        });
      })
      .finally(() => {
        setIsExecuting(false);
      });
  };

  const outputValue = agentOutput?.output ?? agentOutput?.response;

  const mobileTabs = [
    { id: "overview", label: "Overview" },
    { id: "decision", label: "AI Decisions" },
    { id: "sales", label: "Sales" },
    { id: "inventory", label: "Inventory" },
    { id: "integrations", label: "Integrations" },
    { id: "workflows", label: "Workflows" },
    { id: "analytics", label: "Analytics" },
    { id: "agents", label: "Agents" },
  ];

  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return (
      <div className="space-y-1.5 font-sans text-xs text-slate-800 leading-relaxed">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-1" />;

          // Header Check (# or ##)
          const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
          let currentText = trimmed;
          let isHeader = false;
          if (headerMatch) {
            isHeader = true;
            currentText = headerMatch[2];
          }

          // Bullet Check (- or * or 1.)
          const bulletMatch = currentText.match(/^([-*]|\d+\.)\s+(.*)$/);
          let isBullet = false;
          let bulletNumber = "";
          if (bulletMatch) {
            isBullet = true;
            bulletNumber = bulletMatch[1];
            currentText = bulletMatch[2];
          }

          // Parse inline bold (**bold**), italic (*italic*), and inline code (`code`)
          const parts: React.ReactNode[] = [];
          const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = regex.exec(currentText)) !== null) {
            if (match.index > lastIndex) {
              parts.push(currentText.substring(lastIndex, match.index));
            }
            const token = match[0];
            if (token.startsWith("**") && token.endsWith("**")) {
              parts.push(
                <strong key={match.index} className="font-bold text-purple-950">
                  {token.slice(2, -2)}
                </strong>
              );
            } else if (token.startsWith("*") && token.endsWith("*")) {
              parts.push(
                <em key={match.index} className="italic text-slate-700">
                  {token.slice(1, -1)}
                </em>
              );
            } else if (token.startsWith("`") && token.endsWith("`")) {
              parts.push(
                <code key={match.index} className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono text-[11px]">
                  {token.slice(1, -1)}
                </code>
              );
            }
            lastIndex = regex.lastIndex;
          }

          if (lastIndex < currentText.length) {
            parts.push(currentText.substring(lastIndex));
          }

          if (isHeader) {
            return (
              <h4 key={lineIdx} className="font-display font-bold text-sm text-purple-950 mt-2 border-b border-purple-100 pb-1">
                {parts}
              </h4>
            );
          }

          if (isBullet) {
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-2">
                {bulletNumber.match(/\d+\./) ? (
                  <span className="font-bold text-purple-900 text-[11px] shrink-0 min-w-4">{bulletNumber}</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-900 mt-1.5 shrink-0" />
                )}
                <span className="flex-1">{parts}</span>
              </div>
            );
          }

          return <div key={lineIdx}>{parts}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fafbfd] text-slate-900">
      {/* Enterprise Header */}
      <Header
        onOpenVoiceModal={() => setShowVoiceModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      <div className="flex flex-1">
        {/* Enterprise Collapsible & Mobile Slide-Over Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />


        {/* Main Application Canvas */}
        <main className="flex-1 min-w-0 px-3 py-3.5 pb-16 md:pb-4 sm:px-5 lg:px-6 space-y-3.5 max-w-7xl mx-auto w-full">


          {/* Voice Command Console */}
          <VoiceCommandBar onExecuteQuery={handleExecuteVoiceCommand} isExecuting={isExecuting} />

          {/* Real-time Agent Execution Processing Loading Indicator */}
          {isExecuting && (
            <div className="p-3 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/60 border border-amber-200 shadow-2xs flex items-center justify-between transition-all animate-pulse">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-display">Agent Execution Engine Working...</div>
                  <div className="text-[11px] text-amber-800 font-sans">Analyzing input, querying database, and preparing sub-second response...</div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Agent Execution Result Banner */}
          {agentOutput && !isExecuting && (
            <div className="p-2.5 px-3.5 rounded-lg space-y-1.5 border-l-4 border-l-purple-900 bg-white border border-slate-200 shadow-2xs transition-all max-w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-950">
                    Agent Execution Response [{agentOutput.agent || agentOutput.intent?.intent || "Operator One"}]
                  </span>
                </div>
                <button
                  onClick={() => setAgentOutput(null)}
                  className="text-slate-400 hover:text-purple-950 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-purple-50 transition-colors"
                >
                  ✕
                </button>
              </div>
              {typeof outputValue === "object" ? (
                <pre className="bg-purple-50/70 text-purple-950 p-2 px-2.5 rounded-md font-mono overflow-x-auto text-[10px] leading-snug whitespace-pre-wrap border border-purple-200/80 font-medium max-h-40 overflow-y-auto scrollbar-thin">
                  {JSON.stringify(outputValue, null, 2)}
                </pre>
              ) : (
                <div className="bg-purple-50/70 text-purple-950 p-2.5 px-3 rounded-md border border-purple-200/80 max-h-40 overflow-y-auto scrollbar-thin">
                  {renderFormattedText(String(outputValue ?? ""))}
                </div>
              )}
            </div>
          )}

          {/* Clean Tab View Routing */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <ExecutiveOverview />
            </div>
          )}

          {activeTab === "decision" && (
            <div className="space-y-4">
              <DecisionEngineView />
            </div>
          )}

          {activeTab === "sales" && (
            <div className="space-y-4">
              <SalesPipelineWidget />
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-4">
              <InventoryStatusWidget />
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-4">
              <IntegrationsWorkspace />
            </div>
          )}

          {activeTab === "dispatch" && (
            <div className="space-y-4">
              <DispatchWorkspace />
            </div>
          )}

          {activeTab === "workflows" && (
            <div className="space-y-4">
              <WorkflowMonitoringView />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-4">
              <BusinessAnalyticsView />
            </div>
          )}

          {activeTab === "agents" && (
            <div className="space-y-4">
              <AgentActivitiesWidget />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden flex justify-around items-center px-1 py-1.5 shadow-lg">
        {[
          {
            id: "overview",
            label: "Summary",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            ),
          },
          {
            id: "sales",
            label: "Sales",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
              </svg>
            ),
          },
          {
            id: "inventory",
            label: "Stock",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            ),
          },
          {
            id: "decision",
            label: "AI Advice",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            ),
          },
          {
            id: "analytics",
            label: "Reports",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            ),
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
              activeTab === item.id
                ? "text-purple-950 font-bold scale-[1.05]"
                : "text-slate-500 font-medium hover:text-slate-800"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-mono leading-none">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Voice Interaction Modal HUD */}

      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="surface bg-white rounded-2xl p-5 w-full max-w-2xl space-y-3 text-slate-900 shadow-2xl relative border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-900 animate-ping" />
                <div>
                  <p className="eyebrow text-purple-900 text-[10px]">Operator One Voice Control</p>
                  <h3 className="font-display font-bold text-base text-slate-900">Voice & Text Assistant Console</h3>
                </div>
              </div>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                Close ✕
              </button>
            </div>
            <VoiceChat />
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
