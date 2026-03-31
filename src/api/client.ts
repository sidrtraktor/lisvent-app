/**
 * HTTP-клиент для обращения к FastAPI бэкенду.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface MatchResult {
  id: number;
  original_name: string;
  original_quantity: number;
  original_unit: string;
  matched_name: string | null;
  matched_unit: string;
  converted_quantity: number | null;
  status: 'green' | 'yellow' | 'red';
  confidence: number;
  approved_name: string | null;
  approved_quantity: number | null;
}

export interface SessionData {
  session_id: string;
  client_id: string;
  client_name: string;
  items: MatchResult[];
  created_at: string;
  approved: boolean;
}

export interface StandardItem {
  id: number;
  name: string;
  unit: string;
}

/**
 * Общая обертка fetch с заголовками (ngrok-skip-browser-warning).
 */
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res;
}

export async function fetchSession(sessionId: string): Promise<SessionData> {
  const res = await apiFetch(`/api/session/${sessionId}`);
  return res.json();
}

export async function approveSession(
  sessionId: string,
  items: MatchResult[],
  initData: string,
): Promise<{ status: string; session_id: string; items_count: number }> {
  const res = await apiFetch(`/api/session/${sessionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ items, init_data: initData }),
  });
  return res.json();
}

export async function searchStandardDb(query: string): Promise<StandardItem[]> {
  const res = await apiFetch(
    `/api/standard-db/search?q=${encodeURIComponent(query)}`,
  );
  return res.json();
}

export async function createDemoSession(): Promise<{ session_id: string }> {
  const res = await apiFetch('/api/demo');
  return res.json();
}
