export interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  joinedAt: number;
}

export interface Attachment {
  type: 'image' | 'code' | 'file';
  url?: string;
  content?: string;
  title?: string;
}

export interface ReplyInfo {
  id: string;
  text: string;
  senderName: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: UserProfile;
  text: string;
  attachment?: Attachment;
  replyTo?: ReplyInfo;
  reactions: Record<string, string[]>;
  timestamp: number;
  system?: boolean;
}

export interface RoomMeta {
  id: string;
  name: string;
  hasPassKey: boolean;
  createdAt: number;
  creatorName: string;
  theme: string;
  messageCount: number;
  activeCount: number;
}

export interface RoomDetails {
  id: string;
  name: string;
  passKey?: string;
  createdAt: number;
  creatorName: string;
  theme: string;
}
