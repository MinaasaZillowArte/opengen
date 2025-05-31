// src/types/chat.ts
import { Message } from '@/hooks/useChatLogic';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  modelAliasUsed: string;
  isArchived?: boolean;
}