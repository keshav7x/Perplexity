
import type { Request, Response } from "express";
import { ApiResponse } from "@api/shared/Response";
import { asyncHandler } from "@api/shared/asyncHandler";
import { authServiceClass } from "./auth.service";

export class authControllerClass {
  constructor(
    private readonly authService = new authServiceClass(),
  ) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.create(req.body);

    return ApiResponse.success(
      res,
      201,
      result.message,
      {
        status: result.status,
      },
    );
  });

  resendVerification = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.body;

      const result =
        await this.authService.handleResendVerification(email);

      return ApiResponse.success(
        res,
        200,
        result.message,
        {
          status: result.status,
        },
      );
    },
  );

  verifyEmail = asyncHandler(
    async (req: Request, res: Response) => {
      const { token } = req.params;

      //@ts-ignore  
      const user = await this.authService.verifyEmail({ token });

      return ApiResponse.success(
        res,
        200,
        "Email verified successfully.",
        {
          id: user.id,
          email: user.email,
          emailVerified: true,
        },
      );
    },
  );
}
