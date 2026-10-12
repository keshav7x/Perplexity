import { conversationTable } from "@api/Database/schema";
import { db } from "@api/Database";
import { and, eq } from "drizzle-orm";


export class conversationRepositaryClass{
  constructor(private readonly DB:typeof db) { }

  private conversationExist = async (conversationId: number) => {
    const [conversation] = await this.DB.
      select().
      from(conversationTable).
      where(eq(conversationTable.id, conversationId)).
      limit(1)

    return !!conversation
  }

  create = async (data: {
    ownerId: number,
    title:string
  }) => {
    const [conversation] = await this.DB.insert(conversationTable).values(data).returning()
    return conversation
  }

  rename = async (data: {
    conversationId: number,
    title:string
  }) => {
    const exist = await this.conversationExist(data.conversationId)
    if (!exist) return null
    const [conversation] = await this.DB
      .update(conversationTable)
      .set({
      title:data.title
      })
      .where(
        and(
          eq(conversationTable.id, data.conversationId),
          eq(conversationTable.isArchived,false)
        )
      )
      .returning()
    return conversation
  }

  archiveConversation = async (conversationId: number) => {
    const conversationExist = await this.conversationExist(conversationId)
    if (!conversationExist) return null
    const [conversation] = await this.DB.
      update(conversationTable).
      set({
        isArchived:true
      }).
      where(
        and(
          eq(conversationTable.id, conversationId),
          eq(conversationTable.isArchived,false)
        )
      ).
      returning()
    return conversation
  }

  deleteConversation = async (conversationId: number) => {
    const conversationExist = await this.conversationExist(conversationId)
    if (!conversationExist) return null
    const [deletedConversation] = await this.DB.
      delete(conversationTable).
      where(eq(conversationTable.id,conversationId)).
      returning({
        deletedId:conversationTable.id
      })
  return deletedConversation
  }

  unarchiveConversation = async (conversationId: number) => {
    const conversationExist = await this.conversationExist(conversationId)
    if (!conversationExist) return null
    const [conversation] = await this.DB.
      update(conversationTable).
      set({
        isArchived: false
      }).
      where(
        and(
          eq(conversationTable.id, conversationId),
          eq(conversationTable.isArchived,false)
        )
      ).
      returning()
  return conversation
  }
  
}
