import React, { useState } from 'react';
import { KeyRound, Copy, Check, Eye, EyeOff, ShieldCheck, Share2, Edit3, X } from 'lucide-react';
import { RoomDetails } from '../types';

interface PassKeyBadgeModalProps {
  room: RoomDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePassKey?: (newPassKey: string) => Promise<boolean>;
}

export const PassKeyBadgeModal: React.FC<PassKeyBadgeModalProps> = ({
  room,
  isOpen,
  onClose,
  onUpdatePassKey,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  if (!isOpen) return null;

  const currentPassKey = room.passKey || '••••••';

  const handleCopyKey = () => {
    if (room.passKey) {
      navigator.clipboard.writeText(room.passKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room.id)}&pass=${encodeURIComponent(room.passKey || '')}`;
    const text = `Join my private room "${room.name}" on PassChat!\n\n🔑 Room ID: ${room.id}\n🛡️ Pass Key: ${room.passKey}\n\n🔗 Direct Link: ${inviteUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSaveNewKey = async () => {
    if (!newKey.trim()) {
      setUpdateError('New pass key cannot be empty');
      return;
    }
    setUpdating(true);
    setUpdateError('');
    try {
      if (onUpdatePassKey) {
        const success = await onUpdatePassKey(newKey.trim());
        if (success) {
          setIsEditing(false);
          setNewKey('');
        }
      }
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update pass key');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Room Security & Pass Key</h3>
              <p className="text-xs text-slate-400">Share this pass key with authorized peers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info */}
        <div className="py-4 space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Room Name</span>
            <div className="mt-1 text-sm font-semibold text-white flex items-center gap-2">
              <span>{room.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                #{room.id}
              </span>
            </div>
          </div>

          {/* Pass Key Display */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Active Pass Key
              </span>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>

            <div className="mt-1.5 flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-sm">
              <div className="flex-1 tracking-wider text-amber-300 font-semibold truncate select-all">
                {showKey ? currentPassKey : '••••••••••••'}
              </div>
              <button
                onClick={handleCopyKey}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Copy Pass Key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick Share Invite */}
          <button
            onClick={handleCopyInvite}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
          >
            {copiedInvite ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Invite Copied to Clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Copy Room & Pass Key Invite
              </>
            )}
          </button>

          {/* Pass Key Update section */}
          {onUpdatePassKey && (
            <div className="pt-3 border-t border-slate-800/80">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1.5 py-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Change room pass key
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <label className="text-xs font-medium text-slate-300">Set New Pass Key</label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter new pass key..."
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  {updateError && (
                    <p className="text-xs text-rose-400">{updateError}</p>
                  )}
                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setUpdateError('');
                        setNewKey('');
                      }}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNewKey}
                      disabled={updating || !newKey.trim()}
                      className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Update Key'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
          <span>Anyone joining must provide this pass key to access this chat.</span>
        </div>
      </div>
    </div>
  );
};
