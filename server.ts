import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  joinedAt: number;
}

interface Reaction {
  userId: string;
  userName: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  sender: UserProfile;
  text: string;
  attachment?: {
    type: 'image' | 'code' | 'file';
    url?: string;
    content?: string;
    title?: string;
  };
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions: Record<string, Reaction[]>;
  timestamp: number;
  system?: boolean;
  isEdited?: boolean;
}

interface Room {
  id: string;
  name: string;
  passKey: string;
  createdAt: number;
  creatorName: string;
  theme: string;
  messages: ChatMessage[];
}

// In-memory state
const rooms = new Map<string, Room>();

// Seed default rooms for quick testing
function seedDefaultRooms() {
  if (!rooms.has('lounge')) {
    rooms.set('lounge', {
      id: 'lounge',
      name: 'Main Lounge ☕',
      passKey: 'lounge',
      createdAt: Date.now() - 3600000,
      creatorName: 'System',
      theme: 'indigo',
      messages: [
        {
          id: 'm-sys-1',
          roomId: 'lounge',
          sender: {
            id: 'system',
            name: 'PassChat Bot',
            color: '#6366f1',
            avatar: '🛡️',
            joinedAt: Date.now() - 3600000,
          },
          text: 'Welcome to PassChat! This room is protected by passkey "lounge". Only people who know the passkey can join and read messages.',
          reactions: { '🎉': [{ userId: 'system', userName: 'System' }] },
          timestamp: Date.now() - 3600000,
          system: true,
        },
      ],
    });
  }

  if (!rooms.has('dev-squad')) {
    rooms.set('dev-squad', {
      id: 'dev-squad',
      name: 'Dev Squad 💻',
      passKey: 'dev-squad',
      createdAt: Date.now() - 1800000,
      creatorName: 'Alex',
      theme: 'emerald',
      messages: [
        {
          id: 'm-sys-2',
          roomId: 'dev-squad',
          sender: {
            id: 'system',
            name: 'PassChat Bot',
            color: '#10b981',
            avatar: '⚡',
            joinedAt: Date.now() - 1800000,
          },
          text: 'Private engineering channel. Passkey is "dev-squad". Code snippets and live chat enabled.',
          reactions: { '🚀': [{ userId: 'alex', userName: 'Alex' }] },
          timestamp: Date.now() - 1800000,
          system: true,
        },
      ],
    });
  }

  if (!rooms.has('the-vault')) {
    rooms.set('the-vault', {
      id: 'the-vault',
      name: 'Secret Vault 🔒',
      passKey: 'the-vault',
      createdAt: Date.now() - 900000,
      creatorName: 'Agent-X',
      theme: 'rose',
      messages: [
        {
          id: 'm-sys-3',
          roomId: 'the-vault',
          sender: {
            id: 'system',
            name: 'PassChat Bot',
            color: '#f43f5e',
            avatar: '🔐',
            joinedAt: Date.now() - 900000,
          },
          text: 'Classified channel. Protected with passkey "the-vault". Keep all discussions confidential.',
          reactions: { '🔥': [{ userId: 'agent-x', userName: 'Agent-X' }] },
          timestamp: Date.now() - 900000,
          system: true,
        },
      ],
    });
  }
}

seedDefaultRooms();

// Track active connections: socket -> { roomId, user: UserProfile }
interface ClientSession {
  ws: WebSocket;
  roomId?: string;
  user?: UserProfile;
}

