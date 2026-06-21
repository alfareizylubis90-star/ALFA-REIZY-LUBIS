import { useState, FormEvent } from "react";
import { Lock, User, Eye, EyeOff, ShieldAlert, KeyRound, CheckSquare } from "lucide-react";

interface LoginScreenProps {
  onLoginAttempt: (username: string, password: string) => boolean;
}

export default function LoginScreen({ onLoginAttempt }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username tidak boleh kosong.");
      return;
    }
    if (!password) {
      setError("Sandi / Password tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    
    // Tiny artificial timeout for high-fidelity luxury loading experience
    setTimeout(() => {
      const success = onLoginAttempt(username, password);
      setIsSubmitting(false);
      if (!success) {
        setError("Kredensial salah! Periksa kembali Username dan Password Anda.");
      }
    }, 600);
  };

  const handleFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Decorative Luxury Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Main Login Frame */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 transition-all">
        {/* Top Gold & Silver Logo Embed */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center bg-slate-950/60 p-2 rounded-xl border border-amber-500/15 shadow-inner mb-4">
            <svg
              viewBox="140 20 320 72"
              className="h-12 w-auto drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldHead" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF9E6" />
                  <stop offset="15%" stopColor="#E5C158" />
                  <stop offset="50%" stopColor="#AD8020" />
                  <stop offset="65%" stopColor="#FCDC6D" />
                  <stop offset="85%" stopColor="#966512" />
                  <stop offset="100%" stopColor="#5E3E0B" />
                </linearGradient>

                <linearGradient id="silverText" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#F5F5F5" />
                  <stop offset="50%" stopColor="#A3A3A3" />
                  <stop offset="55%" stopColor="#E5E5E5" />
                  <stop offset="85%" stopColor="#737373" />
                  <stop offset="100%" stopColor="#404040" />
                </linearGradient>
              </defs>

              <g>
                <text
                  x="298"
                  y="76"
                  fontFamily="'Georgia', 'Times New Roman', serif"
                  fill="url(#silverText)"
                  stroke="#111"
                  strokeWidth="1.2"
                  textAnchor="middle"
                  style={{ filter: "drop-shadow(0px 1.5px 2px rgba(0, 0, 0, 0.8))" }}
                >
                  <tspan fontSize="62" fontWeight="900" letterSpacing="-1">L</tspan>
                  <tspan fontSize="46" fontWeight="900" letterSpacing="0.5" dy="-4">iga</tspan>
                  <tspan fontSize="62" fontWeight="900" letterSpacing="-1" dx="1.5" dy="4">B</tspan>
                  <tspan fontSize="46" fontWeight="900" letterSpacing="0.5" dy="-4">andot</tspan>
                </text>
              </g>
            </svg>
          </div>

          <h2 className="text-sm font-black text-white tracking-widest uppercase mb-1">
            PORTAL SIGN-IN OPERASIONAL
          </h2>
          <p className="text-xs text-slate-400 tracking-wider font-mono">
            Isikan kredensial Anda untuk memantau & mengatur tugas
          </p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 font-semibold">{error}</p>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
              Username / Akun
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-amber-500/10 shadow-inner"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
              Kata Sandi / Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-xl py-2.5 pl-9 pr-10 text-xs font-medium text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-amber-500/10 shadow-inner"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15 border border-amber-400/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                MEMVERIFIKASI...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> MASUK APLIKASI
              </span>
            )}
          </button>
        </form>


      </div>

      {/* Brand footer inside login page */}
      <p className="text-[10px] text-slate-700 font-mono mt-6 tracking-wide select-none">
        LigaBandot Official Tech Security • LocalStorage Engine • v1.2.0
      </p>
    </div>
  );
}
