// Mirrors apps/api/shared/Response.ts + drizzle schema shapes.
// Keep in sync with the API if the backend changes.

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface User {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  ownerId: number;
  projectId: number | null;
  isArchived: boolean | null;
  createdAt: string;
}

export type ChatSender = "user" | "ai";

export interface ChatMessage {
  id: number;
  conversationId: number;
  sender: ChatSender;
  message: string;
  createdAt: string;
  /** Client-only: true while the message exists only as an optimistic update. */
  pending?: boolean;
}

export interface SendMessageResult {
  conversation: Conversation;
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}
