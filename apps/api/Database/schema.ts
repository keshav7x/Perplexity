
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  hashedPassword: varchar().notNull(),
  tokenHash: varchar().notNull(),
  token_expires_at: timestamp("token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
});
