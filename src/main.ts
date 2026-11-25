import { emailFollowUp } from "./report_service.js";

const recipient = process.env.DEMO_EMAIL_TO;
if (!recipient) throw new Error("DEMO_EMAIL_TO is required");

const result = await emailFollowUp({
  matterId: "MAT-1042",
  recipient,
  clientName: "Northstar Legal",
  signedDocumentDelivered: true,
  deadline: "2026-10-26"
}, new Date("2026-10-24T09:00:00Z"));

console.log(result ? `sent report ${result.message_id}` : "follow-up not required");