const clientSessions = new Map<WebSocket, ClientSession>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Get list of available rooms (metadata only, NO passkeys leaked)
  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values()).map((r) => {
      // count active members
      let activeCount = 0;
      for (const session of clientSessions.values()) {
        if (session.roomId === r.id && session.ws.readyState === WebSocket.OPEN) {
          activeCount++;
        }
      }
      return {
        id: r.id,
        name: r.name,
        hasPassKey: Boolean(r.passKey && r.passKey.trim().length > 0),
        createdAt: r.createdAt,
        creatorName: r.creatorName,
        theme: r.theme,
        messageCount: r.messages.length,
        activeCount,
      };
    });
    res.json({ rooms: list });
  });

  // 2. Verify pass key without joining WebSocket yet
  app.post('/api/rooms/verify', (req, res) => {
    const { roomId, passKey } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }
    const cleanId = String(roomId).trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found', notFound: true });
    }

    if (room.passKey && room.passKey !== String(passKey).trim()) {
      return res.status(401).json({ error: 'Invalid Pass Key for this room' });
    }

    return res.json({
      valid: true,
      room: {
        id: room.id,
        name: room.name,
        createdAt: room.createdAt,
        creatorName: room.creatorName,
        theme: room.theme,
      },
    });
  });

  // 3. Create a new room with pass key
  app.post('/api/rooms/create', (req, res) => {
    const { roomId, name, passKey, creatorName, theme } = req.body;
    if (!roomId || !name) {
      return res.status(400).json({ error: 'Room ID and Room Name are required' });
    }

    const cleanId = String(roomId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanId) {
      return res.status(400).json({ error: 'Room ID must contain letters or numbers' });
    }

    if (rooms.has(cleanId)) {
      return res.status(409).json({ error: 'A room with this ID already exists. Try joining it instead.' });
    }

    const cleanPass = String(passKey || '').trim();
    if (!cleanPass) {
      return res.status(400).json({ error: 'A Pass Key is required to create a protected room' });
    }

    const newRoom: Room = {
      id: cleanId,
      name: String(name).trim(),
      passKey: cleanPass,
      createdAt: Date.now(),
      creatorName: String(creatorName || 'Anonymous').trim(),
      theme: theme || 'indigo',
      messages: [
        {
          id: `m-init-${Date.now()}`,
          roomId: cleanId,
          sender: {
            id: 'system',
            name: 'PassChat Bot',
            color: '#6366f1',
            avatar: '🛡️',
            joinedAt: Date.now(),
          },
          text: `Room "${String(name).trim()}" created by ${creatorName || 'Anonymous'}. Only users with the pass key can enter.`,
          reactions: {},
          timestamp: Date.now(),
          system: true,
        },
      ],
    };

    rooms.set(cleanId, newRoom);

    res.status(201).json({
      success: true,
      room: {
        id: newRoom.id,
        name: newRoom.name,
        passKey: newRoom.passKey,
        theme: newRoom.theme,
      },
    });
  });

  // 4. Update room pass key (if authorized with current pass key)
  app.post('/api/rooms/update-passkey', (req, res) => {
    const { roomId, currentPassKey, newPassKey } = req.body;
    const cleanId = String(roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (room.passKey !== String(currentPassKey).trim()) {
      return res.status(401).json({ error: 'Current Pass Key does not match' });
    }
    const cleanNewPass = String(newPassKey || '').trim();
    if (!cleanNewPass) {
      return res.status(400).json({ error: 'New Pass Key cannot be empty' });
    }
    room.passKey = cleanNewPass;
    res.json({ success: true, message: 'Pass key updated successfully' });
  });

  // WebSocket Server setup
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', 'http://localhost');
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      // Ignore other upgrade requests (e.g. Vite HMR or non-ws)
    }
  });

  function broadcastToRoom(roomId: string, messageObj: unknown, excludeWs?: WebSocket) {
    const payload = JSON.stringify(messageObj);
    for (const [ws, session] of clientSessions.entries()) {
      if (session.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
        ws.send(payload);
      }
    }
  }

  function getRoomMembers(roomId: string): UserProfile[] {
    const membersMap = new Map<string, UserProfile>();
    for (const session of clientSessions.values()) {
      if (session.roomId === roomId && session.user && session.ws.readyState === WebSocket.OPEN) {
        membersMap.set(session.user.id, session.user);
      }
    }
    return Array.from(membersMap.values());
  }

  wss.on('connection', (ws) => {
    clientSessions.set(ws, { ws });

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const session = clientSessions.get(ws);
        if (!session) return;

        switch (payload.type) {
          case 'join': {
            const { roomId, passKey, user } = payload;
            const cleanPass = String(passKey || '').trim();
            if (!cleanPass) {
              ws.send(JSON.stringify({
                type: 'error',
                code: 'PASSKEY_REQUIRED',
                message: 'A passkey is required to join this chat.',
              }));
              return;
            }

            let cleanId = String(roomId || '').trim().toLowerCase();
            let room = cleanId ? rooms.get(cleanId) : undefined;

            // If not found by roomId, try matching by passkey across existing rooms
            if (!room) {
              for (const existingRoom of rooms.values()) {
                if (
                  existingRoom.passKey.toLowerCase() === cleanPass.toLowerCase() ||
                  existingRoom.id === cleanPass.toLowerCase()
                ) {
                  room = existingRoom;
                  cleanId = room.id;
                  break;
                }
              }
            }

            // If room still doesn't exist, auto-create the room for this passkey
            if (!room) {
              cleanId = cleanId || 'room-' + cleanPass.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
              room = {
                id: cleanId,
                name: `Passkey Room (${cleanPass})`,
                passKey: cleanPass,
                createdAt: Date.now(),
                creatorName: user?.name || 'Anonymous',
                theme: 'indigo',
                messages: [
                  {
                    id: `sys-${Date.now()}`,
                    roomId: cleanId,
                    sender: {
                      id: 'system',
                      name: 'PassChat Bot',
                      color: '#6366f1',
                      avatar: '🛡️',
                      joinedAt: Date.now(),
                    },
                    text: `Room initialized with passkey "${cleanPass}". Only peers with this passkey can join.`,
                    reactions: {},
                    timestamp: Date.now(),
                    system: true,
                  },
                ],
              };
              rooms.set(cleanId, room);
            }

            if (room.passKey && room.passKey.toLowerCase() !== cleanPass.toLowerCase()) {
              ws.send(JSON.stringify({
                type: 'error',
                code: 'INVALID_PASSKEY',
                message: 'Invalid passkey for this room. Access denied.',
              }));
              return;
            }

            const cleanUser: UserProfile = {
              id: user?.id || `u-${Math.random().toString(36).substring(2, 9)}`,
              name: user?.name?.trim() || 'Anonymous Guest',
              color: user?.color || '#3b82f6',
              avatar: user?.avatar || '👤',
              joinedAt: Date.now(),
            };

            session.roomId = cleanId;
            session.user = cleanUser;

            // Send room joined confirmation with full history and current members
            ws.send(JSON.stringify({
              type: 'room_joined',
              room: {
                id: room.id,
                name: room.name,
                passKey: room.passKey,
                creatorName: room.creatorName,
                createdAt: room.createdAt,
                theme: room.theme,
              },
              members: getRoomMembers(cleanId),
              messages: room.messages,
              currentUser: cleanUser,
            }));

            // Broadcast user joined to other members in the room
            broadcastToRoom(cleanId, {
              type: 'user_joined',
              user: cleanUser,
              members: getRoomMembers(cleanId),
            }, ws);

            // Add system join message
            const joinMsg: ChatMessage = {
              id: `sys-join-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              roomId: cleanId,
              sender: {
                id: 'system',
                name: 'System',
                color: '#64748b',
                avatar: '🔔',
                joinedAt: Date.now(),
              },
              text: `${cleanUser.name} unlocked the room and joined`,
              reactions: {},
              timestamp: Date.now(),
              system: true,
            };
            room.messages.push(joinMsg);
            broadcastToRoom(cleanId, {
              type: 'new_message',
              message: joinMsg,
            });
            break;
          }

          case 'send_message': {
            if (!session.roomId || !session.user) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not connected to any room' }));
              return;
            }
            const room = rooms.get(session.roomId);
            if (!room) return;

            const text = String(payload.text || '').trim();
            if (!text && !payload.attachment) return;

            const newMsg: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              roomId: session.roomId,
              sender: session.user,
              text,
              attachment: payload.attachment,
              replyTo: payload.replyTo,
              reactions: {},
              timestamp: Date.now(),
            };

            // Store message (keep last 500 messages per room)
            room.messages.push(newMsg);
            if (room.messages.length > 500) {
              room.messages.shift();
            }

            // Broadcast message to everyone in room (including sender for acknowledgment)
            broadcastToRoom(session.roomId, {
              type: 'new_message',
              message: newMsg,
            });
            break;
          }

          case 'typing': {
            if (!session.roomId || !session.user) return;
            broadcastToRoom(session.roomId, {
              type: 'typing_status',
              userId: session.user.id,
              userName: session.user.name,
              isTyping: Boolean(payload.isTyping),
            }, ws);
            break;
          }

          case 'reaction': {
            if (!session.roomId || !session.user) return;
            const room = rooms.get(session.roomId);
            if (!room) return;

            const { messageId, emoji } = payload;
            if (!messageId || !emoji) return;

            const targetMsg = room.messages.find((m) => m.id === messageId);
            if (!targetMsg) return;

            if (!targetMsg.reactions) {
              targetMsg.reactions = {};
            }

            const currentReactions = targetMsg.reactions[emoji] || [];
            const userId = session.user.id;
            const userName = session.user.name;

            const existingIndex = currentReactions.findIndex((r) => r.userId === userId);

            if (existingIndex !== -1) {
              // Toggle off
              targetMsg.reactions[emoji] = currentReactions.filter((r) => r.userId !== userId);
              if (targetMsg.reactions[emoji].length === 0) {
                delete targetMsg.reactions[emoji];
              }
            } else {
              // Add
              targetMsg.reactions[emoji] = [...currentReactions, { userId, userName }];
            }

            broadcastToRoom(session.roomId, {
              type: 'message_reaction',
              messageId,
              reactions: targetMsg.reactions,
            });
            break;
          }

          case 'edit_message': {
            if (!session.roomId || !session.user) return;
            const room = rooms.get(session.roomId);
            if (!room) return;

            const { messageId, text } = payload;
            const targetMsg = room.messages.find((m) => m.id === messageId);
            if (!targetMsg || targetMsg.sender.id !== session.user.id) return;

            const cleanText = String(text || '').trim();
            if (!cleanText) return;

            targetMsg.text = cleanText;
            targetMsg.isEdited = true;

            broadcastToRoom(session.roomId, {
              type: 'message_edited',
              messageId,
              text: cleanText,
            });
            break;
          }

          case 'delete_message': {
            if (!session.roomId || !session.user) return;
            const room = rooms.get(session.roomId);
            if (!room) return;

            const { messageId } = payload;
            const msgIndex = room.messages.findIndex((m) => m.id === messageId);
            if (msgIndex === -1) return;
            
            const targetMsg = room.messages[msgIndex];
            // Only sender or system can delete
            if (targetMsg.sender.id !== session.user.id && session.user.id !== 'system') return;

            room.messages.splice(msgIndex, 1);

            broadcastToRoom(session.roomId, {
              type: 'message_deleted',
              messageId,
            });
            break;
          }

          case 'clear_chat': {
            if (!session.roomId || !session.user) return;
            const room = rooms.get(session.roomId);
            if (!room) return;

            const clearMsg: ChatMessage = {
              id: `sys-clear-${Date.now()}`,
              roomId: session.roomId,
              sender: {
                id: 'system',
                name: 'System',
                color: '#64748b',
                avatar: '🧹',
                joinedAt: Date.now(),
              },
              text: `Chat history was cleared by ${session.user.name}`,
              reactions: {},
              timestamp: Date.now(),
              system: true,
            };

            room.messages = [clearMsg];

            broadcastToRoom(session.roomId, {
              type: 'chat_cleared',
              message: clearMsg,
            });
            break;
          }

          case 'leave': {
            handleLeave(ws);
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      handleLeave(ws);
      clientSessions.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      handleLeave(ws);
      clientSessions.delete(ws);
    });
  });

  function handleLeave(ws: WebSocket) {
    const session = clientSessions.get(ws);
    if (!session || !session.roomId || !session.user) return;

    const roomId = session.roomId;
    const user = session.user;

    // Remove room from session
    session.roomId = undefined;

    // Notify room
    const remainingMembers = getRoomMembers(roomId);
    broadcastToRoom(roomId, {
      type: 'user_left',
      userId: user.id,
      userName: user.name,
      members: remainingMembers,
    });

    const leaveMsg: ChatMessage = {
      id: `sys-leave-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId,
      sender: {
        id: 'system',
        name: 'System',
        color: '#64748b',
        avatar: '👋',
        joinedAt: Date.now(),
      },
      text: `${user.name} left the room`,
      reactions: {},
      timestamp: Date.now(),
      system: true,
    };

    const room = rooms.get(roomId);
    if (room) {
      room.messages.push(leaveMsg);
      broadcastToRoom(roomId, {
        type: 'new_message',
        message: leaveMsg,
      });
    }
  }

  // Vite middleware in dev or static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PassChat server running on http://0.0.0.0:${PORT} (WS on /ws)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
