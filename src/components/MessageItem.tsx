import React, { useState } from 'react';
import { 
  Smile, 
  Reply, 
  Copy, 
  Check, 
  Code, 
  Maximize2 
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  currentUser: UserProfile;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onPreviewImage?: (url: string) => void;
}

const COMMON_EMOJIS = ['❤️', '👍', '😂', '🔥', '🚀', '🎉'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  onReact,
  onReply,
  onPreviewImage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSelf = message.sender.id === currentUser.id;
  const isSystem = Boolean(message.system);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render System messages
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3 text-xs text-slate-400">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-xs max-w-md text-center">
          <span>{message.sender.avatar || '🔔'}</span>
          <span>{message.text}</span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  // Render formatted message text (code blocks & links)
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Check for triple backtick code blocks
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        content: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return (
      <div className="space-y-2 whitespace-pre-wrap break-words leading-relaxed text-sm">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <div key={idx} className="relative my-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-sans">
                    <Code className="w-3 h-3 text-emerald-400" />
                    Code Snippet
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(p.content.trim())}
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <code>{p.content.trim()}</code>
              </div>
            );
          }

          // Plain text with link detection
          const words = p.content.split(/(\s+)/);
          return (
            <span key={idx}>
              {words.map((w, wIdx) => {
                if (w.startsWith('http://') || w.startsWith('https://')) {
                  return (
                    <a
                      key={wIdx}
                      href={w}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-indigo-400 text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      {w}
                    </a>
                  );
                }
                return w;
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`group relative flex gap-2.5 my-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar */}
      <div 
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border shadow-xs"
        style={{ 
          borderColor: message.sender.color || '#6366f1',
          backgroundColor: isSelf ? '#1e1b4b' : '#0f172a'
        }}
      >
        {message.sender.avatar || '👤'}
      </div>

      {/* Content Container */}
      <div className={`max-w-[82%] sm:max-w-[70%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        
        {/* Header: Sender name and timestamp */}
        <div className={`flex items-center gap-2 mb-1 px-1 text-xs text-slate-400 ${isSelf ? 'flex-row-reverse' : ''}`}>
          <span 
            className="font-semibold text-slate-300"
            style={{ color: isSelf ? '#818cf8' : message.sender.color || '#94a3b8' }}
          >
            {isSelf ? 'You' : message.sender.name}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`relative p-3.5 rounded-2xl shadow-md transition-all ${
            isSelf
              ? 'bg-indigo-600 text-white rounded-tr-xs'
              : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-xs'
          }`}
        >
          {/* Reply Reference if exists */}
          {message.replyTo && (
            <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
              isSelf 
                ? 'bg-indigo-700/60 border-indigo-300 text-indigo-100' 
                : 'bg-slate-900/60 border-indigo-400 text-slate-300'
            }`}>
              <div className="font-semibold text-[11px] flex items-center gap-1 opacity-90">
                <Reply className="w-3 h-3 rotate-180" />
                Replying to {message.replyTo.senderName}
              </div>
              <div className="truncate text-[11px] mt-0.5 opacity-80">
                {message.replyTo.text}
              </div>
            </div>
          )}

          {/* Attachment (Image) */}
          {message.attachment?.type === 'image' && message.attachment.url && (
            <div className="mb-2 overflow-hidden rounded-xl border border-white/10 group/img relative">
              <img
                src={message.attachment.url}
                alt="Attachment"
                className="max-h-72 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onPreviewImage && onPreviewImage(message.attachment!.url!)}
              />
              <button
                type="button"
                onClick={() => onPreviewImage && onPreviewImage(message.attachment!.url!)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Text */}
          {renderFormattedText(message.text)}

          {/* Floating Action Menu (shows on hover) */}
          <div
            className={`absolute top-0 -translate-y-1/2 flex items-center gap-0.5 p-1 rounded-xl bg-slate-900 border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
              isSelf ? 'left-0 -translate-x-4' : 'right-0 translate-x-4'
            }`}
          >
            {/* Quick emoji reactions */}
            {COMMON_EMOJIS.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className="p-1 hover:bg-slate-800 rounded-md text-xs transition-transform hover:scale-125"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-xs"
              title="More reactions"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3 bg-slate-700 my-auto mx-0.5" />

            <button
              type="button"
              onClick={() => onReply(message)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-xs"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-xs"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expanded Emoji Picker */}
          {showEmojiPicker && (
            <div 
              className="absolute z-20 top-full mt-1 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex gap-1 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowEmojiPicker(false)}
            >
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-sm hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction Badges Below Message */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
            {Object.entries(message.reactions).map(([emoji, users]) => {
              if (!users || users.length === 0) return null;
              const hasReacted = users.includes(currentUser.name);

              return (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                    hasReacted
                      ? 'bg-indigo-950/70 border-indigo-500/80 text-indigo-300'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={users.join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold text-[10px]">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
