import { useState, useEffect } from 'react';

// Lightweight reactive store without extra heavy dependencies
let currentUser = null;
let currentToken = null;
let isVaultLocked = false;

try {
  currentToken = localStorage.getItem('vault_token');
  const storedUser = localStorage.getItem('vault_user');
  if (storedUser) currentUser = JSON.parse(storedUser);
} catch (e) {
  console.error('Failed parsing auth storage:', e);
}

const listeners = new Set();

function notify() {
  listeners.forEach(fn => fn({
    token: currentToken,
    user: currentUser,
    isAuthenticated: Boolean(currentToken),
    isVaultLocked,
  }));
}

export function useAuthStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const cb = () => setTick(t => t + 1);
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);

  const login = (token, user) => {
    currentToken = token;
    currentUser = user;
    isVaultLocked = false;
    localStorage.setItem('vault_token', token);
    localStorage.setItem('vault_user', JSON.stringify(user));
    notify();
  };

  const logout = () => {
    currentToken = null;
    currentUser = null;
    isVaultLocked = false;
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    notify();
  };

  const updateUser = (userData) => {
    currentUser = { ...currentUser, ...userData };
    localStorage.setItem('vault_user', JSON.stringify(currentUser));
    notify();
  };

  const lockVault = () => {
    isVaultLocked = true;
    notify();
  };

  const unlockVault = () => {
    isVaultLocked = false;
    notify();
  };

  return {
    token: currentToken,
    user: currentUser,
    isAuthenticated: Boolean(currentToken),
    isVaultLocked,
    login,
    logout,
    updateUser,
    lockVault,
    unlockVault,
  };
}

export default useAuthStore;
