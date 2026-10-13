
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
  projectId: integer().references(() => projectsTable.id, {
    onDelete: "set null",
  }),
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

export const projectsTable = pgTable("projects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar().notNull(),
  description: varchar(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
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
    projectsTable,
    chatTable,
  },
  (r) => ({
    usersTable: {
      conversations: r.many.conversationTable(),
      projects: r.many.projectsTable(),
    },

    conversationTable: {
      owner: r.one.usersTable({
        from: r.conversationTable.ownerId,
        to: r.usersTable.id,
      }),
      project: r.one.projectsTable({
        from: r.conversationTable.projectId,
        to: r.projectsTable.id,
      }),
      chats: r.many.chatTable(),
    },

    projectsTable: {
      owner: r.one.usersTable({
        from: r.projectsTable.ownerId,
        to: r.usersTable.id,
      }),
      conversations: r.many.conversationTable(),
    },

    chatTable: {
      conversation: r.one.conversationTable({
        from: r.chatTable.conversationId,
        to: r.conversationTable.id,
      }),
    },
  }),
);
