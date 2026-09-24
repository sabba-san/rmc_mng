/**
 * Auth context — provides user state and auth actions throughout the app.
 * On logout: clears in-memory token, resets state, forces full page reload.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setToken, clearToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: attempt to restore session via /auth/me
  // (token kept in-memory — page refresh means re-login; intentional for security)
  useEffect(() => {
    setLoading(false); // No token persisted; require login
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    // Full page reload clears all client state and any cached sensitive views
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
