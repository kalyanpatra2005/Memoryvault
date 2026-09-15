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
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            return res.json();
          }
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
    const res = await fetch(url, { ...options, headers });
    
    // Attach a safe json parser to the response object to prevent "Unexpected token '<' or 'T'"
    const originalJson = res.json.bind(res);
    res.json = async () => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text && text.length < 200 ? text : `Backend server responded with ${res.status} (${res.statusText || 'Non-JSON response'}). Make sure backend server is running.`);
      }
      return originalJson();
    };

    return res;
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
