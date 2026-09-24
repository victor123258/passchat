import React from 'react';
import { 
  KeyRound, 
  Users, 
  Search, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Trash2, 
  Share2, 
  ShieldCheck, 
  MoreVertical,
  Github,
  X
} from 'lucide-react';
import { RoomDetails, UserProfile } from '../types';

interface ChatHeaderProps {
  room: RoomDetails;
  memberCount: number;
  currentUser: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenPassKeyModal: () => void;
  onToggleMembers: () => void;
  onLeaveRoom: () => void;
  onClearChat: () => void;
  onOpenGitHubExport?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  onToggleSearch: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  memberCount,
  soundEnabled,
  onToggleSound,
  onOpenPassKeyModal,
  onToggleMembers,
  onLeaveRoom,
  onClearChat,
  onOpenGitHubExport,
  searchQuery,
  onSearchChange,
  isSearching,
  onToggleSearch,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <header className="relative px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 flex items-center justify-between gap-3 z-30">
      
      {/* Left: Room Title & Pass Key Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base sm:text-lg text-white truncate">
              {room.name}
            </h2>
            <span className="hidden sm:inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              #{room.id}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Clickable Pass Key badge */}
            <button
              onClick={onOpenPassKeyModal}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-colors cursor-pointer group"
              title="View room pass key and share invite"
            >
              <KeyRound className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Pass Key Protected</span>
            </button>

            {/* Online Member Count Pill */}
            <button
              onClick={onToggleMembers}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{memberCount} online</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: Search input when active */}
      {isSearching && (
        <div className="absolute inset-x-4 inset-y-2 z-10 flex items-center gap-2 bg-slate-900 px-3 rounded-xl border border-indigo-500/50 shadow-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages in this room..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white focus:outline-hidden placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
          <button
            onClick={onToggleSearch}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        
        {/* Toggle Search */}
        <button
          onClick={onToggleSearch}
          className={`p-2 rounded-xl transition-colors ${
            isSearching ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Search messages"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl transition-colors ${
            soundEnabled ? 'text-indigo-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
          }`}
          title={soundEnabled ? 'Sound notifications enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Member list button */}
        <button
          onClick={onToggleMembers}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="View members"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* GitHub Pages 1-Page HTML Export */}
        {onOpenGitHubExport && (
          <button
            onClick={onOpenGitHubExport}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
            title="Download single-page HTML for GitHub Pages"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Pages</span>
          </button>
        )}

        {/* Share invite fast button */}
        <button
          onClick={onOpenPassKeyModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Invite</span>
        </button>

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowMenu(false)}
            >
              {onOpenGitHubExport && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenGitHubExport();
                  }}
                  className="w-full px-3.5 py-2 text-left text-indigo-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Pages 1-Page HTML
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenPassKeyModal();
                }}
                className="w-full px-3.5 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Pass Key & Security
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm('Are you sure you want to clear chat history for everyone in this room?')) {
                    onClearChat();
                  }
                }}
                className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat History
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  onLeaveRoom();
                }}
                className="w-full px-3.5 py-2 text-left text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Room
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
