import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  KeyRound, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertCircle,
  Github
} from 'lucide-react';
import { JoinModal } from './components/JoinModal';
import { ChatHeader } from './components/ChatHeader';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { PassKeyBadgeModal } from './components/PassKeyBadgeModal';
import { MembersDrawer } from './components/MembersDrawer';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { ChatMessage, RoomDetails, UserProfile, ReplyInfo } from './types';
import { playMessageSound, playJoinSound } from './utils/sound';
import { encryptText, decryptText } from './utils/crypto';

export default function App() {
  // Authentication & Room state (only passkey required!)
  const [inRoom, setInRoom] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPassKey, setCurrentPassKey] = useState<string>('');

  // UI state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
  const [isPassKeyModalOpen, setIsPassKeyModalOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // id -> name
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('passchat_sound') !== 'false';
  });

  // URL parameters for direct link joins (#passkey or ?pass=123)
  const [initialPassKey, setInitialPassKey] = useState('');

  // Socket reference
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCredentialsRef = useRef<{ passKey: string; user: UserProfile } | null>(null);

  // Parse URL hash or search params once on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash) {
      setInitialPassKey(decodeURIComponent(hash));
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const passParam = params.get('pass');
    if (passParam) setInitialPassKey(passParam.trim());
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    if (!isSearching) {
      scrollToBottom();
    }
  }, [messages, isSearching, scrollToBottom]);

  // Connect & Join Room using ONLY Passkey via WebSocket
  const connectAndJoin = useCallback((passKey: string, user: UserProfile): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setConnecting(true);

      // Close any existing socket
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let resolved = false;

      const finishResolve = (result: { success: boolean; error?: string }) => {
        if (!resolved) {
          resolved = true;
          setConnecting(false);
          resolve(result);
        }
      };

      const timeout = setTimeout(() => {
        finishResolve({ success: false, error: 'Connection timed out. Please try again.' });
      }, 7000);

      ws.onopen = () => {
        setConnected(true);
        // Send join payload with ONLY pass key
        ws.send(JSON.stringify({
          type: 'join',
          passKey,
          user,
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'room_joined': {
              clearTimeout(timeout);
              const roomDetails: RoomDetails = {
                id: data.room.id,
                name: data.room.name || `Passkey: ${passKey}`,
                passKey: data.room.passKey || passKey,
                creatorName: data.room.creatorName || 'Anonymous',
                createdAt: data.room.createdAt || Date.now(),
                theme: data.room.theme || 'indigo',
              };

              setActiveRoom(roomDetails);
              setCurrentPassKey(data.room.passKey || passKey);
              setCurrentUser(data.currentUser || user);
              setMembers(data.members || []);
              
              // Merge local messages with server messages (prefer server as source of truth)
              const rawServerMessages: ChatMessage[] = data.messages || [];
              
              // Decrypt server messages
              const decryptPromises = rawServerMessages.map(async (msg) => {
                if (!msg.system && msg.text) {
                  const decrypted = await decryptText(msg.text, passKey, roomDetails.id);
                  return { ...msg, text: decrypted };
                }
                return msg;
              });
              
              const serverMessages = await Promise.all(decryptPromises);
              const localMessagesStr = localStorage.getItem(`passchat_messages_${roomDetails.id}`);
              let mergedMessages = serverMessages;
              
              if (localMessagesStr) {
                try {
                  const localMessages: ChatMessage[] = JSON.parse(localMessagesStr);
                  // Basic deduplication by ID
                  const existingIds = new Set(serverMessages.map(m => m.id));
                  const onlyLocal = localMessages.filter(m => !existingIds.has(m.id));
                  mergedMessages = [...onlyLocal, ...serverMessages].sort((a, b) => a.timestamp - b.timestamp);
                } catch {}
              }
              
              setMessages(mergedMessages);
              setInRoom(true);

              currentCredentialsRef.current = { passKey, user };

              // Update URL hash for easy sharing
              window.location.hash = encodeURIComponent(passKey);

              if (soundEnabled) {
                playJoinSound();
              }

              finishResolve({ success: true });
              break;
            }

            case 'new_message': {
              const msg: ChatMessage = data.message;
              
              // Async decrypt if needed
              const handleNewMessage = async () => {
                let processedMsg = msg;
                if (!msg.system && msg.text && activeRoom) {
                  const decrypted = await decryptText(msg.text, currentPassKey, activeRoom.id);
                  processedMsg = { ...msg, text: decrypted };
                }

                setMessages((prev) => {
                  if (prev.some((m) => m.id === processedMsg.id)) return prev;
                  return [...prev, processedMsg];
                });

                if (soundEnabled && !processedMsg.system && processedMsg.sender.id !== currentUser?.id) {
                  playMessageSound();
                }
              };
              
              handleNewMessage();
              break;
            }

            case 'user_joined': {
              setMembers(data.members || []);
              break;
            }

            case 'user_left': {
              setMembers(data.members || []);
              setTypingUsers((prev) => {
                const updated = new Map(prev);
                updated.delete(data.userId);
                return updated;
              });
              break;
            }

            case 'typing_status': {
              setTypingUsers((prev) => {
                const next = new Map(prev);
                if (data.isTyping) {
                  next.set(data.userId, data.userName);
                } else {
                  next.delete(data.userId);
                }
                return next;
              });
              break;
            }

            case 'message_reaction': {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === data.messageId) {
                    return { ...m, reactions: data.reactions };
                  }
                  return m;
                })
              );
              break;
            }

            case 'message_edited': {
              const handleEdit = async () => {
                let text = data.text;
                if (activeRoom) {
                  text = await decryptText(data.text, currentPassKey, activeRoom.id);
                }
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id === data.messageId) {
                      return { ...m, text: text, isEdited: true };
                    }
                    return m;
                  })
                );
              };
              handleEdit();
              break;
            }

            case 'message_deleted': {
              setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
              break;
            }

            case 'chat_cleared': {
              setMessages([data.message]);
              break;
            }

            case 'error': {
              clearTimeout(timeout);
              finishResolve({ success: false, error: data.message });
              break;
            }
          }
        } catch (err) {
          console.error('Error parsing incoming message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (currentCredentialsRef.current && inRoom) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            const creds = currentCredentialsRef.current;
            if (creds) {
              connectAndJoin(creds.passKey, creds.user);
            }
          }, 2500);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        clearTimeout(timeout);
        finishResolve({ success: false, error: 'Could not connect to PassChat server.' });
      };
    });
  }, [inRoom, currentUser, soundEnabled]);

  // Send message
  const handleSendMessage = async (
    text: string,
    replyTo?: ReplyInfo,
    attachment?: { type: 'image'; url: string }
  ) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;

    // Encrypt text before sending
    const encrypted = await encryptText(text, currentPassKey, activeRoom.id);

    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      text: encrypted,
      replyTo,
      attachment,
    }));
  };

  // Send typing notification
  const handleTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      isTyping,
    }));
  };

  // Toggle reaction
  const handleReact = (messageId: string, emoji: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'reaction',
      messageId,
      emoji,
    }));
  };

  // Edit message
  const handleEditMessage = async (messageId: string, text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;

    // Encrypt text before sending
    const encrypted = await encryptText(text, currentPassKey, activeRoom.id);

    wsRef.current.send(JSON.stringify({
      type: 'edit_message',
      messageId,
      text: encrypted,
    }));
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'delete_message',
      messageId,
    }));
  };

  // Clear chat
  const handleClearChat = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'clear_chat',
    }));
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave' }));
        wsRef.current.close();
      } catch {}
    }
    currentCredentialsRef.current = null;
    setInRoom(false);
    setActiveRoom(null);
    setMessages([]);
    setMembers([]);
    setTypingUsers(new Map());
    setIsMembersOpen(false);
    setIsPassKeyModalOpen(false);

    window.location.hash = '';
  };

  // Update room pass key
  const handleUpdatePassKey = async (newPassKey: string): Promise<boolean> => {
    if (!activeRoom) return false;
    try {
      const res = await fetch('/api/rooms/update-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          currentPassKey,
          newPassKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update pass key');
      }

      setCurrentPassKey(newPassKey);
      setActiveRoom((prev) => prev ? { ...prev, passKey: newPassKey } : null);
      if (currentCredentialsRef.current) {
        currentCredentialsRef.current.passKey = newPassKey;
      }
      window.location.hash = encodeURIComponent(newPassKey);
      return true;
    } catch (err) {
      throw err;
    }
  };

  // Sound toggle
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('passchat_sound', String(next));
      return next;
    });
  };

  // Persistence: Save messages to localStorage when they change
  useEffect(() => {
    if (inRoom && activeRoom && messages.length > 0) {
      const storageKey = `passchat_messages_${activeRoom.id}`;
      // Only keep last 100 messages for local storage to stay under 5MB
      const toSave = messages.slice(-100);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    }
  }, [messages, inRoom, activeRoom]);

  // Persistence: Save current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('passchat_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Initial load from local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('passchat_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch {}
    }
  }, []);

  // Filter messages if search query exists
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Format typing indicator string
  const typingNames = Array.from(typingUsers.values());
  const typingText =
    typingNames.length === 1
      ? `${typingNames[0]} is typing...`
      : typingNames.length > 1
      ? `${typingNames.join(', ')} are typing...`
      : null;

  // If user is not yet inside a room, show the Join Modal requiring ONLY passkey
  if (!inRoom || !activeRoom || !currentUser) {
    return (
      <>
        <JoinModal
          initialPassKey={initialPassKey}
          onJoin={connectAndJoin}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
        <GitHubPagesModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Top Navigation & Pass Key Header */}
      <ChatHeader
        room={activeRoom}
        memberCount={members.length}
        currentUser={currentUser}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenPassKeyModal={() => setIsPassKeyModalOpen(true)}
        onToggleMembers={() => setIsMembersOpen((prev) => !prev)}
        onLeaveRoom={handleLeaveRoom}
        onClearChat={handleClearChat}
        onOpenGitHubExport={() => setIsExportModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
        onToggleSearch={() => {
          setIsSearching(!isSearching);
          if (isSearching) setSearchQuery('');
        }}
      />

      {/* Disconnection / Reconnecting warning banner */}
      {!connected && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>Connection dropped. Reconnecting with passkey...</span>
          </div>
          <button
            onClick={() => {
              if (currentCredentialsRef.current) {
                const creds = currentCredentialsRef.current;
                connectAndJoin(creds.passKey, creds.user);
              }
            }}
            className="flex items-center gap-1 font-semibold hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Now
          </button>
        </div>
      )}

      {/* Main Message Stream */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col justify-between scroll-smooth">
        
        {/* Room Welcome Header */}
        <div className="py-6 text-center max-w-md mx-auto my-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Passkey Room Unlocked
          </h2>
          <p className="text-xs text-slate-400">
            Anyone who enters this passkey will join this exact private chat.
          </p>

          <button
            onClick={() => setIsPassKeyModalOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-medium border border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Passkey:</span>
            <span className="font-mono font-semibold text-white tracking-wider">
              {currentPassKey || '••••••'}
            </span>
          </button>
        </div>

        {/* Search Results Notice */}
        {searchQuery.trim() && (
          <div className="my-2 p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between">
            <span>Showing messages matching "{searchQuery}" ({displayedMessages.length} found)</span>
            <button
              onClick={() => setSearchQuery('')}
              className="hover:text-white"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Message Items List */}
        <div className="flex-1 flex flex-col justify-end">
          {displayedMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUser={currentUser}
              onReact={handleReact}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReply={(m) => setReplyingTo({ id: m.id, text: m.text, senderName: m.sender.name })}
              onPreviewImage={(url) => setPreviewImage(url)}
            />
          ))}

          {/* Typing Indicator */}
          {typingText && (
            <div className="flex items-center gap-2 py-2 px-1 text-xs text-indigo-400 animate-in fade-in">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>{typingText}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={!connected}
      />

      {/* Pass Key Modal */}
      <PassKeyBadgeModal
        room={activeRoom}
        isOpen={isPassKeyModalOpen}
        onClose={() => setIsPassKeyModalOpen(false)}
        onUpdatePassKey={handleUpdatePassKey}
      />

      {/* Members Drawer */}
      <MembersDrawer
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={members}
        currentUser={currentUser}
        creatorName={activeRoom.creatorName}
      />

      {/* GitHub Pages Export Modal */}
      <GitHubPagesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged attachment"
              className="max-h-[85vh] w-auto object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
