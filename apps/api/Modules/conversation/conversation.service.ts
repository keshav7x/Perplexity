import { conversationRepositaryClass } from "./conversation.repositary";
import { db } from "@api/Database";
import { projectsTable } from "@api/Database/schema";
import { and, eq } from "drizzle-orm";

export class ConversationService {
  constructor(
    private readonly conversationRepository: conversationRepositaryClass = new conversationRepositaryClass(
      db,
    ),
  ) {}

  createConversation = async (data: {
    ownerId: number;
    title: string;
    projectId?: number;
  }) => {
    const title = data.title.trim();

    if (!Number.isInteger(data.ownerId) || data.ownerId <= 0) {
      throw new Error("Unauthorized access");
    }

    if (!title) {
      throw new Error("Conversation title cannot be empty");
    }

    return await this.conversationRepository.create({
      ownerId: data.ownerId,
      title: title.slice(0, 120),
      projectId: data.projectId,
    });
  };

  getConversations = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
    includeArchived?: boolean;
    projectId?: number;
  }) => {
    this.validateOwnerId(data.ownerId);

    return await this.conversationRepository.list({
      ownerId: data.ownerId,
      limit: data.limit,
      cursor: data.cursor,
      includeArchived: data.includeArchived ?? false,
      projectId: data.projectId,
    });
  };

  getConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    const conversation = await this.conversationRepository.getById({
      conversationId: data.conversationId,
      ownerId: data.ownerId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  };

  renameConversation = async (data: {
    conversationId: number;
    ownerId: number;
    title: string;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    const title = data.title.trim();

    if (!title) {
      throw new Error("Conversation title cannot be empty");
    }

    const conversation = await this.conversationRepository.rename({
      conversationId: data.conversationId,
      ownerId: data.ownerId,
      title: title.slice(0, 120),
    });

    if (!conversation) {
      throw new Error("Conversation not found or cannot be renamed");
    }

    return conversation;
  };

  archiveConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    const conversation =
      await this.conversationRepository.archiveConversation({
        conversationId: data.conversationId,
        ownerId: data.ownerId,
      });

    if (!conversation) {
      throw new Error("Conversation not found or already archived");
    }

    return conversation;
  };

  unarchiveConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    const conversation =
      await this.conversationRepository.unarchiveConversation({
        conversationId: data.conversationId,
        ownerId: data.ownerId,
      });

    if (!conversation) {
      throw new Error("Conversation not found or is not archived");
    }

    return conversation;
  };

  deleteConversation = async (data: {
    conversationId: number;
    ownerId: number;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    const deletedConversation =
      await this.conversationRepository.deleteConversation({
        conversationId: data.conversationId,
        ownerId: data.ownerId,
      });

    if (!deletedConversation) {
      throw new Error("Conversation not found");
    }

    return deletedConversation;
  };

  moveConversation = async (data: {
    conversationId: number;
    ownerId: number;
    projectId: number | null;
  }) => {
    this.validateConversationId(data.conversationId);
    this.validateOwnerId(data.ownerId);

    if (data.projectId !== null) {
      if (!Number.isInteger(data.projectId) || data.projectId <= 0) {
        throw new Error("Invalid project ID");
      }
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, data.projectId),
            eq(projectsTable.ownerId, data.ownerId),
          ),
        )
        .limit(1);
      if (!project) {
        throw new Error("Project not found");
      }
    }

    const conversation = await this.conversationRepository.setProject({
      conversationId: data.conversationId,
      ownerId: data.ownerId,
      projectId: data.projectId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  };

  private validateOwnerId = (ownerId: number) => {
    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      throw new Error("Unauthorized access");
    }
  };

  private validateConversationId = (conversationId: number) => {
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw new Error("Invalid conversation ID");
    }
  };
}
