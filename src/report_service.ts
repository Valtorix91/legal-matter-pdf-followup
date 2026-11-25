import { z } from "zod";
import { infrai, type EmailResult } from "./infrai.js";

export const matterIntake = z.object({
  matterId: z.string().min(1),
  recipient: z.string().email(),
  clientName: z.string().min(1),
  signedDocumentDelivered: z.boolean(),
  deadline: z.coerce.date()
});

export type MatterIntake = z.infer<typeof matterIntake>;

export function shouldFollowUp(matter: MatterIntake, now: Date): boolean {
  const daysUntilDeadline = (matter.deadline.getTime() - now.getTime()) / 86_400_000;
  return matter.signedDocumentDelivered && daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
}

function makePdf(matter: MatterIntake): Buffer {
  const lines = [
    "LEGAL MATTER FOLLOW-UP REPORT",
    `Matter: ${matter.matterId}`,
    `Client: ${matter.clientName}`,
    `Signed document delivered: ${matter.signedDocumentDelivered ? "yes" : "no"}`,
    `Deadline: ${matter.deadline.toISOString().slice(0, 10)}`
  ];
  return Buffer.from(`%PDF-1.4\n${lines.join("\n")}\n%%EOF\n`, "utf8");
}

export async function emailFollowUp(input: unknown, now: Date): Promise<EmailResult | null> {
  const matter = matterIntake.parse(input);
  if (!shouldFollowUp(matter, now)) return null;
  const pdf = makePdf(matter);
  const body = [
    `Matter ${matter.matterId} needs legal follow-up before ${matter.deadline.toISOString().slice(0, 10)}.`,
    "",
    "Generated PDF report:",
    pdf.toString("base64")
  ].join("\n");
  return infrai.email.send({
    to: matter.recipient,
    subject: `Deadline follow-up: ${matter.matterId}`,
    body
  }, `matter-follow-up:${matter.matterId}`);
}
