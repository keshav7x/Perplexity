import { chatTable, conversationTable } from "@api/Database/schema";
import { db } from "@api/Database";
import { and, desc, eq, lt } from "drizzle-orm";

const DEFAULT_CONVERSATION_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 30;
const MAX_LIMIT = 100;

function parseCursor(cursor?: string): Date | undefined {
  if (!cursor) return undefined;
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid cursor");
  }
  return date;
}

function clampLimit(limit?: number, fallback = DEFAULT_MESSAGE_LIMIT) {
  if (limit === undefined) return fallback;
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Invalid limit");
  }
  return Math.min(limit, MAX_LIMIT);
}

export class chatRepositoryClass {
  constructor(private readonly DB: typeof db = db) { }

  // ---------- Conversations ----------

  createConversation = async (data: {
    ownerId: number;
    title: string;
    projectId?: number;
  }) => {
    const [conversation] = await this.DB
      .insert(conversationTable)
      .values({
        ownerId: data.ownerId,
        title: data.title,
        projectId: data.projectId ?? null,
      })
      .returning();

    return conversation!;
  };

  getConversationOrFail = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const [conversation] = await this.DB
      .select()
      .from(conversationTable)
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .limit(1);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  };

  getConversations = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
    includeArchived?: boolean;
    projectId?: number;
  }) => {
    const limit = clampLimit(data.limit, DEFAULT_CONVERSATION_LIMIT);
    const cursorDate = parseCursor(data.cursor);

    const conditions = [eq(conversationTable.ownerId, data.ownerId)];

    if (!data.includeArchived) {
      conditions.push(eq(conversationTable.isArchived, false));
    }
    if (data.projectId !== undefined) {
      conditions.push(eq(conversationTable.projectId, data.projectId));
    }
    if (cursorDate) {
      conditions.push(lt(conversationTable.createdAt, cursorDate));
    }

    const rows = await this.DB
      .select()
      .from(conversationTable)
      .where(and(...conditions))
      .orderBy(desc(conversationTable.createdAt), desc(conversationTable.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]!.createdAt.toISOString()
        : null;

    return { items, nextCursor };
  };

  updateConversation = async (data: {
    conversationId: number;
    ownerId: number;
    title?: string;
    isArchived?: boolean;
    projectId?: number | null;
  }) => {
    const patch: Partial<typeof conversationTable.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.isArchived !== undefined) patch.isArchived = data.isArchived;
    if (data.projectId !== undefined) patch.projectId = data.projectId;

    if (Object.keys(patch).length === 0) {
      throw new Error("Nothing to update");
    }

    const [conversation] = await this.DB
      .update(conversationTable)
      .set(patch)
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .returning();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  };

  deleteConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const [conversation] = await this.DB
      .delete(conversationTable)
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .returning({ id: conversationTable.id });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  };

  // ---------- Messages ----------

  createMessage = async (data: {
    conversationId: number;
    sender: "user" | "ai";
    message: string;
  }) => {
    const [chat] = await this.DB
      .insert(chatTable)
      .values({
        conversationId: data.conversationId,
        sender: data.sender,
        message: data.message,
      })
      .returning();

    return chat!;
  };

  /**
   * Newest-first page of messages. `nextCursor` is the ISO timestamp of
   * the oldest message in the page (pass it back as `cursor` to load older).
   */
  getMessages = async (data: {
    conversationId: number;
    limit?: number;
    cursor?: string;
  }) => {
    const limit = clampLimit(data.limit);
    const cursorDate = parseCursor(data.cursor);

    const conditions = [eq(chatTable.conversationId, data.conversationId)];
    if (cursorDate) {
      conditions.push(lt(chatTable.createdAt, cursorDate));
    }

    const rows = await this.DB
      .select()
      .from(chatTable)
      .where(and(...conditions))
      .orderBy(desc(chatTable.createdAt), desc(chatTable.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]!.createdAt.toISOString()
        : null;

    return { items, nextCursor };
  };

  private async getOwnedMessage(data: { chatId: number; ownerId: number }) {
    const [row] = await this.DB
      .select({ chat: chatTable })
      .from(chatTable)
      .innerJoin(
        conversationTable,
        eq(chatTable.conversationId, conversationTable.id),
      )
      .where(
        and(
          eq(chatTable.id, data.chatId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new Error("Message not found");
    }

    return row.chat;
  }

  updateMessage = async (data: {
    chatId: number;
    ownerId: number;
    message: string;
  }) => {
    await this.getOwnedMessage(data);

    const [chat] = await this.DB
      .update(chatTable)
      .set({ message: data.message })
      .where(eq(chatTable.id, data.chatId))
      .returning();

    return chat!;
  };

  deleteMessage = async (data: { chatId: number; ownerId: number }) => {
    await this.getOwnedMessage(data);

    const [chat] = await this.DB
      .delete(chatTable)
      .where(eq(chatTable.id, data.chatId))
      .returning({ id: chatTable.id });

    return chat!;
  };

  // ---------- Legacy wrappers (kept for compatibility) ----------

  /** @deprecated Use createConversation + createMessage instead. */
  create = async (data: {
    message: string;
    ownerId: number;
    conversationId?: number;
    conversationTitle?: string;
  }) => {
    return await this.DB.transaction(async (tx: any) => {
      let conversationId = data.conversationId;

      if (!conversationId) {
        if (!data.conversationTitle) {
          throw new Error("Conversation title is required");
        }

        const [conversation] = await tx
          .insert(conversationTable)
          .values({
            ownerId: data.ownerId,
            title: data.conversationTitle,
          })
          .returning({
            id: conversationTable.id,
            title: conversationTable.title,
          });

        conversationId = conversation!.id;
      } else {
        const [conversation] = await tx
          .select({ id: conversationTable.id })
          .from(conversationTable)
          .where(
            and(
              eq(conversationTable.id, conversationId),
              eq(conversationTable.ownerId, data.ownerId),
              eq(conversationTable.isArchived, false),
            ),
          )
          .limit(1);

        if (!conversation) {
          throw new Error("Conversation not found or unavailable");
        }
      }

      const [chat] = await tx
        .insert(chatTable)
        .values({
          conversationId,
          sender: "user",
          message: data.message,
        })
        .returning();

      return {
        conversationId: conversationId!,
        chat: chat!,
      };
    });
  };

  /** @deprecated Use createMessage instead. */
  createAiMessage = async (conversationId: number, message: string) => {
    return this.createMessage({ conversationId, sender: "ai", message });
  };

  /** @deprecated Use deleteMessage instead (now ownership-checked). */
  deleteChat = async (chatId: number) => {
    const [chat] = await this.DB
      .delete(chatTable)
      .where(eq(chatTable.id, chatId))
      .returning();

    return chat;
  };

  /** @deprecated Use updateMessage instead (now ownership-checked). */
  editChat = async (message: string, chatId: number) => {
    const [chat] = await this.DB
      .update(chatTable)
      .set({ message })
      .where(eq(chatTable.id, chatId))
      .returning();

    return chat;
  };
}
