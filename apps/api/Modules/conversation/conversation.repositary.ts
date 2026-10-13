import { conversationTable } from "@api/Database/schema";
import { db } from "@api/Database";
import { and, desc, eq, lt } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseCursor(cursor?: string): Date | undefined {
  if (!cursor) return undefined;
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid cursor");
  }
  return date;
}

function clampLimit(limit?: number) {
  if (limit === undefined) return DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Invalid limit");
  }
  return Math.min(limit, MAX_LIMIT);
}

export class conversationRepositaryClass {
  constructor(private readonly DB: typeof db = db) {}

  private conversationExist = async (conversationId: number) => {
    const [conversation] = await this.DB
      .select()
      .from(conversationTable)
      .where(eq(conversationTable.id, conversationId))
      .limit(1);

    return !!conversation;
  };

  create = async (data: {
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

  getById = async (data: { conversationId: number; ownerId: number }) => {
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

    return conversation ?? null;
  };

  list = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
    includeArchived?: boolean;
    projectId?: number;
  }) => {
    const limit = clampLimit(data.limit);
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

  rename = async (data: {
    conversationId: number;
    ownerId: number;
    title: string;
  }) => {
    const [conversation] = await this.DB
      .update(conversationTable)
      .set({
        title: data.title,
      })
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
          eq(conversationTable.isArchived, false),
        ),
      )
      .returning();
    return conversation ?? null;
  };

  archiveConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const [conversation] = await this.DB
      .update(conversationTable)
      .set({
        isArchived: true,
      })
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
          eq(conversationTable.isArchived, false),
        ),
      )
      .returning();
    return conversation ?? null;
  };

  deleteConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const [deletedConversation] = await this.DB
      .delete(conversationTable)
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .returning({
        deletedId: conversationTable.id,
      });
    return deletedConversation ?? null;
  };

  unarchiveConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const [conversation] = await this.DB
      .update(conversationTable)
      .set({
        isArchived: false,
      })
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
          // FIX: was `eq(isArchived, false)` which could never match an
          // archived row, so unarchiving always returned null.
          eq(conversationTable.isArchived, true),
        ),
      )
      .returning();
    return conversation ?? null;
  };

  setProject = async (data: {
    conversationId: number;
    ownerId: number;
    projectId: number | null;
  }) => {
    const [conversation] = await this.DB
      .update(conversationTable)
      .set({ projectId: data.projectId })
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.ownerId, data.ownerId),
        ),
      )
      .returning();
    return conversation ?? null;
  };
}
