import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { 
  ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, 
  User, Calendar, KeyRound, CheckCircle2, RotateCw, Sparkles 
} from 'lucide-react';

export default function Landing() {
  const [searchParams] = useSearchParams();
  const screenParam = searchParams.get('screen');

  // 'welcome' (Screen 1) | 'login' (Screen 2) | 'register' (Screen 3) | 'otp' (Screen 4)
  const getInitialView = () => {
    if (screenParam === '2' || screenParam === 'login') return 'login';
    if (screenParam === '3' || screenParam === 'register') return 'register';
    if (screenParam === '4' || screenParam === 'otp') return 'otp';
    return 'welcome';
  };

  const [view, setView] = useState(getInitialView);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (screenParam === '1' || screenParam === 'welcome') setView('welcome');
    else if (screenParam === '2' || screenParam === 'login') setView('login');
    else if (screenParam === '3' || screenParam === 'register') setView('register');
    else if (screenParam === '4' || screenParam === 'otp') setView('otp');
  }, [screenParam]);

  // Login form state (Screen 2)
  const [loginForm, setLoginForm] = useState({
    identifier: 'kalyan@example.com',
    password: 'password123',
  });

  // Register form state (Screen 3)
  const [regForm, setRegForm] = useState({
    name: 'Kalyan Patra',
    email: 'kalyan.new@example.com',
    phone: '+91 98765 43210',
    dob: '1998-04-12',
    password: 'password123',
    confirmPassword: 'password123',
  });

  // OTP Verification state (Screen 4)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [otpSentDemoCode, setOtpSentDemoCode] = useState('123456');
  const [otpIdentifier, setOtpIdentifier] = useState('+91 98765 43210');
  const otpInputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  // OTP 45-second countdown timer
  useEffect(() => {
    let interval = null;
    if (view === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, resendTimer]);

  // Handle Login submission (Screen 2)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        identifier: loginForm.identifier,
        password: loginForm.password,
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle "Get OTP" click from Register Form (Screen 3 -> Screen 4)
  const handleGetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!regForm.name.trim()) return setError('Please enter your full name');
    if (!regForm.email.trim()) return setError('Please enter your email address');
    if (!regForm.phone.trim()) return setError('Please enter your phone number');
    if (!regForm.dob) return setError('Please enter your date of birth');
    if (!regForm.password || regForm.password.length < 6) return setError('Password must be at least 6 characters');
    if (regForm.password !== regForm.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const targetId = regForm.phone.trim() || regForm.email.trim();
      setOtpIdentifier(targetId);

      const { data } = await api.post('/auth/send-otp', {
        identifier: targetId,
      });

      if (data.demoCode) {
        setOtpSentDemoCode(data.demoCode);
      }
      setResendTimer(45);
      setView('otp');
      // Focus first digit box after render
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP in Screen 4
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const { data } = await api.post('/auth/send-otp', {
        identifier: otpIdentifier,
      });
      if (data.demoCode) setOtpSentDemoCode(data.demoCode);
      setResendTimer(45);
      setInfoMsg(`New OTP sent! (Demo Code: ${data.demoCode})`);
      setTimeout(() => setInfoMsg(''), 4000);
    } catch (err) {
      setError('Could not resend OTP. Try again shortly.');
    }
  };

  // Handle OTP digit changes with auto-focus
  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g, '').slice(-1); // Only keep single digit
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Auto-fill demo OTP for convenience
  const handleAutoFillDemoOtp = () => {
    const digits = (otpSentDemoCode || '123456').split('');
    setOtpDigits(digits);
  };

  // Handle OTP verification and user registration / sign in (Screen 4)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 6) {
      return setError('Please enter all 6 digits of the OTP.');
    }

    setError('');
    setLoading(true);

    try {
      // 1. Verify code
      await api.post('/auth/verify-otp', {
        identifier: otpIdentifier,
        code: enteredCode,
      });

      // 2. Complete registration
      const { data } = await api.post('/auth/register', {
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        dob: regForm.dob,
        password: regForm.password,
        confirmPassword: regForm.confirmPassword,
        otpCode: enteredCode,
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      // If user already exists (e.g. re-registering demo), sign in directly
      if (err.response?.status === 409) {
        try {
          const { data } = await api.post('/auth/login', {
            identifier: regForm.email,
            password: regForm.password,
          });
          login(data.token, data.user);
          navigate('/dashboard');
          return;
        } catch (loginErr) {
          setError('An account with this email exists. Please use Login.');
        }
      } else {
        setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0908] text-[#f5ede0] flex items-center justify-center p-2 sm:p-6 select-none font-sans">
      {/* Smartphone Card Frame */}
      <div className="w-full max-w-[390px] min-h-[760px] bg-[#14110e] border border-[#26211a] rounded-[44px] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-7">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#cda869]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#cda869]/5 rounded-full blur-3xl pointer-events-none" />

        {/* ==============================================================
            SCREEN 1: SPLASH / WELCOME
        ============================================================== */}
        {view === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in relative z-10">
            {/* Top Branding Header */}
            <div className="flex flex-col items-center text-center mt-6">
              {/* Antique Arch Logo Emblem with Stars */}
              <div className="w-16 h-16 rounded-2xl bg-[#cda869]/10 border border-[#cda869]/35 flex items-center justify-center mb-4 shadow-lg shadow-black/40 relative group">
                <div className="absolute inset-0 bg-[#cda869]/10 rounded-2xl blur-md" />
                <img
                  src="/images/vault_logo.png"
                  alt="Memory Vault"
                  className="w-10 h-10 object-contain relative z-10"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-[#f4ede2] mb-3">
                Memory Vault
              </h1>
              <p className="font-serif italic text-xs sm:text-sm text-[#baa995] leading-relaxed max-w-[240px]">
                Preserve your past.<br />
                Write your story.<br />
                Unlock your future.
              </p>
            </div>

            {/* Candlelit Book Background Artwork */}
            <div className="my-6 w-full h-64 rounded-3xl overflow-hidden border border-[#2b241c] shadow-2xl relative group">
              <img
                src="/images/welcome_screen_bg.jpg"
                alt="Memory Vault Welcome"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/20 to-transparent pointer-events-none" />
            </div>

            {/* Bottom Buttons & Promise */}
            <div>
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d8b275] to-[#cda869] hover:from-[#e0be84] hover:to-[#d8b275] text-[#120f0b] font-serif font-bold text-sm tracking-wide shadow-lg shadow-black/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setView('register'); setError(''); }}
                  className="w-full py-3.5 rounded-2xl border border-[#cda869]/70 hover:border-[#cda869] hover:bg-[#cda869]/10 text-[#f5ede0] font-serif font-semibold text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Register</span>
                </button>
              </div>

              <p className="text-center text-[11px] font-serif text-[#786c5c] tracking-wider">
                Your memories. Your privacy. Our promise.
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            SCREEN 2: LOGIN
        ============================================================== */}
        {view === 'login' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in relative z-10">
            <div>
              {/* Back button */}
              <button
                type="button"
                onClick={() => { setView('welcome'); setError(''); }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#cda869] hover:text-white transition-colors mb-4 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Title & Emblem */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#cda869]/10 border border-[#cda869]/30 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <img src="/images/vault_logo.png" alt="Emblem" className="w-7 h-7 object-contain" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#f4ede2]">Memory Vault</h2>
                <p className="text-xs font-serif italic text-[#baa995] mt-1">Welcome back</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-serif text-center">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-serif text-[#cda869] mb-1.5 font-medium">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your email or phone"
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm(f => ({ ...f, identifier: e.target.value }))}
                      className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-4 py-3 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif text-[#cda869] mb-1.5 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-4 py-3 pr-10 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#786c5c] hover:text-[#f4ede2]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => alert('Demo Vault: Sign in with registered credentials (kalyan@example.com / password123).')}
                      className="text-[10px] font-serif text-[#8f7e69] hover:text-[#cda869]"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d8b275] to-[#cda869] hover:from-[#e0be84] hover:to-[#d8b275] text-[#120f0b] font-serif font-bold text-sm tracking-wide shadow-lg shadow-black/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? 'Unlocking Vault…' : 'Login'}
                </button>
              </form>

              {/* Social Login Options */}
              <div className="mt-5">
                <div className="flex items-center gap-3 my-3">
                  <div className="h-[1px] flex-1 bg-[#2b241c]" />
                  <span className="text-[10px] font-serif uppercase tracking-widest text-[#786c5c]">OR</span>
                  <div className="h-[1px] flex-1 bg-[#2b241c]" />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({ identifier: 'kalyan@example.com', password: 'password123' });
                      setInfoMsg('Filled demo account! Click Login.');
                      setTimeout(() => setInfoMsg(''), 3000);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-[#1b1713] border border-[#2f271f] hover:bg-[#241f19] text-xs font-serif text-[#dcd2c4] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <span>🌐</span>
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({ identifier: 'kalyan@example.com', password: 'password123' });
                      setInfoMsg('Filled demo account! Click Login.');
                      setTimeout(() => setInfoMsg(''), 3000);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-[#1b1713] border border-[#2f271f] hover:bg-[#241f19] text-xs font-serif text-[#dcd2c4] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <span>📘</span>
                    <span>Continue with Facebook</span>
                  </button>
                </div>
                {infoMsg && (
                  <p className="text-[11px] font-serif text-[#cda869] text-center mt-2">{infoMsg}</p>
                )}
              </div>
            </div>

            {/* Bottom Switcher */}
            <div className="text-center pt-3">
              <p className="text-xs font-serif text-[#8f7e69]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setView('register'); setError(''); }}
                  className="text-[#cda869] font-bold hover:underline"
                >
                  Register
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            SCREEN 3: REGISTER (With "Get OTP" Button)
        ============================================================== */}
        {view === 'register' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in relative z-10">
            <div>
              {/* Back button */}
              <button
                type="button"
                onClick={() => { setView('welcome'); setError(''); }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#cda869] hover:text-white transition-colors mb-2 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <h2 className="text-2xl font-serif font-bold text-[#f4ede2]">Create Your Account</h2>
                <p className="text-xs font-serif text-[#baa995] mt-0.5 mb-3">
                  Join Memory Vault and keep your memories safe forever.
                </p>
              </div>

              {error && (
                <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-serif text-center">
                  {error}
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleGetOtp} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={regForm.name}
                    onChange={(e) => setRegForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={regForm.email}
                    onChange={(e) => setRegForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    placeholder="Enter your phone number"
                    value={regForm.phone}
                    onChange={(e) => setRegForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={regForm.dob}
                    onChange={(e) => setRegForm(f => ({ ...f, dob: e.target.value }))}
                    className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 text-xs text-[#f5ede0] focus:border-[#cda869] outline-none font-serif"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password"
                      value={regForm.password}
                      onChange={(e) => setRegForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 pr-9 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786c5c]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-serif text-[#cda869] mb-1 font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm your password"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full bg-[#1b1713] border border-[#2f271f] rounded-2xl px-3.5 py-2 pr-9 text-xs text-[#f5ede0] placeholder-[#6b6051] focus:border-[#cda869] outline-none font-serif"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786c5c]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Exact Design: "Get OTP" Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d8b275] to-[#cda869] hover:from-[#e0be84] hover:to-[#d8b275] text-[#120f0b] font-serif font-bold text-xs tracking-wide shadow-lg shadow-black/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? 'Sending OTP…' : 'Get OTP'}
                </button>
              </form>
            </div>

            {/* Bottom Switcher */}
            <div className="text-center pt-2">
              <p className="text-xs font-serif text-[#8f7e69]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-[#cda869] font-bold hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            SCREEN 4: OTP VERIFICATION (Exact Match to Design Board)
        ============================================================== */}
        {view === 'otp' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in relative z-10">
            <div>
              {/* Back button (returns to Register) */}
              <button
                type="button"
                onClick={() => { setView('register'); setError(''); }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#cda869] hover:text-white transition-colors mb-4 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Title & Description */}
              <div className="mt-2">
                <h2 className="text-2xl font-serif font-bold text-[#f4ede2]">
                  Verify Your Email / Phone
                </h2>
                <p className="text-xs font-serif text-[#baa995] mt-2 leading-relaxed">
                  We have sent a 6-digit OTP to <br />
                  <span className="text-[#f5ede0] font-semibold tracking-wide">
                    {otpIdentifier || '+91 98765 43210'}
                  </span>
                </p>
              </div>

              {error && (
                <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-serif text-center">
                  {error}
                </div>
              )}

              {infoMsg && (
                <div className="my-3 p-3 rounded-xl bg-[#cda869]/10 border border-[#cda869]/30 text-[#e6cfab] text-xs font-serif text-center">
                  {infoMsg}
                </div>
              )}

              {/* 6 Square OTP Input Cells */}
              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 h-13 sm:w-12 sm:h-14 bg-[#1b1713] border rounded-2xl text-center font-serif text-xl font-bold text-[#f5ede0] outline-none transition-all shadow-inner ${
                        digit
                          ? 'border-[#cda869] bg-[#221c15] shadow-[#cda869]/10'
                          : 'border-[#2e261d] focus:border-[#cda869]/60'
                      }`}
                    />
                  ))}
                </div>

                {/* Resend Timer */}
                <div className="text-center pt-2">
                  {resendTimer > 0 ? (
                    <p className="text-xs font-serif text-[#8f7e69]">
                      Resend OTP in{' '}
                      <span className="text-[#cda869] font-medium font-mono">
                        00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs font-serif text-[#cda869] font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Resend OTP Now</span>
                    </button>
                  )}
                </div>

                {/* Verify Button (Screen 4) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d8b275] to-[#cda869] hover:from-[#e0be84] hover:to-[#d8b275] text-[#120f0b] font-serif font-bold text-sm tracking-wide shadow-lg shadow-black/50 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? 'Verifying Code…' : 'Verify'}
                </button>
              </form>

              {/* Convenient Demo Autofill Pill */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={handleAutoFillDemoOtp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201b15] border border-[#3b3022] text-[11px] font-serif text-[#baa995] hover:text-[#cda869] hover:border-[#cda869]/40 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-[#cda869]" />
                  <span>Use Demo Code ({otpSentDemoCode})</span>
                </button>
              </div>
            </div>

            {/* Bottom Switcher */}
            <div className="text-center pt-4">
              <p className="text-xs font-serif text-[#8f7e69]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-[#cda869] font-bold hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
