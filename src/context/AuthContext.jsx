import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('vault_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Offline/Local tokens do not require server validation
      if (token.startsWith('vault_session_') || token.startsWith('vault_guest_token_')) {
        setLoading(false);
        return;
      }

      // Validate token with server
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          try {
            const text = await res.text();
            if (res.ok && text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
              return JSON.parse(text.trim());
            }
          } catch (e) {}
          throw new Error('Session expired or backend unavailable');
        })
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('vault_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // If server is temporarily unreachable, preserve existing session if user data exists
          const saved = localStorage.getItem('vault_user');
          if (!saved) {
            logout();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('vault_token', newToken);
    localStorage.setItem('vault_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };
    try {
      const res = await fetch(url, { ...options, headers });
      
      // Override res.json to safely parse and NEVER throw HTML syntax errors
      res.json = async () => {
        try {
          const text = await res.text();
          if (!text || !text.trim()) return {};
          const trimmed = text.trim();
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return {};
          }
          return JSON.parse(trimmed);
        } catch (e) {
          return {};
        }
      };

      return res;
    } catch (networkErr) {
      return {
        ok: false,
        status: 503,
        statusText: 'Network Unavailable',
        headers: new Headers(),
        json: async () => ({})
      };
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
