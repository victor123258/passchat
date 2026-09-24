import React from 'react';
import { X, Users, Shield, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface MembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserProfile[];
  currentUser: UserProfile;
  creatorName?: string;
}

export const MembersDrawer: React.FC<MembersDrawerProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  creatorName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xs bg-slate-900 border-l border-slate-800 h-full p-4 flex flex-col text-slate-100 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-white">Active Members</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {members.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {members.map((m) => {
            const isMe = m.id === currentUser.id;
            const isCreator = creatorName && m.name.toLowerCase() === creatorName.toLowerCase();

            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm relative border shrink-0"
                    style={{ borderColor: m.color || '#6366f1', backgroundColor: '#0f172a' }}
                  >
                    {m.avatar || '👤'}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {m.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                          You
                        </span>
                      )}
                      {isCreator && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Passkey verified connections
        </div>
      </div>
    </div>
  );
};
