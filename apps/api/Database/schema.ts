
import { defineRelations } from "drizzle-orm";
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
  tokenHash: varchar(),
  token_expires_at: timestamp("token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const conversationTable = pgTable("conversations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar().notNull(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  isArchived: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatTable = pgTable("chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer()
    .notNull()
    .references(() => conversationTable.id, { onDelete: "cascade" }),
  sender: varchar({ length: 50 }).notNull(),
  message: varchar().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectTable = pgTable("project", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar().notNull(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  conversationId: integer()
    .notNull()
    .references(() => conversationTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export const appRelations = defineRelations(
  {
    usersTable,
    conversationTable,
    projectTable,
    chatTable,
  },
  (r) => ({
    usersTable: {
      conversations: r.many.conversationTable(),
      projects: r.many.projectTable(),
    },

    conversationTable: {
      owner: r.one.usersTable({
        from: r.conversationTable.ownerId,
        to: r.usersTable.id,
      }),
      project: r.one.projectTable({
        from: r.conversationTable.id,
        to: r.projectTable.conversationId,
      }),
      chats: r.many.chatTable(),
    },

    projectTable: {
      owner: r.one.usersTable({
        from: r.projectTable.ownerId,
        to: r.usersTable.id,
      }),
      conversation: r.one.conversationTable({
        from: r.projectTable.conversationId,
        to: r.conversationTable.id,
      }),
    },

    chatTable: {
      conversation: r.one.conversationTable({
        from: r.chatTable.conversationId,
        to: r.conversationTable.id,
      }),
    },
  }),
);
