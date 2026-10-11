
import { Router } from "express";
import { authControllerClass } from "./auth.controller";

const authRouter = Router();
const authController = new authControllerClass();

authRouter.post("/register", authController.create);

authRouter.post(
  "/resend-verification",
  authController.resendVerification,
);

authRouter.get(
  "/verify/:token",
  authController.verifyEmail,
);

export default authRouter;
