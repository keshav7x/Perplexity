import { projectsTable } from "@api/Database/schema";
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

export class projectRepositoryClass {
  constructor(private readonly DB: typeof db = db) {}

  create = async (data: {
    ownerId: number;
    title: string;
    description?: string;
  }) => {
    const [project] = await this.DB
      .insert(projectsTable)
      .values({
        ownerId: data.ownerId,
        title: data.title,
        description: data.description ?? null,
      })
      .returning();
    return project!;
  };

  getById = async (data: { projectId: number; ownerId: number }) => {
    const [project] = await this.DB
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, data.projectId),
          eq(projectsTable.ownerId, data.ownerId),
        ),
      )
      .limit(1);

    return project ?? null;
  };

  list = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
  }) => {
    const limit = clampLimit(data.limit);
    const cursorDate = parseCursor(data.cursor);

    const conditions = [eq(projectsTable.ownerId, data.ownerId)];
    if (cursorDate) {
      conditions.push(lt(projectsTable.createdAt, cursorDate));
    }

    const rows = await this.DB
      .select()
      .from(projectsTable)
      .where(and(...conditions))
      .orderBy(desc(projectsTable.createdAt), desc(projectsTable.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]!.createdAt.toISOString()
        : null;

    return { items, nextCursor };
  };

  update = async (data: {
    projectId: number;
    ownerId: number;
    title?: string;
    description?: string | null;
  }) => {
    const patch: Partial<typeof projectsTable.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;

    if (Object.keys(patch).length === 0) {
      throw new Error("Nothing to update");
    }

    const [project] = await this.DB
      .update(projectsTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(projectsTable.id, data.projectId),
          eq(projectsTable.ownerId, data.ownerId),
        ),
      )
      .returning();

    return project ?? null;
  };

  delete = async (data: { projectId: number; ownerId: number }) => {
    // Conversations are preserved; their projectId is SET NULL by FK.
    const [project] = await this.DB
      .delete(projectsTable)
      .where(
        and(
          eq(projectsTable.id, data.projectId),
          eq(projectsTable.ownerId, data.ownerId),
        ),
      )
      .returning({ deletedId: projectsTable.id });

    return project ?? null;
  };
}
