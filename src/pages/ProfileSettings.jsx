import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api';
import { 
  ArrowLeft, User, KeyRound, ShieldCheck, HardDrive, 
  HelpCircle, Info, ChevronRight, Check, X, LogOut, 
  Smartphone, Calendar, Lock, AlertCircle
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, logout, lockVault, login } = useAuthStore();
  const navigate = useNavigate();

  // Active modal state: null | 'editProfile' | 'changePassword' | 'privacy' | 'storage' | 'help' | 'about'
  const [activeModal, setActiveModal] = useState(null);

  // Edit profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Kalyan Patra',
    phone: user?.phone || '+91 98765 43210',
    dob: user?.dob || '1998-04-12',
  });

  // Change password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Vault PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinStatus, setPinStatus] = useState('');

  // Support inquiry state
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'KP';

  // Handle Edit Profile submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setLoading(true);

    try {
      const { data } = await api.put('/auth/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
        dob: profileForm.dob,
      });

      // Update in store
      const token = localStorage.getItem('vault_token');
      login(token, data.user);
      setModalSuccess('Profile details saved successfully!');
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Password submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return setModalError('New passwords do not match');
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setModalSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle Vault PIN setup
  const handleSetPin = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      return setModalError('PIN must be exactly 4 digits');
    }

    setLoading(true);
    setModalError('');
    try {
      await api.post('/auth/vault-pin/set', { pin: pinInput });
      setModalSuccess('Vault Security PIN updated!');
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess('');
        setPinInput('');
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to configure PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your Memory Vault?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="p-4 sm:p-5 animate-fade-in space-y-4 pb-6 font-sans">
      {/* ===================== TOP HEADER ===================== */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-full bg-[#1e1a15] border border-[#31291e] flex items-center justify-center text-[#cda869] active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-serif font-bold text-[#f4ede2]">
          Profile
        </h1>
        <div className="w-9" />
      </div>

      {/* ================= USER CARD (Screen 17) ================= */}
      <div className="bg-[#1b1713] border border-[#2d241a] rounded-3xl p-5 shadow-lg text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d8b275] to-[#806538] text-[#14110e] font-serif font-bold text-2xl flex items-center justify-center border-4 border-[#2d241a] shadow-xl mx-auto mb-3">
          {initials}
        </div>

        <h2 className="text-base font-serif font-bold text-[#f7f0e4] leading-tight">
          {user?.name || 'Kalyan Patra'}
        </h2>
        <p className="text-xs font-serif text-[#baa995] mt-1">
          {user?.email || 'kalyan@example.com'}
        </p>
      </div>

      {/* ================= MENU LIST (Screen 17 Exact Items) ================= */}
      <div className="bg-[#1b1713] border border-[#2d241a] rounded-3xl divide-y divide-[#261f16] overflow-hidden shadow-md">
        {/* 1. Edit Profile */}
        <button
          type="button"
          onClick={() => { setActiveModal('editProfile'); setModalError(''); setModalSuccess(''); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              Edit Profile
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#786c5c]" />
        </button>

        {/* 2. Change Password */}
        <button
          type="button"
          onClick={() => { setActiveModal('changePassword'); setModalError(''); setModalSuccess(''); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              Change Password
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#786c5c]" />
        </button>

        {/* 3. Privacy & Security */}
        <button
          type="button"
          onClick={() => { setActiveModal('privacy'); setModalError(''); setModalSuccess(''); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              Privacy & Security
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#786c5c]" />
        </button>

        {/* 4. Storage Usage */}
        <button
          type="button"
          onClick={() => { setActiveModal('storage'); setModalError(''); setModalSuccess(''); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              Storage Usage
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-serif text-[#cda869]">
            <span>4.2 GB / 20 GB</span>
            <ChevronRight className="w-4 h-4 text-[#786c5c]" />
          </div>
        </button>

        {/* 5. Help & Support */}
        <button
          type="button"
          onClick={() => { setActiveModal('help'); setModalError(''); setModalSuccess(''); setSupportSubmitted(false); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              Help & Support
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#786c5c]" />
        </button>

        {/* 6. About Memory Vault */}
        <button
          type="button"
          onClick={() => { setActiveModal('about'); }}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#201c16] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#cda869]/10 text-[#cda869] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif font-semibold text-[#f4ede2]">
              About Memory Vault
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#786c5c]" />
        </button>
      </div>

      {/* ================= LOGOUT BUTTON (Exact Match to Screen 17) ================= */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-[#cda869] hover:bg-[#d8b577] text-[#120f0b] font-serif font-bold text-xs shadow-lg shadow-black/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Logout</span>
        </button>
      </div>

      {/* ==============================================================
          INTERACTIVE MODALS
      ============================================================== */}

      {/* Modal 1: Edit Profile */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d241a] pb-3">
              <h3 className="text-sm font-serif font-bold text-[#f5ede0]">Edit Profile</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#8f7e69] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && <p className="text-xs text-rose-400 font-serif text-center">{modalError}</p>}
            {modalSuccess && <p className="text-xs text-emerald-400 font-serif text-center">{modalSuccess}</p>}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={(e) => setProfileForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#30261a] text-[#baa995] font-serif text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs"
                >
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Change Password */}
      {activeModal === 'changePassword' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d241a] pb-3">
              <h3 className="text-sm font-serif font-bold text-[#f5ede0]">Change Password</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#8f7e69] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && <p className="text-xs text-rose-400 font-serif text-center">{modalError}</p>}
            {modalSuccess && <p className="text-xs text-emerald-400 font-serif text-center">{modalSuccess}</p>}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-serif text-[#cda869] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                  className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#30261a] text-[#baa995] font-serif text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs"
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Privacy & Security (Vault PIN) */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#cda869]/10 border border-[#cda869]/30 text-[#cda869] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-serif font-bold text-[#f5ede0]">Vault PIN & Security</h3>
              <p className="text-[11px] font-serif text-[#8f7e6b] mt-1">
                Configure your 4-digit numeric code to lock and unlock the vault anytime.
              </p>
            </div>

            {modalError && <p className="text-xs text-rose-400 font-serif">{modalError}</p>}
            {modalSuccess && <p className="text-xs text-emerald-400 font-serif">{modalSuccess}</p>}

            <form onSubmit={handleSetPin} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-36 mx-auto text-center text-2xl tracking-[0.5em] py-2 bg-[#120f0c] border border-[#3b3021] focus:border-[#cda869] rounded-2xl font-mono text-[#cda869] outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#30261a] text-[#baa995] font-serif text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || pinInput.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Storage Usage Breakdown */}
      {activeModal === 'storage' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d241a] pb-3">
              <h3 className="text-sm font-serif font-bold text-[#f5ede0]">Storage Usage Breakdown</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#8f7e69] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-serif">
                <span className="text-[#baa995]">Total Encrypted Vault</span>
                <span className="text-[#cda869] font-bold">4.2 GB / 20 GB</span>
              </div>

              <div className="w-full h-2.5 bg-[#120f0c] rounded-full overflow-hidden border border-[#2b2217]">
                <div className="h-full bg-[#cda869] rounded-full" style={{ width: '21%' }} />
              </div>

              <div className="space-y-2 pt-2 text-xs font-serif divide-y divide-[#261f16]">
                <div className="flex justify-between pt-1 text-[#d8cfc4]">
                  <span>📷 Photos (48 items)</span>
                  <span className="font-mono text-[#baa995]">2.4 GB</span>
                </div>
                <div className="flex justify-between pt-1 text-[#d8cfc4]">
                  <span>🎥 High-Definition Videos (8 items)</span>
                  <span className="font-mono text-[#baa995]">1.6 GB</span>
                </div>
                <div className="flex justify-between pt-1 text-[#d8cfc4]">
                  <span>📖 Diary Parchment Archives</span>
                  <span className="font-mono text-[#baa995]">120 MB</span>
                </div>
                <div className="flex justify-between pt-1 text-[#d8cfc4]">
                  <span>⏳ Sealed Time Capsules</span>
                  <span className="font-mono text-[#baa995]">80 MB</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Help & Support */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d241a] pb-3">
              <h3 className="text-sm font-serif font-bold text-[#f5ede0]">Help & Support</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#8f7e69] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {supportSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-serif text-[#f4ede2] font-bold">Inquiry Received</p>
                <p className="text-[11px] font-serif text-[#baa995]">The vault guardian team will respond to your registered email shortly.</p>
                <button
                  onClick={() => setActiveModal(null)}
                  className="mt-3 px-4 py-2 bg-[#cda869] text-[#120f0b] rounded-xl text-xs font-serif font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-serif">
                <div className="space-y-1.5">
                  <p className="font-bold text-[#cda869]">Frequently Asked Questions</p>
                  <p className="text-[11px] text-[#baa995]">• Are my time capsules completely locked? Yes, unlock date is mathematically enforced.</p>
                  <p className="text-[11px] text-[#baa995]">• Can I export my diary entries? Yes, from the diary reading view.</p>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] text-[#cda869] mb-1 font-bold">Submit a Question / Report Issue</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your issue or feedback..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-[#120f0c] border border-[#2e251b] rounded-xl px-3 py-2 text-xs text-[#f5ede0] outline-none font-serif resize-none"
                  />
                </div>

                <button
                  onClick={() => { if (supportMessage.trim()) setSupportSubmitted(true); }}
                  disabled={!supportMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs disabled:opacity-50"
                >
                  Send Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 6: About Memory Vault */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#191511] border border-[#3b3021] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#cda869]/10 border border-[#cda869]/30 text-[#cda869] mx-auto flex items-center justify-center">
              <img src="/images/vault_logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>

            <div>
              <h3 className="text-base font-serif font-bold text-[#f5ede0]">Memory Vault</h3>
              <p className="text-[11px] font-serif italic text-[#cda869] mt-0.5">
                "Preserve your past. Write your story. Unlock your future."
              </p>
            </div>

            <div className="text-left text-[11px] font-serif text-[#baa995] space-y-2 bg-[#120f0c] p-3 rounded-2xl border border-[#261e16]">
              <p>• <strong className="text-[#f4ede2]">Version:</strong> 1.0.0 (Production Release)</p>
              <p>• <strong className="text-[#f4ede2]">Security:</strong> Zero-knowledge AES encryption & SQLite WAL database architecture.</p>
              <p>• <strong className="text-[#f4ede2]">Philosophy:</strong> An emotional haven designed to honor life's quiet, reflective, and tragic beauty.</p>
              <p>• <strong className="text-[#f4ede2]">Promise:</strong> Your memories. Your privacy. Our promise.</p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#cda869] text-[#120f0b] font-serif font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
