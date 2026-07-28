"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { user, signOut, isAuthenticated } = useAuth();

  const navGroups: NavGroup[] = [
    {
      title: "Main Dashboard",
      items: [
        {
          id: "overview",
          label: "Business Summary",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
        },
        {
          id: "decision",
          label: "Smart AI Advice",
          badge: "Live",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Business Sections",
      items: [
        {
          id: "sales",
          label: "Sales & Deals",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
            </svg>
          ),
        },
        {
          id: "inventory",
          label: "Stock & Reorders",
          badge: "1 Alert",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          ),
        },
        {
          id: "analytics",
          label: "Revenue Reports",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Tools & Messaging",
      items: [
        {
          id: "dispatch",
          label: "Send WhatsApp & Email",
          badge: "New",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          ),
        },
        {
          id: "integrations",
          label: "Connected Apps",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          ),
        },
        {
          id: "workflows",
          label: "Automated Tasks",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.24a6 6 0 00-5.84-7.38v4.8m5.84 2.58a14.98 14.98 0 00-6.16 12.12A14.98 14.98 0 0014.37 15.59" />
            </svg>
          ),
        },
        {
          id: "agents",
          label: "AI Assistants",
          badge: "Active",
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21m7.5-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative border-r border-slate-200 bg-white flex flex-col justify-between h-[calc(100vh-64px)] sticky top-16 hidden md:flex shrink-0 select-none transition-all duration-300 ease-in-out will-change-[width,padding] overflow-visible ${
        isCollapsed ? "w-16 p-2" : "w-64 p-4"
      }`}
    >
      {/* Integrated Rectangular Dark Edge Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-10 bg-purple-950 hover:bg-purple-900 text-purple-200 hover:text-white rounded-r-md flex items-center justify-center cursor-pointer shadow-xs z-30 transition-colors duration-200 border border-l-0 border-purple-900/60"
      >
        <svg
          className={`w-3 h-3 transform transition-transform duration-300 ease-in-out ${
            isCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="space-y-5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p
              className={`px-3 mb-2 text-[10px] font-extrabold tracking-wider uppercase text-slate-600 font-mono whitespace-nowrap overflow-hidden transition-all duration-200 ${
                isCollapsed ? "opacity-0 h-0 mb-0 pointer-events-none" : "opacity-100 h-auto"
              }`}
            >
              {group.title}
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-lg text-xs transition-all duration-200 ${
                      isCollapsed
                        ? "w-10 h-10 justify-center mx-auto my-0.5"
                        : "w-full justify-between px-3 py-2"
                    } ${
                      active
                        ? "bg-purple-950 text-white font-bold shadow-xs"
                        : "text-slate-700 font-semibold hover:bg-purple-50 hover:text-purple-950"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                      <span className={`shrink-0 ${active ? "text-purple-300" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="whitespace-nowrap overflow-hidden truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          active
                            ? "bg-purple-800 text-purple-100"
                            : "bg-purple-100 text-purple-950 border border-purple-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Bottom Footer: Sign Out Action Button */}
      <div className="pt-3 border-t border-slate-200 overflow-hidden">
        {isAuthenticated && user ? (
          <button
            onClick={signOut}
            title={isCollapsed ? `Sign Out (${user.name})` : "Sign Out Account"}
            className={`w-full flex items-center rounded-lg text-xs font-medium transition-all duration-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent ${
              isCollapsed
                ? "w-10 h-10 justify-center mx-auto"
                : "justify-between px-3 py-2 bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <svg className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
              </svg>
              {!isCollapsed && (
                <div className="text-left overflow-hidden min-w-0">
                  <p className="font-semibold text-slate-800 text-[11px] truncate leading-tight">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">Sign Out</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                Exit
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => window.location.reload()}
            title="Sign In"
            className="w-full flex items-center justify-center p-2 text-xs font-semibold text-purple-950 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
};
