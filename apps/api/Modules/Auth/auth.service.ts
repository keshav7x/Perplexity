
import { emailQueue } from "@api/BullMq/Email/email.queue";
import { authRepoClass } from "./auth.repositary";
import {
  generateVerificationId,
  hashVerificationToken,
  hashPassword,
} from "./auth.utils";

export class authServiceClass {
  constructor(
    private readonly authRepo = new authRepoClass(),
  ) {}

  create = async (data: {
    name: string;
    age: number;
    email: string;
    password: string;
  }) => {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");
    if (!data.password) throw new Error("Password is required");

    const userExist = await this.authRepo.userExist({ email });
    if (userExist) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(data.password);
    const emailVerifyToken = generateVerificationId();
    const tokenHash = await hashVerificationToken(emailVerifyToken);

    const user = await this.authRepo.create({
      name,
      age: data.age,
      email,
      password: hashedPassword,
      tokenHash,
    });

    if (!user) {
      throw new Error("Could not create user");
    }

    try {
      await emailQueue.add("verification", {
        email: user.email,
        token: emailVerifyToken,
      });

      return {
        success: true,
        status: "QUEUED" as const,
        message:
          "Registration successful. Your verification email is queued.",
      };
    } catch (error) {
      console.error("Failed to enqueue verification email:", error);

      return {
        success: true,
        status: "QUEUE_FAILED" as const,
        message:
          "Your account was created, but your verification email could not be queued. Please request another verification email.",
      };
    }
  };

  handleResendVerification = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error("Email is required");
    }

    const user = await this.authRepo.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error("No account found with this email");
    }

    if (user.emailVerified) {
      throw new Error(
        "This account is already verified. Please log in.",
      );
    }

    const newToken = generateVerificationId();
    const newTokenHash = await hashVerificationToken(newToken);

    await this.authRepo.updateVerficationToken(
      user.id,
      newTokenHash,
    );

    try {
      await emailQueue.add("verification", {
        email: user.email,
        token: newToken,
      });

      return {
        success: true,
        status: "QUEUED" as const,
        message: "Your verification email has been queued.",
      };
    } catch (error) {
      console.error("Failed to enqueue verification email:", error);

      return {
        success: true,
        status: "QUEUE_FAILED" as const,
        message:
          "Your verification email could not be queued. Please try again.",
      };
    }
  };

  verifyEmail = async (data: { token: string }) => {
    const tokenHash = hashVerificationToken(data.token);
    const user = await this.authRepo.findByVerificationToken(
      tokenHash,
    );

    if (!user) {
      throw new Error("Invalid verification token");
    }

    const expiresAt = user.token_expires_at;

    if (!expiresAt || expiresAt.getTime() <= Date.now()) {
      throw new Error("Verification link has expired.");
    }

    const verifiedUser = await this.authRepo.markAsVerified(
      user.id,
    );

    if (!verifiedUser) {
      throw new Error("Could not verify account");
    }

    return verifiedUser;
  };
}
