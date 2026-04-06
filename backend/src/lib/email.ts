import { env } from "../config/env";
import { AppError } from "../utils/app-error";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function formatFromAddress() {
  if (!env.EMAIL_FROM_ADDRESS) {
    return undefined;
  }

  return `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`;
}

async function sendWithResend(payload: EmailPayload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "topics-members-backend/1.0"
    },
    body: JSON.stringify({
      from: formatFromAddress(),
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {})
    })
  });

  if (!response.ok) {
    const responseText = await response.text();

    throw new AppError("Nao foi possivel enviar o e-mail transacional.", 502, {
      provider: "resend",
      status: response.status,
      response: responseText
    });
  }
}

function sendToConsole(payload: EmailPayload) {
  console.log("EMAIL DELIVERY [console]:", {
    to: payload.to,
    subject: payload.subject,
    text: payload.text
  });
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  if (env.EMAIL_PROVIDER === "resend") {
    await sendWithResend(payload);
    return;
  }

  sendToConsole(payload);
}
