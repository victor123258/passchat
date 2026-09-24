import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Image as ImageIcon, 
  X, 
  Reply, 
  Paperclip 
} from 'lucide-react';
import { ReplyInfo } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, replyTo?: ReplyInfo, attachment?: { type: 'image'; url: string }) => Promise<void> | void;
  onTyping: (isTyping: boolean) => void;
  replyTo?: ReplyInfo | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

const EMOJIS = ['👋', '🙌', '✨', '🔥', '💡', '🎉', '🚀', '❤️', '😂', '👀', '💯', '👍'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Handle typing event emission with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  // Handle paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            if (uploadEvent.target?.result) {
              setImagePreview(uploadEvent.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Handle image upload from file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 3MB
      if (file.size > 3 * 1024 * 1024) {
        alert('Please choose an image under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImagePreview(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = text.trim();

    if (!cleanText && !imagePreview) return;

    const attachment = imagePreview ? { type: 'image' as const, url: imagePreview } : undefined;
    onSendMessage(cleanText, replyTo || undefined, attachment);

    // Reset input state
    setText('');
    setImagePreview(null);
    onCancelReply();
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative p-3 bg-slate-900 border-t border-slate-800">
      
      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3.5 h-3.5 text-indigo-400 rotate-180 shrink-0" />
            <span className="font-semibold text-indigo-300">Replying to {replyTo.senderName}:</span>
            <span className="truncate opacity-80">{replyTo.text}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 hover:text-white hover:bg-slate-700 rounded-md shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview Banner */}
      {imagePreview && (
        <div className="relative inline-block mb-2 group">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-auto rounded-xl border border-indigo-500/50 object-cover shadow-lg"
          />
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Emoji Picker Tray */}
      {showEmojiPicker && (
        <div 
          className="absolute bottom-full mb-2 left-3 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-wrap gap-1 max-w-xs z-30 animate-in fade-in zoom-in-95"
          onMouseLeave={() => setShowEmojiPicker(false)}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => prev + emoji);
                setShowEmojiPicker(false);
                textareaRef.current?.focus();
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attachment & Emoji buttons */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Attach image or screenshot (Ctrl+V supported)"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="flex-1 relative bg-slate-950/80 border border-slate-700/80 focus-within:border-indigo-500 rounded-2xl transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder="Type a message (or paste image)... Shift+Enter for new line"
            className="w-full py-2.5 px-3.5 bg-transparent text-white text-sm focus:outline-hidden resize-none max-h-32 placeholder:text-slate-500 scrollbar-none"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || (!text.trim() && !imagePreview)}
          className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
