
import type { Request, Response } from "express";
import { ApiResponse } from "@api/shared/Response";
import { asyncHandler } from "@api/shared/asyncHandler";
import type { AuthRequest } from "@api/shared/auth";
import { getCookie } from "@api/shared/cookies";
import { authServiceClass } from "./auth.service";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  loginSchema,
} from "./auth.utils";

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


  login = asyncHandler(async (req: Request, res: Response) => {
    // Repeat login: reuse the JWT already stored in cookies if still valid.
    const cookieToken = getCookie(req, AUTH_COOKIE_NAME);

    if (cookieToken) {
      try {
        const session =
          await this.authService.loginWithCookieToken(cookieToken);
        return ApiResponse.success(res, 200, "Already logged in", session);
      } catch {
        // Invalid/expired cookie — fall through to credential login.
      }
    }

    const body = loginSchema.parse(req.body);
    const result = await this.authService.login(body);

    res.cookie(AUTH_COOKIE_NAME, result.token, authCookieOptions());

    return ApiResponse.success(res, 200, "Login successful", {
      user: result.user,
    });
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    return ApiResponse.success(res, 200, "Logged out", { success: true });
  });

  me = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await this.authService.getMe(req.user.id);
    return ApiResponse.success(res, 200, "User fetched", user);
  });

  verifyEmail = asyncHandler(
    async (req: Request, res: Response) => {
      const { token } = req.params;

      if (!token) {
        return ApiResponse.error(res, 400, "Verification token is required");
      }

      const user = await this.authService.verifyEmail({ token });

      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Email Verified</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background: #f8fafc;
                display: grid;
                place-items: center;
                min-height: 100vh;
                margin: 0;
              }

              .card {
                background: white;
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
              }

              h1 { color: #16a34a; }
              p { color: #475569; line-height: 1.6; }
            </style>
          </head>
          <body>
            <main class="card">
              <h1>Email verified!</h1>
              <p>Your email address has been verified successfully.</p>
              <p>You can now return to the application and log in.</p>
            </main>
          </body>
        </html>
      `);
    },
  );

}
