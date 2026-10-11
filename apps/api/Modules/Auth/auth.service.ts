import { envConfig } from "@api/Config/env.config";
import { sendEmail } from "@api/services/emailService";
import { authRepoClass } from "./auth.repositary";
import { generateVerificationId, hash, hashPassword } from "./auth.utils";

export class authServiceClass {
  constructor(
    private readonly authRepo = new authRepoClass(),
  ) {}

  private sendVerificationEmail = async (
    email: string,
    token: string,
  ) => {
    const verificationLink =
      `${envConfig.BASE_URL}/api/verify/${encodeURIComponent(token)}`;

    await sendEmail({
      to: email,
      subject: "Verify your account",
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to verify your account.</p>
        <a href="${verificationLink}">Verify email</a>
      `,
    });
  };

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
    const tokenHash = await hash(emailVerifyToken);

    const user = await this.authRepo.create({
      name,
      age: data.age,
      email,
      password: hashedPassword,
      tokenHash,
    });

    if(!user) throw new Error("Could not create user")
    try {
      await this.sendVerificationEmail(user.email, emailVerifyToken);

      return {
        success: true,
        status: "READY" as const,
        message: "Registration successful. Check your inbox.",
      };
    } catch (error) {
      console.error("Verification email delivery failed:", error);

      return {
        success: true,
        status: "EMAIL_FAILED" as const,
        message:
          "Your account was created, but the verification email could not be sent. Please resend the verification email.",
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
      throw new Error("This account is already verified. Please log in.");
    }

    const newEmailVerifyToken = generateVerificationId();
    const newTokenHash = await hash(newEmailVerifyToken);

    await this.authRepo.updateVerficationToken(
      user.id,
      newTokenHash,
    );

    try {
      await this.sendVerificationEmail(
        user.email,
        newEmailVerifyToken,
      );

      return {
        success: true,
        status: "READY" as const,
        message: "Verification email sent successfully.",
      };
    } catch (error) {
      console.error("Verification email resend failed:", error);

      return {
        success: true,
        status: "EMAIL_FAILED" as const,
        message:
          "The verification email could not be sent. Please try again.",
      };
    }
  };
}
