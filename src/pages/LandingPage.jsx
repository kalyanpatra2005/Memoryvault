import React from 'react';
import LoginPage from './public/LoginPage';

/**
 * Front Page of TimeMemory
 * Displays the exact Memory Vault mobile-first aesthetic matching the reference design:
 * - Header: Golden vault emblem + MEMORY VAULT + Free forever badge
 * - Eyebrow: WELCOME TO YOUR DIGITAL ARCHIVE
 * - Title: Every memory deserves a place.
 * - Subtitle: Preserve the past. Write your story. Unlock the future.
 * - Hero Photo: Framed family photos, warm glowing candles, vintage keepsake box & journal
 * - Actions: Side-by-side Login & Register buttons with slide-up drawers
 * - Footer: Your memories. Your privacy. Your vault.
 */
export default function LandingPage({ onNavigate, onOpenAuth, onGuestEnter }) {
  return <LoginPage onNavigate={onNavigate} initialMode={null} />;
}
