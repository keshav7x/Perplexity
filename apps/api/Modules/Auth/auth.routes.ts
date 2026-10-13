
import { Router } from "express";
import { requireAuth } from "@api/shared/auth";
import { authControllerClass } from "./auth.controller";

const authRouter = Router();
const authController = new authControllerClass();

authRouter.post("/register", authController.create);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);

authRouter.post(
  "/resend-verification",
  authController.resendVerification,
);

authRouter.get(
  "/verify/:token",
  authController.verifyEmail,
);

authRouter.get("/me", requireAuth, authController.me);

export default authRouter;
