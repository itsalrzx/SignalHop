export type User = { id: string; name: string; email: string; createdAt: string };
export type ShortLink = {
  id: string;
  code: string;
  destination: string;
  title: string | null;
  enabled: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
  clicks?: number;
};
export type LinkPage = { items: ShortLink[]; total: number; page: number; limit: number };
type Session = { accessToken: string; user: User };
let accessToken: string | null = null;
let refreshing: Promise<Session> | null = null;
const listeners = new Set<(user: User | null) => void>();
export function subscribeSession(listener: (user: User | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setSession(session: Session | null) {
  accessToken = session?.accessToken || null;
  for (const listener of listeners) listener(session?.user || null);
}
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function failure(response: Response) {
  const data = await response.json().catch(() => ({ message: 'Request failed' }));
  return new ApiError(
    Array.isArray(data.message) ? data.message.join('. ') : data.message || 'Request failed',
    response.status,
  );
}
export function refreshSession() {
  if (!refreshing)
    refreshing = (async () => {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-SignalHop-Client': 'web' },
      });
      if (!response.ok) {
        setSession(null);
        throw await failure(response);
      }
      const session: Session = await response.json();
      setSession(session);
      return session;
    })().finally(() => {
      refreshing = null;
    });
  return refreshing;
}
async function responseFor(path: string, init: RequestInit = {}) {
  const run = () =>
    fetch('/api/v1' + path, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-SignalHop-Client': 'web',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        ...init.headers,
      },
    });
  let response: Response;
  try {
    response = await run();
    if (response.status === 401 && !path.startsWith('/auth/')) {
      await refreshSession();
      response = await run();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Cannot reach SignalHop. Please try again.', 0);
  }
  if (!response.ok) throw await failure(response);
  return response;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await responseFor(path, init);
  return response.status === 204 ? (undefined as T) : await response.json();
}
export async function signIn(email: string, password: string) {
  const session = await api<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSession(session);
  return session;
}

export type AnalyticsReport = {
  summary: { totalLinks: number; activeLinks: number; totalClicks: number; uniqueVisitors: number };
  daily: { date: string; clicks: number }[];
  topLinks: {
    id: string;
    title: string | null;
    code: string;
    destination: string;
    clicks: number;
  }[];
  referrers: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  generatedAt: string;
  timezone: string;
  link?: ShortLink;
};
