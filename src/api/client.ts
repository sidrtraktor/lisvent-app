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

export async function fetchSession(sessionId: string): Promise<SessionData> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Ошибка загрузки сессии: ${res.status}`);
  }
  return res.json();
}

export async function approveSession(
  sessionId: string,
  items: MatchResult[],
  initData: string,
): Promise<{ status: string; session_id: string; items_count: number }> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, init_data: initData }),
  });
  if (!res.ok) {
    throw new Error(`Ошибка утверждения: ${res.status}`);
  }
  return res.json();
}

export async function searchStandardDb(query: string): Promise<StandardItem[]> {
  const res = await fetch(
    `${API_BASE}/api/standard-db/search?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) {
    throw new Error(`Ошибка поиска: ${res.status}`);
  }
  return res.json();
}
