import type { Response } from "express";
import { ApiResponse } from "@api/shared/Response";
import { asyncHandler } from "@api/shared/asyncHandler";
import type { AuthRequest } from "@api/shared/auth";
import { ConversationService } from "./conversation.service";
import {
  conversationIdParamSchema,
  conversationListQuerySchema,
  createConversationSchema,
  moveConversationSchema,
  renameConversationSchema,
} from "./conversation.validation";

export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService = new ConversationService(),
  ) {}

  createConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const body = createConversationSchema.parse(req.body);

      const conversation =
        await this.conversationService.createConversation({
          ownerId: req.user.id,
          title: body.title,
          projectId: body.projectId,
        });

      return ApiResponse.success(
        res,
        201,
        "Conversation created successfully",
        conversation,
      );
    },
  );

  listConversations = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const query = conversationListQuerySchema.parse(req.query);

      const result = await this.conversationService.getConversations({
        ownerId: req.user.id,
        limit: query.limit,
        cursor: query.cursor,
        includeArchived: query.includeArchived,
        projectId: query.projectId,
      });

      return ApiResponse.success(
        res,
        200,
        "Conversations fetched successfully",
        result,
      );
    },
  );

  getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = conversationIdParamSchema.parse(req.params);

    const conversation = await this.conversationService.getConversation({
      conversationId: params.conversationId,
      ownerId: req.user.id,
    });

    return ApiResponse.success(
      res,
      200,
      "Conversation fetched successfully",
      conversation,
    );
  });

  renameConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = conversationIdParamSchema.parse(req.params);
      const body = renameConversationSchema.parse(req.body);

      const conversation =
        await this.conversationService.renameConversation({
          conversationId: params.conversationId,
          ownerId: req.user.id,
          title: body.title,
        });

      return ApiResponse.success(
        res,
        200,
        "Conversation renamed successfully",
        conversation,
      );
    },
  );

  archiveConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = conversationIdParamSchema.parse(req.params);

      const conversation =
        await this.conversationService.archiveConversation({
          conversationId: params.conversationId,
          ownerId: req.user.id,
        });

      return ApiResponse.success(
        res,
        200,
        "Conversation archived successfully",
        conversation,
      );
    },
  );

  unarchiveConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = conversationIdParamSchema.parse(req.params);

      const conversation =
        await this.conversationService.unarchiveConversation({
          conversationId: params.conversationId,
          ownerId: req.user.id,
        });

      return ApiResponse.success(
        res,
        200,
        "Conversation unarchived successfully",
        conversation,
      );
    },
  );

  moveConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = conversationIdParamSchema.parse(req.params);
      const body = moveConversationSchema.parse(req.body);

      const conversation = await this.conversationService.moveConversation(
        {
          conversationId: params.conversationId,
          ownerId: req.user.id,
          projectId: body.projectId,
        },
      );

      return ApiResponse.success(
        res,
        200,
        "Conversation moved successfully",
        conversation,
      );
    },
  );

  deleteConversation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = conversationIdParamSchema.parse(req.params);

      const deletedConversation =
        await this.conversationService.deleteConversation({
          conversationId: params.conversationId,
          ownerId: req.user.id,
        });

      return ApiResponse.success(
        res,
        200,
        "Conversation deleted successfully",
        deletedConversation,
      );
    },
  );
}
