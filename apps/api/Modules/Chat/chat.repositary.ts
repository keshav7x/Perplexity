
import {
  chatTable,
  conversationTable,
} from "@api/Database/schema";
import { db } from "@api/Database";
import { and, eq } from "drizzle-orm";

export class chatRepositartClass {
  constructor(private readonly DB: typeof db = db) {}

  private chatExist = async (conversationId: number) => {
    const [conversation] = await this.DB
      .select({ id: conversationTable.id })
      .from(conversationTable)
      .where(eq(conversationTable.id, conversationId))
      .limit(1);

    return !!conversation;
  };

  create = async (
    data: {
      message: string;
      ownerId: number;
      conversationId?: number;
    },
  ) => {
    return await this.DB.transaction(async (tx) => {
      let conversationId = data.conversationId;

      if (!conversationId) {
        const [conversation] = await tx
          .insert(conversationTable)
          .values({
            ownerId: data.ownerId,
            title: data.message.trim().slice(0, 80),
          })
          .returning({
            id: conversationTable.id,
            title: conversationTable.title,
          });

        conversationId = conversation!.id;
      } else {
        const [conversation] = await tx
          .select({ id: conversationTable.id })
          .from(conversationTable)
          .where(
            and(
              eq(conversationTable.id, conversationId),
              eq(conversationTable.ownerId, data.ownerId),
              eq(conversationTable.isArchived, false),
            ),
          )
          .limit(1);

        if (!conversation) {
          throw new Error(
            "Conversation not found or unavailable",
          );
        }
      }
      const [chat] = await tx
        .insert(chatTable)
        .values({
          conversationId,
          sender: "user",
          message: data.message,
        })
        .returning();

      return {
        conversationId,
        chat,
      };
    });
  };

  creteAiMessage = async (conversaitonId: number,message:string) => {
    const [chat]=await this.DB.insert(chatTable).values({
      message: message,
      sender: "ai",
      conversationId:conversaitonId
    }).returning()
    return chat
  }

  deleteChat = async (chatId: number) => {
    const [chat] = await this.DB.delete(chatTable).where(eq(chatTable.id, chatId)).returning()
    return chat
  }

  editChat = async (message: string, chatId: number) => {
    const [chat] = await this.DB.update(chatTable).set({
      message:message
    }).where(eq(chatTable.id, chatId)).returning()
    return chat
  }
  
}
