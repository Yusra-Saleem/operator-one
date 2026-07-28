"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  sessionId: string;
  onAudioChunk: (blob: Blob, sampleRate: number, transcribedText?: string) => void;
}

const VoiceRecorder: React.FC<Props> = ({ onAudioChunk }) => {
  const [recording, setRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        transcriptRef.current = currentText;
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    setPermissionError(null);
    setTranscript("");
    transcriptRef.current = "";
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const finalCapturedText = transcriptRef.current || transcript;
        onAudioChunk(audioBlob, 44100, finalCapturedText);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Recognition active", err);
        }
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setPermissionError("Microphone access denied. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {transcript && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-md text-[11px] font-mono text-purple-950 w-full text-center">
          <span className="font-bold text-slate-500 text-[9px] uppercase block mb-0.5">Live Speech:</span>
          "{transcript}"
        </div>
      )}

      {permissionError && (
        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[11px] w-full text-center">
          {permissionError}
        </div>
      )}

      <button
        type="button"
        onClick={toggleRecording}
        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer ${
          recording
            ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
            : "bg-purple-900 hover:bg-purple-950 text-white"
        }`}
      >
        <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 10-6 0v8.25a3 3 0 003 3z" />
        </svg>
        <span>{recording ? "Click to Stop & Dispatch Voice" : "Click to Start Voice Recording"}</span>
      </button>
    </div>
  );
};

export default VoiceRecorder;
