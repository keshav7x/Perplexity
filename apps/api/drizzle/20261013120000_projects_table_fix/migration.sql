ALTER TABLE "conversations" ADD COLUMN "projectId" integer;--> statement-breakpoint
UPDATE "conversations" SET "projectId" = "project"."id" FROM "project" WHERE "project"."conversationId" = "conversations"."id";--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_conversationId_conversations_id_fkey";--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "conversationId";--> statement-breakpoint
ALTER TABLE "project" RENAME TO "projects";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description" varchar;--> statement-breakpoint
ALTER TABLE "projects" RENAME CONSTRAINT "project_ownerId_users_id_fkey" TO "projects_ownerId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "projects" RENAME CONSTRAINT "project_pkey" TO "projects_pkey";--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_projectId_projects_id_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL;
