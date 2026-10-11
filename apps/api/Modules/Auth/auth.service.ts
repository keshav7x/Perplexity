import { db } from "@api/Database";
import { authRepoClass } from "./auth.repositary";
import { generateVerificationId, hashPassword } from "./auth.utils";
import { envConfig } from "@api/Config/env.config";
import { sendEmail } from "@api/services/emailService";


export class authServiceClass{
  constructor(private readonly authRepo = new authRepoClass) { }

  create = async (data:{
      name: string,
      age: number,
      email: string,
      password:string
  }) => {
    if (!data.name) throw new Error("Name is required")
    if (!data.email) throw new Error("Email is required")
    if (!data.password) throw new Error("password is required")
    const userExist = await this.authRepo.userExist({
      email:data.email
    })
    if (userExist) throw new Error("User Already Exist exist")

    const hashedPassword=await hashPassword(data.password)
    if (!hashedPassword) throw new Error("Password not hashed some error ocuured")
    const emailVerifyToken = generateVerificationId()
    if (!emailVerifyToken) throw new Error("Email verifcation token can't created")

    const user= await this.authRepo.create({
      name: data.name,
      age: data.age,
      email: data.email,
      password: hashedPassword,
      tokenHash:await hashPassword(emailVerifyToken)
    })
    const verificationLink = `${envConfig.BASE_URL}/api/verify/${emailVerifyToken}`;

    try {
      await sendEmail({
        to: user?.email!,
        subject: "Verify your Perplexity account",
        html: `
        <h2>Verify your email</h2>
           <p>Click the link below to verify your account.</p>
           <a href=${verificationLink}>
             Verify email
           </a>
        `
      })
      

      return { success: true, status: "READY", message: "Registered! Check your inbox." };
    } catch (emailError) {
      console.error("Email server is down during registration:", emailError);

      return {
        success: true,
        status: "EMAIL_FAILED",
        message: "Account created, but our email server is down. Please click 'Resend Verification Link'."
      };
    }
    return user
  }
}
