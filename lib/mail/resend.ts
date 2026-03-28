import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(message: EmailMessage) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  return resend.emails.send({
    from: "Golf Charity <no-reply@golfcharity.app>",
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
}
