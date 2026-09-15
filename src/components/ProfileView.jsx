import { 
  ShieldCheck, User, Mail, Phone, Calendar, Lock, CheckCircle2, 
  HardDrive, FileText, Image as ImageIcon, Video, KeyRound, Award, Heart
} from 'lucide-react';
import { vaultEngine } from '../services/vaultEngine';

export default function ProfileView({ token, user, onLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await vaultEngine.getProfile(token, user?.id);
        setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token, user]);

  const stats = profileData?.stats || { photos: 0, videos: 0, diaries: 0 };
  const u = profileData?.user || user;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-amber-900/20 pb-6">
        <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-amber-100 tracking-wider">
          SECURITY VAULT &amp; PROFILE
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-serif">
          Your personal data, account credentials, and high-security isolation metrics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Photos Card */}
        <div className="bg-[#121722] rounded-2xl border border-slate-800 p-6 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-cinzel font-bold text-amber-100">{stats.photos}</div>
            <div className="text-xs text-slate-400">Photos Permanently Sealed</div>
          </div>
        </div>

        {/* Videos Card */}
        <div className="bg-[#121722] rounded-2xl border border-slate-800 p-6 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Video className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-cinzel font-bold text-amber-100">{stats.videos}</div>
            <div className="text-xs text-slate-400">Video Memories Preserved</div>
          </div>
        </div>

        {/* Diary Card */}
        <div className="bg-[#121722] rounded-2xl border border-slate-800 p-6 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-cinzel font-bold text-amber-100">{stats.diaries}</div>
            <div className="text-xs text-slate-400">Tragic Diary Pages Inked</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: User Details & Security Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Details */}
        <div className="lg:col-span-6 bg-[#121722] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-100 text-base">VAULT HOLDER DETAILS</h3>
              <p className="text-xs text-slate-400">Registered personal credentials</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-slate-400">
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">Account Name</span>
              </div>
              <span className="font-semibold text-slate-200">{u?.name || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">Email Address</span>
              </div>
              <span className="font-mono text-xs text-slate-200">{u?.email || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">Phone Number</span>
              </div>
              <span className="font-mono text-xs text-slate-200">{u?.phone || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">Date of Birth</span>
              </div>
              <span className="font-mono text-xs text-slate-200">{u?.dob || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium">Subscription Tier</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                100% Free Lifetime
              </span>
            </div>
          </div>
        </div>

        {/* High Security Architecture Box */}
        <div className="lg:col-span-6 bg-[#121722] rounded-2xl border border-emerald-900/30 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-100 text-base">HIGH SECURITY ASSURANCE</h3>
              <p className="text-xs text-emerald-400">Active Cryptographic &amp; Privacy Protection</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-[#0b0e14] border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-semibold text-slate-100">Strict Per-User Privacy Isolation</h5>
                <p className="text-slate-400 mt-0.5">
                  Only you can ever see the photos, videos, or diary entries you upload. Other users have zero visibility or access to your media.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0e14] border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-semibold text-slate-100">Permanent Retention Guarantee</h5>
                <p className="text-slate-400 mt-0.5">
                  Your files will stay permanently stored in the vault forever until you explicitly choose to delete them. No automatic expiration.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0e14] border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-semibold text-slate-100">Bcrypt Salted Password Hashing</h5>
                <p className="text-slate-400 mt-0.5">
                  Passwords are never stored in plaintext. They are encrypted with 10-round bcrypt salting and authenticated with stateless JWT tokens.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0e14] border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-semibold text-slate-100">Zero Cost &amp; No Subscriptions</h5>
                <p className="text-slate-400 mt-0.5">
                  This service is fully free, requiring no credit card, no recurring fees, and no feature limits.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>Seal Vault &amp; Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
