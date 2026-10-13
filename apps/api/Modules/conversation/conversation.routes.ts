import { Router } from "express";
import { requireAuth } from "@api/shared/auth";
import { ConversationController } from "./conversation.controllers";

const conversationRouter = Router();
const conversationController = new ConversationController();

conversationRouter.use(requireAuth);

conversationRouter.post("/", conversationController.createConversation);
conversationRouter.get("/", conversationController.listConversations);
conversationRouter.get(
  "/:conversationId",
  conversationController.getConversation,
);
conversationRouter.patch(
  "/:conversationId",
  conversationController.renameConversation,
);
conversationRouter.post(
  "/:conversationId/archive",
  conversationController.archiveConversation,
);
conversationRouter.post(
  "/:conversationId/unarchive",
  conversationController.unarchiveConversation,
);
conversationRouter.post(
  "/:conversationId/move",
  conversationController.moveConversation,
);
conversationRouter.delete(
  "/:conversationId",
  conversationController.deleteConversation,
);

export default conversationRouter;
