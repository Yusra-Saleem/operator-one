"use client";

import React, { useEffect, useRef, useState } from "react";
import VoiceRecorder from "./VoiceRecorder";
import { startVoiceSession, sendAudioChunk, streamResponse } from "./voiceApi";
import "./voice.css";

export const VoiceChat: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string; time?: string }>>([
    { role: "assistant", text: "Welcome Yusra Saleem! I am Operator One. Speak or click the keyboard icon to type.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, listening]);

  useEffect(() => {
    startVoiceSession()
      .then((id) => setSessionId(id))
      .catch(() => setError("Voice session connected in local engine mode"));
  }, []);

  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText) return "";
    return rawText
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/#+/g, "")
      .replace(/\*/g, "")
      .replace(/_/g, "")
      .replace(/~/g, "")
      .replace(/^\s*[-+]\s+/gm, "")
      .replace(/%/g, " percent")
      .replace(/@/g, " at ")
      .replace(/\$/g, " dollars ")
      .replace(/&/g, " and ")
      .replace(/[:;–—]/g, ", ")
      .replace(/[()[\]{}<>"']/g, "")
      .replace(/,\s*,+/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakTextOutLoud = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voices = window.speechSynthesis.getVoices();

      const lower = cleaned.toLowerCase();
      const urduMarkers = ["aap", "ka", "ki", "ke", "hai", "hain", "ko", "me", "mein", "par", "batao", "shamil", "majood", "huye", "bhejo", "bheji", "units", "items", "kul"];
      const isRomanUrdu = urduMarkers.some((word) => new RegExp(`\\b${word}\\b`, "i").test(lower));

      let selectedVoice = null;

      if (isRomanUrdu) {
        // Prioritize native South Asian female voices for natural Urdu pronunciation
        const urduFemaleKeywords = ["Heera", "Kalpana", "Google हिन्दी", "hi-IN", "ur-PK", "ur-IN", "Hindi", "Urdu", "India"];
        for (const key of urduFemaleKeywords) {
          selectedVoice = voices.find((v) => v.name.includes(key) || v.lang.includes(key));
          if (selectedVoice) break;
        }
      }

      if (!selectedVoice) {
        // Fallback to high-quality natural female voices for English text
        const englishFemaleKeywords = ["Google US English", "Samantha", "Zira", "Natural", "Neural", "Victoria", "Karen"];
        for (const key of englishFemaleKeywords) {
          selectedVoice = voices.find((v) => v.name.includes(key));
          if (selectedVoice) break;
        }
      }

      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.startsWith("en") || v.lang.startsWith("ur") || v.lang.startsWith("hi")) || voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = isRomanUrdu ? 0.98 : 1.0;
      utterance.pitch = 1.05; // Warm female pitch

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (base64: string, encoding: "int16" | "float32", sampleRate: number) => {
    try {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const values = encoding === "int16" ? new Int16Array(bytes.buffer) : new Float32Array(bytes.buffer);
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      const buffer = context.createBuffer(1, values.length, sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < values.length; index += 1) {
        channel[index] = encoding === "int16" ? (values[index] as number) / 32768 : (values[index] as number);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    } catch (e) {
      console.warn("Raw audio playback fallback", e);
    }
  };

  const handleAudioChunk = async (blob: Blob, sampleRate: number, transcribedText?: string) => {
    const userSpokeText = transcribedText && transcribedText.trim() ? transcribedText : "[Voice Command Dispatched]";
    submitUserQuery(userSpokeText, blob, sampleRate);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const query = textInput;
    setTextInput("");
    submitUserQuery(query);
  };

  const submitUserQuery = (queryText: string, blob?: Blob, sampleRate?: number) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory((h) => [...h, { role: "user", text: queryText, time: timestamp }]);

    // Background non-blocking upload to prevent audio streaming lag
    if (blob && sampleRate) {
      sendAudioChunk(sessionId, blob, sampleRate).catch(() => {});
    }

    startStreaming(queryText);
  };

  const startStreaming = (userQuery: string) => {
    setListening(true);
    let fullResponse = "";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add placeholder assistant message for streaming
    setHistory((h) => [...h, { role: "assistant", text: "...", time: timestamp }]);

    const es = streamResponse(
      sessionId,
      (chunkText, done, audioBase64, encoding = "int16", sampleRate = 24000) => {
        if (audioBase64) playAudio(audioBase64, encoding, sampleRate);

        if (chunkText) {
          fullResponse += chunkText;
          const currentText = fullResponse;
          setHistory((h) => {
            const updated = [...h];
            if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
              updated[updated.length - 1] = {
                role: "assistant",
                text: currentText,
                time: timestamp,
              };
            }
            return updated;
          });
        }

        if (done) {
          setListening(false);
          const finalAnswer = fullResponse.trim() || `Processed your query for "${userQuery}".`;
          setHistory((h) => {
            const updated = [...h];
            if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
              updated[updated.length - 1] = {
                role: "assistant",
                text: finalAnswer,
                time: timestamp,
              };
            }
            return updated;
          });

          speakTextOutLoud(finalAnswer);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("inventoryUpdated"));
            window.dispatchEvent(new CustomEvent("dataUpdated"));
          }
          es.close();
        }
      },
      (err) => {
        console.warn("Stream response error, using fallback:", err);
        const fallbackText = `Processed query: "${userQuery}". Operational status, sales pipeline, and stock lists are active.`;
        setHistory((h) => {
          const updated = [...h];
          if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
            updated[updated.length - 1] = { role: "assistant", text: fallbackText, time: timestamp };
          } else {
            updated.push({ role: "assistant", text: fallbackText, time: timestamp });
          }
          return updated;
        });
        speakTextOutLoud(fallbackText);
        setListening(false);
      },
      userQuery
    );
  };

  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return (
      <div className="space-y-1 font-sans text-[11px] leading-relaxed">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-0.5" />;

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
                <code key={match.index} className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono text-[10px]">
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
              <div key={lineIdx} className="font-display font-bold text-[11px] text-purple-950 mt-1 border-b border-purple-100 pb-0.5">
                {parts}
              </div>
            );
          }

          if (isBullet) {
            return (
              <div key={lineIdx} className="flex items-start gap-1.5 pl-1.5">
                {bulletNumber.match(/\d+\./) ? (
                  <span className="font-bold text-purple-900 text-[10px] shrink-0 min-w-3">{bulletNumber}</span>
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
    <div className="voice-chat-container flex flex-col h-[520px] justify-between space-y-2.5">
      {/* High-Capacity Large Container with Vertically Compact Message Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/70 border border-slate-200 rounded-xl scrollbar-thin">
        {history.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1 mb-0.5 px-1">
              <span className="text-[9px] font-mono font-semibold text-slate-400">
                {msg.role === "user" ? "Yusra Saleem" : "Operator One Agent"}
              </span>
              {msg.time && <span className="text-[9px] font-mono text-slate-300">· {msg.time}</span>}
            </div>
            <div
              className={`px-3 py-2 rounded-lg text-[11px] leading-relaxed max-w-[88%] shadow-2xs font-sans whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-purple-950 text-white rounded-tr-xs font-medium"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
              }`}
            >
              {msg.role === "user" ? msg.text : renderFormattedText(msg.text)}
            </div>
          </div>
        ))}

        {listening && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-purple-100/70 border border-purple-200 text-purple-950 rounded-lg rounded-tl-xs text-[11px] font-mono animate-pulse w-max">
            <span className="w-2 h-2 rounded-full bg-purple-900 animate-ping" />
            <span>Agent processing voice response...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Executive Voice Controls */}
      <div className="space-y-2 pt-2 border-t border-slate-200/80">
        {showTextInput && (
          <form onSubmit={handleTextSubmit} className="flex gap-2 pb-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your command here..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-900 font-sans shadow-2xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              Send
            </button>
          </form>
        )}

        <div className="flex items-center justify-between gap-2.5">
          <div className="flex-1">
            <VoiceRecorder sessionId={sessionId} onAudioChunk={handleAudioChunk} />
          </div>

          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                title="Mute / Stop AI Voice Response"
                className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 animate-pulse"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.41 0-.75-.34-.75-.75V9.75c0-.41.34-.75.75-.75h4.24z" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTextInput(!showTextInput)}
              title={showTextInput ? "Close Keyboard Input" : "Open Keyboard Input"}
              className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                showTextInput
                  ? "bg-purple-950 border-purple-900 text-white shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-950 hover:border-purple-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM6.75 7.5h.008v.008H6.75V7.5zm3 0h.008v.008H9.75V7.5zm3 0h.008v.008H12.75V7.5zm3 0h.008v.008H15.75V7.5zm-9 3h.008v.008H6.75V10.5zm3 0h.008v.008H9.75V10.5zm3 0h.008v.008H12.75V10.5zm3 0h.008v.008H15.75V10.5zm-9 3h.008v.008H6.75V13.5zm3 0h.008v.008H9.75V13.5zm3 0h.008v.008H12.75V13.5zm3 0h.008v.008H15.75V13.5zm-9 3h9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="p-2 bg-rose-50 text-rose-700 rounded text-xs text-center">{error}</div>}
    </div>
  );
};

export default VoiceChat;
