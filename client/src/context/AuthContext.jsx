import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const DEFAULT_USER_SETTINGS = {
  theme: 'dark', // 'dark' | 'light' | 'system'
  fontStyle: 'serif', // 'serif' | 'handwriting' | 'sans'
  memoryView: 'grid', // 'grid' | 'list'
  autoLock: 'never', // 'never' | '15m' | '30m' | '1h'
  defaultCategory: 'Personal', // 'Personal' | 'Family' | 'Travel' | 'Love' | 'Milestones'
  soundEnabled: true,
};

export function applySettingsToDOM(settings) {
  if (!settings || typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Theme application
  if (settings.theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else if (settings.theme === 'light') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  } else {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  // 2. Font style
  root.setAttribute('data-vault-font', settings.fontStyle || 'serif');
}

function resolveSettingsForUser(userObj) {
  if (!userObj) return DEFAULT_USER_SETTINGS;
  const cleanEmail = (userObj.email || '').trim().toLowerCase();
  
  // 1. Check user_metadata.settings
  let loaded = userObj.user_metadata?.settings;
  
  // 2. Fallback to localStorage
  if (!loaded || Object.keys(loaded).length === 0) {
    try {
      const raw = localStorage.getItem(`vault_settings_${cleanEmail}`);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {}
  }
  
  return { ...DEFAULT_USER_SETTINGS, ...(loaded || {}) };
}

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  settings: DEFAULT_USER_SETTINGS,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updateSettings: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    // 1. Check active session
    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session) {
          setSession(session);
          setUser(session.user);
          const initialSettings = resolveSettingsForUser(session.user);
          setSettings(initialSettings);
          applySettingsToDOM(initialSettings);
        }
      } catch (err) {
        console.error('Error retrieving session:', err);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const nextUser = newSession?.user || null;
        setUser(nextUser);
        if (nextUser) {
          const userSettings = resolveSettingsForUser(nextUser);
          setSettings(userSettings);
          applySettingsToDOM(userSettings);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    setSession(data.session);

    // Immediately restore and apply saved settings
    const restoredSettings = resolveSettingsForUser(data.user);
    setSettings(restoredSettings);
    applySettingsToDOM(restoredSettings);

    return data;
  };

  const register = async ({ fullName, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          settings: DEFAULT_USER_SETTINGS,
        },
      },
    });
    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      setSettings(DEFAULT_USER_SETTINGS);
      applySettingsToDOM(DEFAULT_USER_SETTINGS);
    }
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (payload) => {
    let email = '';
    let options = {};
    if (typeof payload === 'string') {
      email = payload.trim().toLowerCase();
    } else if (typeof payload === 'object') {
      email = (payload.email || payload.identifier || '').trim().toLowerCase();
      options = payload;
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    if (data?.token && data?.user) {
      setUser(data.user);
      setSession(data.session || { access_token: data.token, token: data.token, user: data.user });
      const initialSettings = resolveSettingsForUser(data.user);
      setSettings(initialSettings);
      applySettingsToDOM(initialSettings);
    }
    return data;
  };

  const updateProfile = async ({ fullName, avatarUrl }) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });
    if (error) throw error;
    if (data.user) setUser(data.user);
    return data;
  };

  const updateSettings = async (newSettings) => {
    if (!user) return DEFAULT_USER_SETTINGS;
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const merged = { ...settings, ...newSettings };
    
    // Immediate local state & DOM application
    setSettings(merged);
    applySettingsToDOM(merged);

    // Save locally for instant persistence
    try {
      localStorage.setItem(`vault_settings_${cleanEmail}`, JSON.stringify(merged));
      if (merged.theme) {
        localStorage.setItem('timememory_theme', merged.theme);
      }
    } catch (e) {}

    // Cloud auth metadata sync
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          settings: merged,
        },
      });
      if (!error && data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.warn('Could not sync settings to supabase auth:', err);
    }

    // Profiles table sync (optional)
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: cleanEmail,
        settings: merged,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}

    return merged;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        settings,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

