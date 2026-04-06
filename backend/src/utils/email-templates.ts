function wrapEmailHtml(content: string) {
  return `
    <div style="margin:0;padding:32px;background:#09090b;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f4f4f5;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.09);border-radius:24px;padding:32px;background:linear-gradient(180deg,#17171b 0%,#0f1013 100%);box-shadow:0 24px 80px rgba(0,0,0,0.35);">
        <div style="margin-bottom:20px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#a1a1aa;">
          TOPICS Pay
        </div>
        ${content}
      </div>
    </div>
  `;
}

export function buildVerificationEmail(params: {
  name: string;
  code: string;
  expiresInMinutes: number;
}) {
  const subject = "Confirme sua conta na TOPICS Pay";
  const text =
    `Ola, ${params.name}.\n\n` +
    `Seu codigo de confirmacao e ${params.code}.\n` +
    `Ele expira em ${params.expiresInMinutes} minutos.\n\n` +
    "Se voce nao criou esta conta, ignore esta mensagem.";

  const html = wrapEmailHtml(`
    <h1 style="margin:0 0 14px;font-size:32px;line-height:1.08;font-weight:600;color:#ffffff;">Confirme sua conta</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#c9c9d1;">
      Ola, ${params.name}. Use o codigo abaixo para concluir seu acesso na TOPICS Pay.
    </p>
    <div style="margin:0 0 24px;padding:18px 22px;border-radius:18px;background:#0b0b0d;border:1px solid rgba(255,255,255,0.08);text-align:center;">
      <span style="display:block;font-size:34px;letter-spacing:0.35em;font-weight:700;color:#ff8ba8;">${params.code}</span>
    </div>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#b3b3bc;">
      Este codigo expira em ${params.expiresInMinutes} minutos.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:#7c7d86;">
      Se voce nao criou esta conta, pode ignorar este e-mail com seguranca.
    </p>
  `);

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
  const subject = "Redefina sua senha na TOPICS Pay";
  const text =
    `Ola, ${params.name}.\n\n` +
    `Recebemos um pedido para redefinir sua senha.\n` +
    `Abra este link: ${params.resetUrl}\n` +
    `Ele expira em ${params.expiresInMinutes} minutos.\n\n` +
    "Se voce nao solicitou a redefinicao, ignore esta mensagem.";

  const html = wrapEmailHtml(`
    <h1 style="margin:0 0 14px;font-size:32px;line-height:1.08;font-weight:600;color:#ffffff;">Redefina sua senha</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#c9c9d1;">
      Ola, ${params.name}. Recebemos uma solicitacao para redefinir sua senha na TOPICS Pay.
    </p>
    <div style="margin:0 0 24px;">
      <a href="${params.resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ff7c9a;color:#09090b;text-decoration:none;font-weight:700;">
        Redefinir senha
      </a>
    </div>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#b3b3bc;">
      Este link expira em ${params.expiresInMinutes} minutos.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:#7c7d86;">
      Se voce nao solicitou a redefinicao, ignore este e-mail com seguranca.
    </p>
  `);

  return {
    subject,
    text,
    html
  };
}
