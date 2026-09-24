import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Download,
  Github,
  Check,
  Share2
} from 'lucide-react';
import { UserProfile } from '../types';

interface JoinModalProps {
  initialPassKey?: string;
  onJoin: (passKey: string, user: UserProfile) => Promise<{ success: boolean; error?: string }>;
  onOpenExportModal: () => void;
}

const AVATARS = ['👤', '⚡', '🦊', '🐱', '🐼', '🚀', '🛡️', '💎', '🔥', '🎮'];
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9', '#a855f7'];

export const JoinModal: React.FC<JoinModalProps> = ({
  initialPassKey = '',
  onJoin,
  onOpenExportModal,
}) => {
  // User profile
  const [name, setName] = useState(() => {
    return localStorage.getItem('passchat_user_name') || 'Guest-' + Math.floor(100 + Math.random() * 900);
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('passchat_user_avatar') || '👤';
  });
  const [selectedColor, setSelectedColor] = useState(() => {
    return localStorage.getItem('passchat_user_color') || '#6366f1';
  });

  // Only passkey is required!
  const [passKey, setPassKey] = useState(initialPassKey || '');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update passkey if prop or URL hash changes
  useEffect(() => {
    if (initialPassKey) {
      setPassKey(initialPassKey);
    }
  }, [initialPassKey]);

  const saveUserProfile = (): UserProfile => {
    localStorage.setItem('passchat_user_name', name.trim());
    localStorage.setItem('passchat_user_avatar', selectedAvatar);
    localStorage.setItem('passchat_user_color', selectedColor);

    return {
      id: `u-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim() || 'Anonymous Guest',
      color: selectedColor,
      avatar: selectedAvatar,
      joinedAt: Date.now(),
    };
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passKey.trim();
    if (!cleanPass) {
      setErrorMessage('Please enter a passkey');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const user = saveUserProfile();
    const result = await onJoin(cleanPass, user);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to enter chat. Please check your passkey.');
    }
  };

  const selectDemoKey = (key: string) => {
    setPassKey(key);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Top GitHub Pages badge */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Pages 1-Page HTML</span>
          </button>

          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            E2E Encrypted
          </span>
        </div>

        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Pass<span className="text-indigo-400">Chat</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Enter only a passkey to join. Anyone with the same passkey connects to the same private chat.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ONLY PASSKEY FORM */}
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          
          {/* Passkey Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Enter Passkey
              </label>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPass ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              value={passKey}
              onChange={(e) => setPassKey(e.target.value)}
              placeholder="e.g. coffee, secret123, team-alpha"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-base placeholder:font-sans placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors shadow-inner"
              required
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              No registration or room ID needed. Your passkey encrypts and unlocks the room.
            </p>
          </div>

          {/* User Nickname & Avatar customization */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Your Nickname</span>
              <div className="flex items-center gap-1">
                {AVATARS.slice(0, 5).map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`p-1 text-sm rounded-lg transition-all ${
                      selectedAvatar === av ? 'bg-indigo-600/40 border border-indigo-500 scale-110' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl p-2 rounded-xl bg-slate-800 border border-slate-700">
                {selectedAvatar}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Choose nickname..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Quick Demo Passkeys */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Test Passkeys:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Lounge', key: 'lounge' },
                { label: 'Dev Squad', key: 'dev-squad' },
                { label: 'Secret Vault', key: 'the-vault' },
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => selectDemoKey(d.key)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    passKey === d.key
                      ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{d.label}</div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">{d.key}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enter Button */}
          <button
            type="submit"
            disabled={loading || !passKey.trim()}
            className="w-full mt-3 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Unlocking with Passkey...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Join with Passkey
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer info & GitHub Pages Export */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export for GitHub Pages</span>
          </button>
          <span>100% Serverless</span>
        </div>
      </div>
    </div>
  );
};
