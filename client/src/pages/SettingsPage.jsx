import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Lock, Download, User, Mail, Phone, Calendar, 
  KeyRound, CheckCircle, Database, LogOut, HardDrive, HeartHandshake, FileText
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, authFetch } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // Export JSON Archive
  const handleExportData = async () => {
    setExporting(true);
    setExportMsg('');

    try {
      const [diariesRes, capsulesRes, mediaRes] = await Promise.all([
        authFetch('/api/diary'),
        authFetch('/api/capsules'),
        authFetch('/api/media')
      ]);

      const diaries = await diariesRes.json();
      const capsules = await capsulesRes.json();
      const media = await mediaRes.json();

      const backup = {
        exported_at: new Date().toISOString(),
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          dob: user?.dob
        },
        diaries: diaries.entries || [],
        time_capsules: capsules.capsules || [],
        media_catalog: media.media || []
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-vault-backup-${user?.name?.replace(/\s+/g, '_')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportMsg('Complete memory archive (.JSON) downloaded to your device.');
    } catch (err) {
      console.error('Export error', err);
      setExportMsg('Failed to create JSON archive.');
    } finally {
      setExporting(false);
    }
  };

  // Export PDF Document
  const handleExportPdf = async () => {
    setExportingPdf(true);
    setExportMsg('');

    try {
      const [diariesRes, capsulesRes, mediaRes] = await Promise.all([
        authFetch('/api/diary'),
        authFetch('/api/capsules'),
        authFetch('/api/media')
      ]);

      const diariesData = await diariesRes.json();
      const capsulesData = await capsulesRes.json();
      const mediaData = await mediaRes.json();

      const diaries = diariesData.entries || [];
      const capsules = capsulesData.capsules || [];
      const media = mediaData.media || [];

      // Open a printable window styled as an elegant parchment memorial book
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for this site to generate and print your PDF document.');
        setExportingPdf(false);
        return;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Memory Vault Archive - ${user?.name || 'Patron'}</title>
  <style>
    @page {
      margin: 20mm;
      size: A4 portrait;
    }
    body {
      font-family: 'Georgia', 'Garamond', 'Times New Roman', serif;
      color: #1c150c;
      background: #faf6ee;
      padding: 30px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #5c3d26;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .header h1 {
      font-size: 28px;
      color: #3b2010;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #6d5540;
      font-style: italic;
    }
    .meta-box {
      background: #f1ebd9;
      border: 1px solid #d4c4a8;
      border-radius: 8px;
      padding: 14px 20px;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .meta-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-box td {
      padding: 4px 8px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #4a2810;
      border-bottom: 1px solid #c8b496;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .entry-card {
      border: 1px solid #dfd3bd;
      background: #ffffff;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #dfd3bd;
      padding-bottom: 6px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #7b6247;
    }
    .entry-title {
      font-size: 16px;
      font-weight: bold;
      color: #2b1704;
      margin-bottom: 8px;
    }
    .entry-content {
      font-size: 13px;
      white-space: pre-wrap;
      color: #2a2219;
      line-height: 1.7;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #d4c4a8;
      font-size: 11px;
      color: #8c765c;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
    .print-bar {
      background: #2b1704;
      color: #f7ede0;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: sans-serif;
    }
    .print-btn {
      background: #d4af37;
      color: #1a0f04;
      border: none;
      padding: 8px 18px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>Ready to save as PDF. Click "Save / Print PDF" and choose "Save as PDF" as destination.</span>
    <button class="print-btn" onclick="window.print()">Save / Print PDF</button>
  </div>

  <div class="header">
    <h1>Memory Vault &amp; Time Capsule</h1>
    <p>Permanent Offline Archival Record • Preserved for Eternity</p>
  </div>

  <div class="meta-box">
    <table>
      <tr>
        <td><strong>Vault Keeper:</strong> ${user?.name || 'Patron'}</td>
        <td><strong>Email:</strong> ${user?.email || 'N/A'}</td>
      </tr>
      <tr>
        <td><strong>Phone:</strong> ${user?.phone || 'N/A'}</td>
        <td><strong>Date of Birth:</strong> ${user?.dob || 'N/A'}</td>
      </tr>
      <tr>
        <td><strong>Export Date:</strong> ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</td>
        <td><strong>Total Volume:</strong> ${diaries.length} Diaries • ${capsules.length} Capsules • ${media.length} Media</td>
      </tr>
    </table>
  </div>

  <div class="section-title">I. Preserved Diary Entries (${diaries.length})</div>
  ${diaries.length === 0 ? '<p style="font-style:italic;color:#888;">No diary entries preserved.</p>' : ''}
  ${diaries.map((d, i) => `
    <div class="entry-card">
      <div class="entry-header">
        <span>#${i + 1} • MOOD: ${d.mood || 'Nostalgia'} • WEATHER: ${d.weather || 'Midnight Silence'}</span>
        <span>${new Date(d.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
      </div>
      <div class="entry-title">${d.title || 'Untitled Memory'}</div>
      <div class="entry-content">${d.content}</div>
    </div>
  `).join('')}

  <div class="section-title">II. Sealed Time Capsules (${capsules.length})</div>
  ${capsules.length === 0 ? '<p style="font-style:italic;color:#888;">No time capsules sealed.</p>' : ''}
  ${capsules.map((c, i) => `
    <div class="entry-card">
      <div class="entry-header">
        <span>CAPSULE #${i + 1} • ${c.is_opened ? 'UNLOCKED' : 'SEALED'}</span>
        <span>Unlock Date: ${new Date(c.unlock_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
      </div>
      <div class="entry-title">${c.title}</div>
      <div class="entry-content">${c.message}</div>
    </div>
  `).join('')}

  <div class="section-title">III. Vaulted Visual Media Catalog (${media.length})</div>
  ${media.length === 0 ? '<p style="font-style:italic;color:#888;">No visual media vaulted.</p>' : ''}
  ${media.map((m, i) => `
    <div class="entry-card">
      <div class="entry-header">
        <span>FILE #${i + 1} • TYPE: ${(m.media_type || 'photo').toUpperCase()}</span>
        <span>${new Date(m.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
      </div>
      <div class="entry-title">${m.caption || m.original_name}</div>
      <div class="entry-content" style="font-size:12px;color:#6d5540;">
        Original Filename: ${m.original_name} • Size: ${(m.size_bytes / 1024 / 1024).toFixed(2)} MB
      </div>
    </div>
  `).join('')}

  <div class="footer">
    <p>Memory Vault & Time Capsule • Zero Subscriptions • Lifetime Offline Vault Backup</p>
  </div>

  <script>
    window.onload = function() {
      // Auto prompt print dialog for instant PDF saving
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setExportMsg('Complete memory archive (.PDF) opened ready to save as PDF.');
    } catch (err) {
      console.error('PDF Export error', err);
      setExportMsg('Failed to generate PDF archive.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SECURITY & LIFETIME STORAGE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-antique text-stone-100">
          Vault Security & Account
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 font-serif mt-1">
          Review your account safeguards and download a permanent offline backup of your lifetime memories.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Account Details Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-stone-900 border border-amber-900/30 shadow-xl">
          <h2 className="text-xl font-bold font-antique text-amber-100 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-amber-400" />
            <span>Vault Keeper Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[11px] text-stone-400 block font-mono">FULL NAME</span>
              <span className="text-stone-200 font-semibold">{user?.name}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[11px] text-stone-400 block font-mono">EMAIL ADDRESS</span>
              <span className="text-stone-200 font-semibold">{user?.email}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[11px] text-stone-400 block font-mono">PHONE NUMBER</span>
              <span className="text-stone-200 font-semibold">{user?.phone}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[11px] text-stone-400 block font-mono">DATE OF BIRTH</span>
              <span className="text-stone-200 font-semibold">{user?.dob}</span>
            </div>
          </div>
        </div>

        {/* HIGH SECURITY & PERMANENCE GUARANTEE CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 to-amber-950/40 border border-amber-800/40 shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/50 flex items-center justify-center text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-antique text-stone-100">Permanent & Zero Subscription Guarantee</h2>
              <p className="text-xs text-stone-400">Our solemn promise to you</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Subscriptions & 100% Free:</strong> This vault requires no subscriptions, no monthly charges, and has no hidden fees.
              </span>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Permanent Storage:</strong> Every photo, video, and personal diary note stays permanently in your vault unless you explicitly choose to delete it.
              </span>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Strict Cryptographic Privacy:</strong> Only the person logged into this account can view these uploads. No other registered user has access to your files or thoughts.
              </span>
            </div>
          </div>
        </div>

        {/* DATA EXPORT CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl">
          <h2 className="text-xl font-bold font-antique text-stone-100 mb-2 flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>Export & Backup Your Vault</span>
          </h2>
          <p className="text-xs text-stone-400 mb-4 font-serif">
            Download a full, structured copy of all your written diaries, time capsules, and memory catalog to keep safely on your own computer or hard drive.
          </p>

          {exportMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{exportMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Download Complete Memory Archive (.PDF) */}
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-5 py-2.5 rounded-xl bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-600/70 text-xs font-semibold flex items-center space-x-2 transition disabled:opacity-50 shadow-md shadow-amber-950/50 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{exportingPdf ? 'Generating Document...' : 'Download Complete Memory Archive (.PDF)'}</span>
            </button>

            {/* Download Complete Memory Archive (.JSON) */}
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-stone-300 hover:text-amber-200 border border-stone-800 text-xs font-semibold flex items-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Compiling Archive...' : 'Download Complete Memory Archive (.JSON)'}</span>
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="pt-4 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-mono">Session ID: Encrypted Token Active</span>
          <button
            onClick={logout}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-rose-950 text-stone-300 hover:text-rose-200 border border-stone-800 hover:border-rose-900 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock & Sign Out</span>
          </button>
        </div>

      </div>

    </div>
  );
}
