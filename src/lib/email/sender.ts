import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL ?? "AlgoriOffice <noreply@algorivia.com>";

export interface SendEmailOptions {
  to:           string | string[];
  subject:      string;
  react:        React.ReactElement;
  attachments?: { filename: string; content: string }[];
}

export async function sendEmail(opts: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from:        FROM,
    to:          Array.isArray(opts.to) ? opts.to : [opts.to],
    subject:     opts.subject,
    react:       opts.react,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content:  Buffer.from(a.content, "base64"),
    })),
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}
