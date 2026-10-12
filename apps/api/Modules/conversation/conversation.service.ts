
import { conversationRepositaryClass } from "./conversation.repositary";

export class ConversationService {
  constructor(
    private readonly conversationRepository: conversationRepositaryClass,
  ) {}

  createConversation = async (data: {
    ownerId: number;
    title: string;
  }) => {
    const title = data.title.trim();

    if (!Number.isInteger(data.ownerId) || data.ownerId <= 0) {
      throw new Error("Invalid owner ID");
    }

    if (!title) {
      throw new Error("Conversation title cannot be empty");
    }

    return await this.conversationRepository.create({
      ownerId: data.ownerId,
      title,
    });
  };

  renameConversation = async (data: {
    conversationId: number;
    title: string;
  }) => {
    this.validateConversationId(data.conversationId);

    const title = data.title.trim();

    if (!title) {
      throw new Error("Conversation title cannot be empty");
    }

    const conversation = await this.conversationRepository.rename({
      conversationId: data.conversationId,
      title,
    });

    if (!conversation) {
      throw new Error(
        "Conversation not found or cannot be renamed",
      );
    }

    return conversation;
  };

  archiveConversation = async (conversationId: number) => {
    this.validateConversationId(conversationId);

    const conversation =
      await this.conversationRepository.archiveConversation(
        conversationId,
      );

    if (!conversation) {
      throw new Error(
        "Conversation not found or already archived",
      );
    }

    return conversation;
  };

  unarchiveConversation = async (conversationId: number) => {
    this.validateConversationId(conversationId);

    const conversation =
      await this.conversationRepository.unarchiveConversation(
        conversationId,
      );

    if (!conversation) {
      throw new Error(
        "Conversation not found or is not archived",
      );
    }

    return conversation;
  };

  deleteConversation = async (conversationId: number) => {
    this.validateConversationId(conversationId);

    const deletedConversation =
      await this.conversationRepository.deleteConversation(
        conversationId,
      );

    if (!deletedConversation) {
      throw new Error("Conversation not found");
    }

    return deletedConversation;
  };

  private validateConversationId = (conversationId: number) => {
    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      throw new Error("Invalid conversation ID");
    }
  };
}
