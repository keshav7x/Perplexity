import { Router } from "express";
import { requireAuth } from "@api/shared/auth";
import { chatControllerClass } from "./chat.controller";

const chatRouter = Router();
const chatController = new chatControllerClass();

chatRouter.use(requireAuth);

chatRouter.post("/", chatController.send);
chatRouter.get("/:conversationId/messages", chatController.listMessages);
chatRouter.patch("/messages/:chatId", chatController.editMessage);
chatRouter.delete("/messages/:chatId", chatController.deleteMessage);

export default chatRouter;
