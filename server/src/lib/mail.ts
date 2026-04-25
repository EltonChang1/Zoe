import nodemailer from "nodemailer";

import { env } from "../env.js";
import { logger } from "../logger.js";

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends transactional email when SMTP is configured; otherwise logs the
 * payload (development) or warns (production).
 */
export async function sendTransactionalMail(input: SendMailInput): Promise<void> {
  const from = env.MAIL_FROM;
  if (!from) {
    logger.warn(
      { to: input.to, subject: input.subject },
      "MAIL_FROM not set — skipping email send",
    );
    return;
  }

  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "development") {
      logger.info(
        {
          to: input.to,
          subject: input.subject,
          text: input.text.slice(0, 2000),
        },
        "mail (no SMTP_HOST — console only)",
      );
      return;
    }
    logger.error(
      { to: input.to, subject: input.subject },
      "SMTP_HOST not set in production — email not sent",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
