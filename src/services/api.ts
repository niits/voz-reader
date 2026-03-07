import type { Category, Thread, Post, Pagination } from "../types";

const API_BASE = "/api";

// ── Cookie management (localStorage) ──

const COOKIE_KEY = "voz_cookies";

export function getStoredCookies(): string {
  return localStorage.getItem(COOKIE_KEY) || "";
}

export function saveCookies(cookies: string): void {
  localStorage.setItem(COOKIE_KEY, cookies.trim());
}

export function clearCookies(): void {
  localStorage.removeItem(COOKIE_KEY);
}

export function getCookieStatus(): { hasCookies: boolean; preview: string } {
  const cookies = getStoredCookies();
  return {
    hasCookies: !!cookies,
    preview: cookies ? cookies.substring(0, 40) + "..." : "",
  };
}

// ── HTTP helpers ──

interface ApiError extends Error {
  code?: string;
  status?: number;
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {};
  const cookies = getStoredCookies();
  if (cookies) {
    headers["X-Voz-Cookies"] = cookies;
  }

  const res = await fetch(url.toString(), { headers });
  const data = await res.json();

  if (!res.ok) {
    const error: ApiError = new Error(data.error || `HTTP ${res.status}`);
    error.code = data.code;
    error.status = res.status;
    throw error;
  }

  return data as T;
}

// ── Forum data ──

export async function fetchForums(): Promise<{ categories: Category[] }> {
  return apiFetch(`${API_BASE}/forums`);
}

export async function fetchBox(
  id: string,
  page = 1
): Promise<{ title: string; threads: Thread[]; pagination: Pagination }> {
  return apiFetch(`${API_BASE}/box/${id}`, { page: String(page) });
}

export async function fetchThread(
  id: string,
  page = 1
): Promise<{ title: string; posts: Post[]; pagination: Pagination }> {
  return apiFetch(`${API_BASE}/thread/${id}`, { page: String(page) });
}
