'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api, refreshSession, setSession, subscribeSession, type User } from '@/lib/api';
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}>({ user: null, loading: true, logout: async () => {} });
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10000 } } }),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const off = subscribeSession(setUser);
    void refreshSession()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return off;
  }, []);
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setSession(null);
      client.clear();
    }
  }
  return (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
export const useAuth = () => useContext(AuthContext);
