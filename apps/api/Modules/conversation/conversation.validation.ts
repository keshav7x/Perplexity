import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120),
  projectId: positiveInt.optional(),
});

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const conversationListQuerySchema = z.object({
  limit: positiveInt.max(100).optional(),
  cursor: z.string().datetime({ offset: true }).optional(),
  includeArchived: z.coerce.boolean().optional(),
  projectId: positiveInt.optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: positiveInt,
});

export const moveConversationSchema = z.object({
  projectId: positiveInt.nullable(),
});
