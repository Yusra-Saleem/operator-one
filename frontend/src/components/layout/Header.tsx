"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onOpenVoiceModal?: () => void;
  onOpenAuthModal?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoiceModal, onOpenAuthModal, onToggleMobileSidebar }) => {
  const { user, signOut } = useAuth();
  const [selectedBranch, setSelectedBranch] = React.useState("Dubai Main Boutique");
  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-2.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Brand & Workspace Context */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1 sm:p-1.5 rounded-lg text-slate-700 hover:bg-purple-50 hover:text-purple-950 transition-colors border border-slate-200 active:scale-95 shrink-0"
          title="Open Navigation Menu"
        >
          <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-950 text-white font-display font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs tracking-tight shrink-0">
            O<span className="text-purple-300">1</span>
          </div>
          <div className="hidden min-[340px]:block">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-bold text-xs sm:text-sm text-slate-900 tracking-tight whitespace-nowrap">
                OPERATOR ONE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 text-purple-950 border border-purple-200 hidden sm:inline-block">
                v1.0 Enterprise
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Voice Quick Trigger */}
      <button
        onClick={onOpenVoiceModal}
        className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current stroke-2 shrink-0" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 10-6 0v8.25a3 3 0 003 3z" />
        </svg>
        <span className="hidden sm:inline">Speak to Operator</span>
        <span className="sm:hidden text-[11px]">Speak</span>
      </button>

      {/* User Profile Badge (Click Avatar to Sign Out) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-xs text-slate-900 leading-tight">{user.name}</p>
              <p className="text-slate-500 text-[11px] leading-tight">{user.role}</p>
            </div>
            <button
              onClick={signOut}
              title="Click to Sign Out"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 border border-purple-200 text-purple-950 font-bold text-xs flex items-center justify-center hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

