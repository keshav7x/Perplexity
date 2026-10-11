ALTER TABLE "users" ADD COLUMN "tokenHash" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_expires_at" timestamp;