import { sendEmail } from "@api/services/emailService";

export const sendVerifyEmail = async (data: {
  verificationLink: string,
  email:string
}) => {
  const {verificationLink,email}={...data}
  await sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light" />
          <title>Verify your email</title>
        </head>

        <body style="
          margin: 0;
          padding: 0;
          background-color: #f5f7fb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
            Roboto, Helvetica, Arial, sans-serif;
          color: #09090b;
          -webkit-font-smoothing: antialiased;
        ">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background-color: #f5f7fb;"
          >
            <tr>
              <td align="center" style="padding: 56px 16px;">

                <!-- Main card -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    max-width: 480px;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    overflow: hidden;
                  "
                >
                  <!-- Blue accent -->
                  <tr>
                    <td style="
                      height: 3px;
                      background: linear-gradient(
                        90deg,
                        #2563eb 0%,
                        #6366f1 55%,
                        #8b5cf6 100%
                      );
                      font-size: 0;
                      line-height: 3px;
                    ">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding: 36px 36px 32px;">

                      <!-- Brand -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          <td
                            width="32"
                            height="32"
                            align="center"
                            valign="middle"
                            style="
                              width: 32px;
                              height: 32px;
                              border-radius: 9px;
                              background-color: #2563eb;
                              color: #ffffff;
                              font-size: 18px;
                              font-weight: 800;
                            "
                          >P</td>

                          <td style="
                            padding-left: 10px;
                            font-size: 16px;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                            color: #09090b;
                          ">
                            Perplexity
                          </td>
                        </tr>
                      </table>

                      <!-- Heading -->
                      <p style="
                        margin: 38px 0 12px;
                        color: #2563eb;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 1.8px;
                        text-transform: uppercase;
                      ">
                        ONE QUICK STEP
                      </p>

                      <h1 style="
                        margin: 0;
                        color: #09090b;
                        font-size: 30px;
                        line-height: 1.2;
                        letter-spacing: -1.2px;
                        font-weight: 750;
                      ">
                        Verify your<br />
                        email address.
                      </h1>

                      <p style="
                        margin: 20px 0 0;
                        color: #52525b;
                        font-size: 14px;
                        line-height: 1.8;
                      ">
                        You're almost there. Confirm your email address
                        to activate your account and get started.
                      </p>

                      <!-- CTA -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin-top: 30px;"
                      >
                        <tr>
                          <td
                            align="center"
                            bgcolor="#2563eb"
                            style="
                              border-radius: 8px;
                              background-color: #2563eb;
                            "
                          >
                            <a
                              href="${verificationLink}"
                              target="_blank"
                              style="
                                display: inline-block;
                                padding: 14px 24px;
                                color: #ffffff;
                                font-size: 14px;
                                font-weight: 600;
                                line-height: 20px;
                                text-decoration: none;
                                border-radius: 8px;
                              "
                            >
                              Verify email address &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Expiration notice -->
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                          margin-top: 28px;
                          background-color: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 8px;
                        "
                      >
                        <tr>
                          <td style="
                            padding: 13px 14px;
                            color: #64748b;
                            font-size: 12px;
                            line-height: 1.7;
                          ">
                            <strong style="color: #334155;">
                              &#9201; Link expires in 15 minutes
                            </strong>
                            <br />
                            For your security, this verification link
                            can only be used for a limited time.
                          </td>
                        </tr>
                      </table>

                      <!-- Fallback URL -->
                      <p style="
                        margin: 26px 0 8px;
                        color: #71717a;
                        font-size: 12px;
                        line-height: 1.7;
                      ">
                        Button not working? Copy and paste this URL
                        into your browser:
                      </p>

                      <p style="
                        margin: 0;
                        overflow-wrap: anywhere;
                        word-break: break-word;
                        font-size: 12px;
                        line-height: 1.7;
                      ">
                        <a
                          href="${verificationLink}"
                          target="_blank"
                          style="
                            color: #2563eb;
                            text-decoration: underline;
                          "
                        >${verificationLink}</a>
                      </p>

                      <hr style="
                        margin: 30px 0 20px;
                        border: 0;
                        border-top: 1px solid #e5e7eb;
                      " />

                      <p style="
                        margin: 0;
                        color: #71717a;
                        font-size: 12px;
                        line-height: 1.8;
                      ">
                        If you didn't create an account, you can safely
                        ignore this email. No action is required.
                      </p>

                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="max-width: 480px;"
                >
                  <tr>
                    <td align="center" style="padding: 24px 12px;">
                      <p style="
                        margin: 0;
                        color: #a1a1aa;
                        font-size: 11px;
                        line-height: 1.8;
                      ">
                        Sent with care by Perplexity<br />
                        Secure account verification
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
