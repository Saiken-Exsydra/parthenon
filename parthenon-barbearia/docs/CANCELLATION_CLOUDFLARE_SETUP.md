# Cancellation system: Cloudflare setup

The website is prepared locally. Do not configure a database identifier in the repository: the binding is made in the Cloudflare Pages dashboard after the D1 database exists.

## 1. D1

Create a D1 database named `parthenon-bookings`. In **Workers & Pages → parthenon-barbearia → Settings → Bindings**, add it as a D1 binding named `PARTHENON_DB`, for both production and preview as appropriate. Pages Functions receive this binding through `context.env.PARTHENON_DB`.

## 2. Migration

Apply [migrations/0001_booking_cancellation.sql](../migrations/0001_booking_cancellation.sql). With Wrangler, the command pattern is:

```sh
npx wrangler d1 execute parthenon-bookings --remote --file=migrations/0001_booking_cancellation.sql
```

The migration can also be applied through the Cloudflare D1 dashboard workflow. Do not add a database UUID to `wrangler.jsonc` just to run this command.

## 3. Cancellation pepper

Set the Pages secret `CANCELLATION_PEPPER` to a long random value. For example:

```sh
openssl rand -hex 32
```

It is used to create the keyed SHA-256 phone hash and IP-derived rate-limit buckets. It must not be a `PUBLIC_*` variable and must never be exposed to browser code.

## 4. Cal.com credential

The prepared client calls Cal.com API v2 at `GET /v2/bookings/{bookingUid}` and `POST /v2/bookings/{bookingUid}/cancel`, always with `cal-api-version: 2026-02-25`. Current Cal.com documentation allows the booking-UID lifecycle route without a scope, but a server-only `CAL_API_KEY` is supported and recommended for reliable owner-authorized production access. Create the credential in Cal.com’s developer/API-key settings and save it as the Pages secret `CAL_API_KEY`; never place it in source, browser code, or a public environment variable.

## 5. Redeploy

Redeploy the Pages project after bindings or secrets change. Pages Functions are discovered from the repository-root `functions/` directory; direct dashboard upload does not support Functions, so deploy via the existing Git integration or Wrangler.

## 6. Health check

After deployment, request:

```text
GET /api/cancellations/health
```

Expected configured response:

```json
{"ok":true,"configured":true,"calApiKeyConfigured":true}
```

`calApiKeyConfigured` may be `false` only if the unauthenticated booking-UID API route has been deliberately verified for the production Cal.com configuration.

## 7. Real booking and cancellation test

1. Create one real booking through the existing site scheduler.
2. Confirm a four-digit code appears on the Parthenon confirmation screen.
3. Confirm the prepared WhatsApp message includes that exact code.
4. Return to the site and choose **Cancelar agendamento**.
5. Enter the code and the same booking phone number.
6. Confirm the summary matches the live appointment.
7. Choose **Sim, cancelar agendamento**.
8. Confirm the success state, Cal.com cancellation, Google Calendar update, and released slot.
9. Try the same code again and confirm it cannot cancel anything twice.

## 8. Security test

Verify all of these fail safely:

- Correct code with a wrong phone.
- Wrong code with the correct phone.
- Repeated invalid attempts from one client, which should eventually return `429`.

## Notes

Codes use Worker Web Crypto and database-enforced uniqueness. A code is removed from its active record when the booking is cancelled or opportunistic cleanup sees that the appointment is past, making the four-digit space reusable without a scheduled job. A future scheduled cleanup is optional, not required for normal operation.

References: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [Cloudflare D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/), [Cal.com v2 cancellation](https://cal.com/docs/api-reference/v2/bookings/cancel-a-booking), and [Cal.com v2 booking retrieval](https://cal.com/docs/api-reference/v2/bookings/get-a-booking).
