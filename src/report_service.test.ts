import assert from "node:assert/strict";
import { shouldFollowUp, matterIntake } from "./report_service.js";

const now = new Date("2026-10-24T09:00:00Z");
const matter = matterIntake.parse({
  matterId: "MAT-1042",
  recipient: "legal@example.com",
  clientName: "Northstar Legal",
  signedDocumentDelivered: true,
  deadline: "2026-10-26"
});

assert.equal(shouldFollowUp(matter, now), true);
assert.equal(shouldFollowUp({ ...matter, signedDocumentDelivered: false }, now), false);
assert.equal(shouldFollowUp({ ...matter, deadline: new Date("2026-11-04") }, now), false);
console.log("follow-up decision test passed");
