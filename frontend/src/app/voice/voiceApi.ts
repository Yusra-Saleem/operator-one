/**
 * Enterprise Voice API Helper
 */

import { API_BASE_URL, getAuthHeaders } from "../../lib/api";
import { supabase } from "../../lib/supabaseClient";

export interface VoiceStartResponse {
  session_id: string;
}

export interface VoiceResponse {
  text: string;
  done: boolean;
  audio_base64?: string;
  audio_encoding?: 'int16' | 'float32';
  audio_sample_rate?: number;
}

/**
 * Starts a new voice session on the backend. Returns the generated session ID.
 */
export async function startVoiceSession(): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/voice/start`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Voice service offline');
    const data: VoiceStartResponse = await res.json();
    return data.session_id;
  } catch (err) {
    return `demo-session-${Date.now()}`;
  }
}

/**
 * Sends a binary audio chunk to the backend.
 */
export async function sendAudioChunk(sessionId: string, blob: Blob, sampleRate: number): Promise<void> {
  try {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('audio', blob, 'voice.pcm');
    form.append('sample_rate', String(sampleRate));
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/api/v1/voice/chunk/${sessionId}`, {
      method: 'POST',
      headers,
      body: form,
    });
  } catch (err) {
    console.warn('Audio chunk upload offline fallback', err);
  }
}

/**
 * Opens a Server-Sent Events stream for the AI response.
 * `onChunk` is called for each incoming text fragment.
 */
export function streamResponse(
  sessionId: string,
  onChunk: (text: string, done: boolean, audioBase64?: string, encoding?: 'int16' | 'float32', sampleRate?: number) => void,
  onError: (err: unknown) => void,
  textQuery?: string
): { close: () => void } {
  const controller = new AbortController();
  
  void (async () => {
    try {
      const headers = await getAuthHeaders();
      const url = new URL(`${API_BASE_URL}/api/v1/voice/stream/${sessionId}`);
      if (textQuery && textQuery.trim()) {
        url.searchParams.set("text", textQuery.trim());
      }
      const res = await fetch(url.toString(), {
        headers,
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Voice stream failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
          const line = event.split('\n').find((entry) => entry.startsWith('data: '));
          if (!line) continue;
          const data: VoiceResponse = JSON.parse(line.slice(6));
          onChunk(data.text, data.done, data.audio_base64, data.audio_encoding, data.audio_sample_rate);
          if (data.done) return;
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        onError(err);
      }
    }
  })();
  return { close: () => controller.abort() };
}
