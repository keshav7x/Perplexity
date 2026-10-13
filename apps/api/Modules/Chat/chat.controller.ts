import type { Response } from "express";
import { ApiResponse } from "@api/shared/Response";
import { asyncHandler } from "@api/shared/asyncHandler";
import type { AuthRequest } from "@api/shared/auth";
import { chatServiceClass } from "./chat.service";
import {
  chatIdParamSchema,
  conversationIdParamSchema,
  editMessageSchema,
  messageListQuerySchema,
  sendMessageSchema,
} from "./chat.utils";

export class chatControllerClass {
  constructor(
    private readonly chatService = new chatServiceClass(),
  ) {}

  /**
   * POST /api/v1/chat
   * Sends a message. Omitting `conversationId` starts a new conversation
   * (title is auto-generated from the first message).
   */
  send = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = sendMessageSchema.parse(req.body);

    const result = await this.chatService.sendMessage({
      ownerId: req.user.id,
      message: body.message,
      conversationId: body.conversationId,
      projectId: body.projectId,
    });

    return ApiResponse.success(res, 201, "Message sent", result);
  });

  /** GET /api/v1/chat/:conversationId/messages */
  listMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = conversationIdParamSchema.parse(req.params);
    const query = messageListQuerySchema.parse(req.query);

    const result = await this.chatService.getMessages({
      ownerId: req.user.id,
      conversationId: params.conversationId,
      limit: query.limit,
      cursor: query.cursor,
    });

    return ApiResponse.success(res, 200, "Messages fetched", result);
  });

  /** PATCH /api/v1/chat/messages/:chatId */
  editMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = chatIdParamSchema.parse(req.params);
    const body = editMessageSchema.parse(req.body);

    const message = await this.chatService.editMessage({
      chatId: params.chatId,
      ownerId: req.user.id,
      message: body.message,
    });

    return ApiResponse.success(res, 200, "Message updated", message);
  });

  /** DELETE /api/v1/chat/messages/:chatId */
  deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = chatIdParamSchema.parse(req.params);

    const result = await this.chatService.deleteMessage({
      chatId: params.chatId,
      ownerId: req.user.id,
    });

    return ApiResponse.success(res, 200, "Message deleted", result);
  });
}
