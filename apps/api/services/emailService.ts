import { envConfig } from "@api/Config/env.config";
import { Resend } from "resend";

const resend = new Resend(envConfig.RESEND_API_KEY!);

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  from = "Perplexity <onboarding@resend.dev>",
}: SendEmailInput) => {
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
};