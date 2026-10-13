import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(10_000),
  conversationId: positiveInt.optional(),
  projectId: positiveInt.optional(),
});

export const messageListQuerySchema = z.object({
  limit: positiveInt.max(100).optional(),
  cursor: z.string().datetime({ offset: true }).optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: positiveInt,
});

export const chatIdParamSchema = z.object({
  chatId: positiveInt,
});

export const editMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(10_000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
