"use client";

import React, { useState, useRef, useEffect } from "react";

interface VoiceCommandBarProps {
  onExecuteQuery: (query: string) => void;
  isExecuting?: boolean;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({ onExecuteQuery, isExecuting = false }) => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const samplePrompts = [
    "Check stock for Abayas, Scarfs, and Hijab Caps",
    "Send WhatsApp receipt for Black Silk Abaya order",
    "Show total sales revenue for Niqabs and Scarfs",
    "Add 20 Velvet Abayas to inventory stock",
  ];

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setQuery(currentText);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Browser speech recognition is not supported in this browser. Please type your query.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setQuery("");
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition error", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isExecuting) return;
    onExecuteQuery(query);
  };

  return (
    <div className="surface p-3.5 sm:p-4 rounded-lg space-y-3 relative overflow-hidden bg-white shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isExecuting ? "bg-amber-500 animate-ping" : "bg-purple-900 animate-pulse"}`} />
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-900">
            {isExecuting ? "Agent Execution Engine Processing Command..." : "Autonomous Voice & Executive Command Console"}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${isExecuting ? "bg-amber-500 animate-pulse" : isListening ? "bg-rose-500 animate-ping" : "bg-purple-900"}`} />
          <span>{isExecuting ? "Agent Thinking..." : isListening ? "Listening to Voice..." : "Speech AI Active"}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            disabled={isExecuting}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isExecuting ? "Agent is processing your command... Please wait..." : isListening ? "Listening... Speak your command now..." : "Type or speak a business command (e.g. 'Show sales pipeline')..."}
            className={`w-full pl-3.5 pr-9 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-sans ${
              isExecuting
                ? "border-amber-400 bg-amber-50/20 text-slate-500"
                : isListening
                ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                : "border-slate-200 focus:border-purple-900 focus:ring-1 focus:ring-purple-900"
            }`}
          />
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isExecuting}
            title={isListening ? "Click to Stop Recording" : "Click to Speak"}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all ${
              isListening
                ? "text-rose-600 bg-rose-100 animate-pulse"
                : "text-slate-400 hover:text-purple-900 hover:bg-slate-100"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 10-6 0v8.25a3 3 0 003 3z" />
            </svg>
          </button>
        </div>
        <button
          type="submit"
          disabled={isExecuting}
          className={`px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
            isExecuting ? "opacity-75 cursor-not-allowed bg-purple-800" : ""
          }`}
        >
          {isExecuting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Executing...</span>
            </>
          ) : (
            <>
              <span>Execute</span>
              <svg className="w-3 h-3 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap text-[10px]">Quick actions:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(p);
              onExecuteQuery(p);
            }}
            className="px-2.5 py-1 bg-slate-50 hover:bg-purple-100 hover:text-purple-950 hover:border-purple-300 text-slate-700 rounded whitespace-nowrap transition-all border border-slate-200 font-medium text-[10px]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
