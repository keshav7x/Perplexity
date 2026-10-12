
import type { Request, Response } from "express";
import { ConversationService } from "./conversation.service";

export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
  ) {}

  createConversation = async (req: Request, res: Response) => {
    const ownerId = (req as any).user.id

    const conversation =
      await this.conversationService.createConversation({
        ownerId,
        title: req.body.title,
      });

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  };

  renameConversation = async (req: Request, res: Response) => {
    const conversationId = Number(req.params.conversationId);

    const conversation =
      await this.conversationService.renameConversation({
        conversationId,
        title: req.body.title,
      });

    return res.status(200).json({
      success: true,
      message: "Conversation renamed successfully",
      data: conversation,
    });
  };

  archiveConversation = async (req: Request, res: Response) => {
    const conversationId = Number(req.params.conversationId);

    const conversation =
      await this.conversationService.archiveConversation(
        conversationId,
      );

    return res.status(200).json({
      success: true,
      message: "Conversation archived successfully",
      data: conversation,
    });
  };

  unarchiveConversation = async (req: Request, res: Response) => {
    const conversationId = Number(req.params.conversationId);

    const conversation =
      await this.conversationService.unarchiveConversation(
        conversationId,
      );

    return res.status(200).json({
      success: true,
      message: "Conversation unarchived successfully",
      data: conversation,
    });
  };

  deleteConversation = async (req: Request, res: Response) => {
    const conversationId = Number(req.params.conversationId);

    const deletedConversation =
      await this.conversationService.deleteConversation(
        conversationId,
      );

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      data: deletedConversation,
    });
  };
}
