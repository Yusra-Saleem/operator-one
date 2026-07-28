import { supabase } from "./supabaseClient";

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
        return headers;
      }
    } catch {
      // Fallback to dev token if session lookup fails
    }
  }

  // Fallback dev header for seamless local testing
  headers["Authorization"] = "Bearer dev-token";
  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  return fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });
}
