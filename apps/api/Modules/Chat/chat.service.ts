import { chatRepositoryClass } from "./chat.repositary";
import { generateChatTitle } from "@api/AI/services/generateTitle";
import {
  completeChat,
  type ChatHistoryItem,
} from "@api/AI/services/completeChat";
import { db } from "@api/Database";
import {
  chatTable,
  conversationTable,
  projectsTable,
} from "@api/Database/schema";
import { and, eq } from "drizzle-orm";

type Sender = "user" | "ai";

type Chat = {
  id: number;
  conversationId: number;
  sender: Sender;
  message: string;
  createdAt: Date;
};

type Conversation = {
  id: number;
  ownerId: number;
  title: string;
  projectId: number | null;
  isArchived: boolean | null;
  createdAt: Date;
};

type CreateMessageInput = {
  message: string;
  ownerId: number;
  conversationId?: number;
  projectId?: number;
};

type PaginationInput = {
  ownerId: number;
  conversationId: number;
  limit?: number;
  cursor?: string; // ISO timestamp of the oldest loaded message
};

type ConversationRow = typeof conversationTable.$inferSelect;
type ChatRow = typeof chatTable.$inferSelect;

export type SendMessageResult = {
  conversation: ConversationRow;
  userMessage: ChatRow;
  aiMessage: ChatRow;
};

export class chatServiceClass {
  constructor(
    private readonly chatRepo: chatRepositoryClass = new chatRepositoryClass(db),
  ) {}

  private assertMessage(message?: string) {
    const trimmed = message?.trim();

    if (!trimmed) {
      throw new Error("Message is required");
    }

    if (trimmed.length > 10_000) {
      throw new Error("Message is too long");
    }

    return trimmed;
  }

  private assertOwnerId(ownerId?: number) {
    if (!Number.isInteger(ownerId) || (ownerId as number) <= 0) {
      throw new Error("Unauthorized access");
    }

    return ownerId as number;
  }

  private async assertOwnedProject(ownerId: number, projectId: number) {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new Error("Invalid project ID");
    }

    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, projectId),
          eq(projectsTable.ownerId, ownerId),
        ),
      )
      .limit(1);

    if (!project) {
      throw new Error("Project not found");
    }
  }

  private async generateTitle(message: string) {
    const title = await generateChatTitle(message);

    if (!title) {
      throw new Error("Chat title could not be created");
    }

    return title.toString().slice(0, 120);
  }

  private toSender(value: string): Sender {
    return value === "user" ? "user" : "ai";
  }

  private async generateAnswer(
    message: string,
    history: { sender: Sender; message: string }[],
  ) {
    const formattedHistory: ChatHistoryItem[] = history.map((item) => ({
      role: item.sender === "user" ? "user" : "assistant",
      content: item.message,
    }));

    const answer = await completeChat("groq", message, formattedHistory);
    console.log(answer)
    if (!answer) {
      throw new Error("AI response could not be generated");
    }

    return answer;
  }

  createConversation = async (data: {
    message: string;
    ownerId: number;
    projectId?: number;
  }): Promise<SendMessageResult> => {
    const ownerId = this.assertOwnerId(data.ownerId);
    const message = this.assertMessage(data.message);

    if (data.projectId !== undefined) {
      await this.assertOwnedProject(ownerId, data.projectId);
    }

    const title = await this.generateTitle(message);

    const conversation = await this.chatRepo.createConversation({
      ownerId,
      title,
      projectId: data.projectId,
    });

    return this.sendMessage({
      ownerId,
      conversationId: conversation.id,
      message,
    });
  };

  sendMessage = async (
    data: CreateMessageInput,
  ): Promise<SendMessageResult> => {
    const ownerId = this.assertOwnerId(data.ownerId);
    const message = this.assertMessage(data.message);

    if (!data.conversationId) {
      return this.createConversation({
        message,
        ownerId,
        projectId: data.projectId,
      });
    }

    // Ensures the conversation belongs to this user and is usable.
    const conversation = await this.chatRepo.getConversationOrFail({
      conversationId: data.conversationId,
      ownerId,
    });

    if (conversation.isArchived) {
      throw new Error("Cannot send messages to an archived conversation");
    }

    const historyPage = await this.chatRepo.getMessages({
      conversationId: conversation.id,
      limit: 20,
    });

    // Repo returns newest-first; the model needs chronological order.
    // DB rows type `sender` as `string` (varchar), so narrow it to the
    // `Sender` union at the boundary.
    const history: { sender: Sender; message: string }[] = [
      ...historyPage.items,
    ]
      .reverse()
      .map((item) => ({
        sender: this.toSender(item.sender),
        message: item.message,
      }));

    const userChat = await this.chatRepo.createMessage({
      conversationId: conversation.id,
      sender: "user",
      message,
    });

    try {
      const answer = await this.generateAnswer(message, history);

      const aiChat = await this.chatRepo.createMessage({
        conversationId: conversation.id,
        sender: "ai",
        message: answer,
      });

      return {
        conversation,
        userMessage: userChat,
        aiMessage: aiChat,
      };
    } catch (error) {
      console.log(error)
      // The user message remains persisted.
      // In a production app, mark this AI turn as failed or enqueue a retry.
      throw new Error("Failed to generate AI response", {
        cause: error,
      });
    }
  };

  getConversations = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
    includeArchived?: boolean;
    projectId?: number;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    return this.chatRepo.getConversations({
      ownerId,
      limit: data.limit ?? 20,
      cursor: data.cursor,
      includeArchived: data.includeArchived ?? false,
      projectId: data.projectId,
    });
  };

  getConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    return this.chatRepo.getConversationOrFail({
      conversationId: data.conversationId,
      ownerId,
    });
  };

  getMessages = async (data: PaginationInput) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    await this.chatRepo.getConversationOrFail({
      conversationId: data.conversationId,
      ownerId,
    });

    return this.chatRepo.getMessages({
      conversationId: data.conversationId,
      limit: Math.min(data.limit ?? 30, 100),
      cursor: data.cursor,
    });
  };

  renameConversation = async (data: {
    conversationId: number;
    ownerId: number;
    title: string;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);
    const title = this.assertMessage(data.title);

    return this.chatRepo.updateConversation({
      conversationId: data.conversationId,
      ownerId,
      title: title.slice(0, 120),
    });
  };

  archiveConversation = async (data: {
    conversationId: number;
    ownerId: number;
    isArchived: boolean;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    return this.chatRepo.updateConversation({
      conversationId: data.conversationId,
      ownerId,
      isArchived: data.isArchived,
    });
  };

  deleteConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    await this.chatRepo.deleteConversation({
      conversationId: data.conversationId,
      ownerId,
    });

    return { success: true };
  };

  deleteMessage = async (data: {
    chatId: number;
    ownerId: number;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);

    await this.chatRepo.deleteMessage({
      chatId: data.chatId,
      ownerId,
    });

    return { success: true };
  };

  editMessage = async (data: {
    chatId: number;
    ownerId: number;
    message: string;
  }) => {
    const ownerId = this.assertOwnerId(data.ownerId);
    const message = this.assertMessage(data.message);

    return this.chatRepo.updateMessage({
      chatId: data.chatId,
      ownerId,
      message,
    });
  };
}
