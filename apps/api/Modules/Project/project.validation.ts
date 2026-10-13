import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "Nothing to update",
  });

export const projectListQuerySchema = z.object({
  limit: positiveInt.max(100).optional(),
  cursor: z.string().datetime({ offset: true }).optional(),
});

export const projectIdParamSchema = z.object({
  projectId: positiveInt,
});
