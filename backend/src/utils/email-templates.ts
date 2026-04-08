import { env } from "../config/env";

const BRAND_NAME = "TOPICS Pay";
const BRAND_LOGO_URL =
  "https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775186081/TOPICS_Pay_imxu18.png";

function getSupportEmail() {
  return env.EMAIL_REPLY_TO ?? env.EMAIL_FROM_ADDRESS ?? "suporte@topicspay.com";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCodeDigits(code: string) {
  return code
    .split("")
    .map((digit) => `<span style="display:inline-block;margin:0 6px;">${escapeHtml(digit)}</span>`)
    .join("");
}

function wrapEmailHtml(params: {
  preheader: string;
  eyebrow: string;
  title: string;
  introHtml: string;
  highlightHtml: string;
  helperHtml: string;
  footerHtml: string;
}) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f1eb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(params.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:
      radial-gradient(circle at top, rgba(194,129,64,0.18), transparent 28%),
      linear-gradient(180deg, #f6f3ee 0%, #efe8dc 100%);
      background-color:#f4f1eb;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width:620px;border-collapse:collapse;background:#ffffff;border:1px solid #e9dfd1;border-radius:28px;overflow:hidden;box-shadow:0 28px 90px rgba(24,20,14,0.12);"
          >
            <tr>
              <td style="padding:28px 32px 0;background:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <img
                        src="${BRAND_LOGO_URL}"
                        alt="${BRAND_NAME}"
                        width="132"
                        style="display:block;width:132px;max-width:100%;height:auto;border:0;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse:collapse;border-radius:24px;overflow:hidden;background:
                    radial-gradient(circle at top left, rgba(255,196,112,0.16), transparent 26%),
                    linear-gradient(180deg, #181410 0%, #090909 100%);"
                >
                  <tr>
                    <td style="padding:20px 24px 0;">
                      <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#d0a86a;">
                        ${escapeHtml(params.eyebrow)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 24px 28px;">
                      <div style="font-family:Arial,sans-serif;font-size:34px;line-height:1.06;font-weight:800;color:#ffffff;">
                        ${escapeHtml(params.title)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.8;color:#2d241c;">
                  ${params.introHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px;">
                ${params.highlightHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#5c5147;">
                  ${params.helperHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 12px;">
                <div
                  style="padding:18px 20px;border-radius:20px;background:#f7f2eb;border:1px solid #eee2d1;font-family:Arial,sans-serif;font-size:13px;line-height:1.75;color:#6d6155;"
                >
                  ${params.footerHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <div style="border-top:1px solid #efe5d7;padding-top:16px;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#8c7f70;text-align:center;">
                  ${BRAND_NAME} • Experiencia premium para pagamentos, membros e produtos digitais
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export function buildVerificationEmail(params: {
  name: string;
  code: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(params.name);
  const supportEmail = getSupportEmail();
  const subject = "Seu codigo de verificacao da TOPICS Pay";
  const text =
    `Ola, ${params.name}.\n\n` +
    `Use o codigo ${params.code} para confirmar sua conta na TOPICS Pay.\n` +
    `Ele expira em ${params.expiresInMinutes} minutos.\n\n` +
    "Por seguranca, nao compartilhe este codigo com ninguem.\n" +
    `Se voce nao solicitou este acesso, ignore este e-mail ou fale com ${supportEmail}.`;

  const html = wrapEmailHtml({
    preheader: `Use o codigo ${params.code} para confirmar sua conta na TOPICS Pay.`,
    eyebrow: "Codigo de verificacao",
    title: "Confirme seu acesso",
    introHtml: `
      <p style="margin:0 0 14px;"><strong style="font-size:20px;color:#17120d;">Ola, ${safeName}!</strong></p>
      <p style="margin:0;">
        Use o codigo abaixo para concluir a confirmacao do seu e-mail e liberar o acesso completo a sua conta na TOPICS Pay.
      </p>
    `,
    highlightHtml: `
      <div style="padding:24px 18px;border-radius:22px;background:#f5efe6;border:1px solid #eadbc8;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#9b7f56;margin-bottom:14px;">
          Seu codigo
        </div>
        <div style="font-family:Arial,sans-serif;font-size:44px;line-height:1.1;font-weight:800;color:#0e0b09;letter-spacing:0.14em;">
          ${buildCodeDigits(params.code)}
        </div>
      </div>
    `,
    helperHtml: `
      <p style="margin:0 0 12px;">
        Este codigo expira em <strong style="color:#201810;">${params.expiresInMinutes} minutos</strong>.
      </p>
      <p style="margin:0;color:#d14b31;font-weight:700;">
        Por seguranca, nao compartilhe este codigo com ninguem.
      </p>
    `,
    footerHtml: `
      <p style="margin:0 0 10px;">
        Se voce nao solicitou esta verificacao, ignore esta mensagem.
      </p>
      <p style="margin:0;">
        Precisa de ajuda? Fale com nosso time em
        <a href="mailto:${supportEmail}" style="color:#8b5e1a;font-weight:700;text-decoration:none;">${supportEmail}</a>.
      </p>
    `
  });

  return {
    subject,
    text,
    html
  };
}

export function buildPasswordResetEmail(params: {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(params.name);
  const safeResetUrl = escapeHtml(params.resetUrl);
  const supportEmail = getSupportEmail();
  const subject = "Redefina sua senha da TOPICS Pay";
  const text =
    `Ola, ${params.name}.\n\n` +
    `Recebemos um pedido para redefinir sua senha.\n` +
    `Abra este link: ${params.resetUrl}\n` +
    `Ele expira em ${params.expiresInMinutes} minutos.\n\n` +
    "Se voce nao solicitou esta alteracao, ignore esta mensagem.";

  const html = wrapEmailHtml({
    preheader: "Abra o link para redefinir sua senha na TOPICS Pay.",
    eyebrow: "Recuperacao de senha",
    title: "Redefina sua senha",
    introHtml: `
      <p style="margin:0 0 14px;"><strong style="font-size:20px;color:#17120d;">Ola, ${safeName}!</strong></p>
      <p style="margin:0;">
        Recebemos uma solicitacao para redefinir a senha da sua conta. Para continuar, use o botao abaixo.
      </p>
    `,
    highlightHtml: `
      <div style="text-align:center;">
        <a
          href="${safeResetUrl}"
          style="display:inline-block;padding:16px 28px;border-radius:999px;background:linear-gradient(180deg,#d8a15a 0%,#b57b34 100%);color:#120e09;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:800;"
        >
          Redefinir senha
        </a>
      </div>
    `,
    helperHtml: `
      <p style="margin:0 0 12px;">
        Este link expira em <strong style="color:#201810;">${params.expiresInMinutes} minutos</strong>.
      </p>
      <p style="margin:0;">
        Se o botao nao funcionar, copie e cole este link no navegador:
      </p>
      <p style="margin:8px 0 0;word-break:break-all;color:#8b5e1a;">
        ${safeResetUrl}
      </p>
    `,
    footerHtml: `
      <p style="margin:0 0 10px;">
        Se voce nao pediu a redefinicao da senha, ignore este e-mail com seguranca.
      </p>
      <p style="margin:0;">
        Precisa de ajuda? Fale com nosso time em
        <a href="mailto:${supportEmail}" style="color:#8b5e1a;font-weight:700;text-decoration:none;">${supportEmail}</a>.
      </p>
    `
  });

  return {
    subject,
    text,
    html
  };
}
