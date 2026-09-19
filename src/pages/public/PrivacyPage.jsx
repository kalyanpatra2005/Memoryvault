import React from 'react';
import { ArrowLeft, Shield, Lock, EyeOff, Server, HardDrive, Database } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

export default function PrivacyPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('/')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:border-slate-800" />
            <div className="flex items-center gap-2">
              <BrandLogo size={20} />
              <span className="font-bold text-sm">TimeMemory</span>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last updated: Sept 2026</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Architecture Commitment</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy & Vault Security</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            TimeMemory is engineered from the ground up on one inviolable principle: <strong className="text-slate-900 dark:text-slate-100">your memories belong solely to you</strong>. We do not sell user data, we do not train AI on your private photos, and we do not run third-party advertising scripts.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-indigo-500" />
              1. PostgreSQL Row Level Security (RLS)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Every table in TimeMemory enforces strict Row Level Security policies at the database layer. Every SELECT, INSERT, UPDATE, and DELETE statement checks that <code className="text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">auth.uid() = user_id</code>. It is mathematically impossible for User A to see, query, or mutate User B's memories, even through URL manipulation or direct API inspection.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-indigo-500" />
              2. Isolated Cloud Storage Folders
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              When you upload a photograph or media file, it is written exclusively to your scoped user directory: <code className="text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/memory-media/[user_id]/[memory_id]/filename</code>. Storage security rules disallow cross-folder read and write requests.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              3. Permanent Cloud Storage vs. LocalStorage
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              We never save your permanent memory data, pictures, or notes in browser localStorage. Browser localStorage is strictly reserved for non-sensitive UI preferences (such as Light/Dark mode and sidebar toggle). This guarantees that logging out securely clears active sessions without leaving cached copies of private photos on shared computers.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <EyeOff className="w-4 h-4 text-indigo-500" />
              4. Data Deletion & The Right to be Forgotten
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              When you delete a memory or delete your account in Settings, the database record and associated storage assets are purged permanently from the server. We do not retain hidden soft copies.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
