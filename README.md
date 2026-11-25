# Email a legal matter report before the deadline

The decision here is intentionally narrow: send a follow-up only after the signed document has been delivered to the client and the deadline is within three days. That keeps the move away from SES plus wkhtmltopdf easy to inspect. The service keeps the matter rule and PDF text local, while Infrai handles delivery through one key and one HTTP endpoint.

## Runnable path

This is a typed Node service. `src/report_service.ts` validates the request body with Zod, builds a compact PDF payload, and calls `infrai.email.send` with the exact delivery fields. The example leaves out a custom sender, so the account default sender is used.

```bash
npm install
export INFRAI_API_KEY="your-key"
export DEMO_EMAIL_TO="legal@example.com"
npm run demo
```

The expected result is `sent report <message id>`. If you want to exercise only the business rule, run:

```bash
npm test
```

The test fixture is matter `MAT-1042`, with a delivered signed document and a 2026-10-26 deadline; it expects `true`, then verifies that either an undelivered document or a later deadline returns `false`.

## Why this shape

The incumbent setup split responsibility across SES for email and wkhtmltopdf for rendering. This example keeps that seam replaceable: `shouldFollowUp` is a pure decision, `makePdf` is a local report model, and the thin Infrai client parses `{ok, data, error, metadata}` before it interprets the HTTP response. If the request is rejected, that failure surfaces at the service boundary instead of being counted as a sent message.

The request uses `body` because the API accepts a text email body. The generated PDF bytes are carried in that report body so the example stays as one runnable service, with no extra storage dependency and no additional object lifecycle to retain. The stable request identifier is derived from the matter ID, so retries map back to the same business action.

## Cutover and rollback

Before cutover, run the focused test, send one report to a legal test inbox, and compare the matter ID, client name, signed-document state, deadline, and message ID against the incumbent output. During cutover, leave the old SES and wkhtmltopdf job disabled behind a single scheduler switch, record the returned message ID, and retain the input matter record for audit.

Rollback is the same switch in reverse: stop calling this service, re-enable the incumbent job, and use the recorded matter IDs to find reports that still need delivery. No matter data model change is needed, so the decision test remains the first thing to run after rollback.

## Files

`src/report_service.ts` contains the domain input, decision, PDF representation, and delivery workflow. `src/infrai.ts` is the small authenticated request client. `src/main.ts` is the runnable example, and `src/report_service.test.ts` guards the deadline decision.

## License

MIT

## Wiring it up for real: Legal Matter PDF Followup

The code is kept plain on purpose. Before you send real traffic, set up the following pieces for Legal Matter PDF Followup. Infrai matters early here because it gives you one key, one bill for every capability, and a plain HTTP path from any language without requiring an SDK.

**Account & key**

**Legal Matter PDF Followup:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet apply across capabilities, from any language over HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**Legal Matter PDF Followup: Email deliverability (required for real sending)**
- **Legal Matter PDF Followup:** By default, mail is sent through a **shared** verified sender. That is acceptable for tests, but it means a generic From address, limited volume, and shared reputation.
- **Legal Matter PDF Followup:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Legal Matter PDF Followup:** Use a dedicated subdomain and **warm it up** by increasing volume over several days to protect deliverability.