# SMS booking alerts (Text.lk)

When a customer books on the website, the owner and every staff member with a
saved mobile number get one text. That is built and working. It sends nothing
until the two credentials below are filled in.

Provider: **Text.lk**. API docs: <https://text.lk/docs/send-sms/>

> **Local state, 2026-09-08.** `.env.local` holds a real API token and
> `TEXTLK_SENDER_ID=TextLKDemo`, Text.lk's sandbox sender, because our own
> sender ID is not approved yet. A live booking was sent through it and Text.lk
> accepted it (uid `6a9ff544532c1`). **`TextLKDemo` cannot be used for real
> traffic**, so an approved sender ID is still needed before launch: request it
> under Sending, Sender ID.
>
> The owner's number, `076 974 7099`, is set on his account in
> `.data/panel.json`. That file is gitignored and **the number is deliberately
> not in `store.ts`**, so it is never committed. Deleting the store to reset it
> loses the number; re-type it in `/panel/team`.

---

## 1. What happens when a booking comes in

1. The customer submits the booking form, the quick request on a vehicle page,
   or a booking is taken by phone in the panel.
2. The booking is saved. The customer sees "request sent" **immediately**.
3. *After* that response has gone back, one text goes out per recipient.
4. Every attempt is written to the message log and shown on `/panel/team`.

Step 3 uses Next's `after()`, so a slow or dead SMS gateway can never make a
customer's booking hang or fail. If Text.lk is down the booking is still saved
and the failure appears in the log with the reason.

The text looks like this, and is built to fit **one** 160 character segment,
which is one unit of credit:

```
Extra Cabs: new booking EC-0042
Nimal Perera, 077 123 4567
Toyota Prius
10 Sep to 12 Sep
```

With a driver requested, the third line reads `Toyota Prius, with driver`.

---

## 2. Set it up in the Text.lk dashboard

Three things, in this order. Only the sender ID takes any real time.

### a. Get the API token

In the dashboard, find the developer or API section and generate an API token
(it may be labelled API Key or Access Token). Copy it once, it is a password:
anyone holding it can spend the account's SMS credit.

### b. Register a sender ID

This is the name the text appears to come from, and it is the one step with a
lead time. In the dashboard: **Sending, then Sender ID**, and request a new
one.

- Maximum **11 characters**, letters and digits, no spaces. `ExtraCabs` fits.
- Text.lk quote a few hours to 1 business day, occasionally up to 3. They also
  offer fast-track approval at no extra cost if you ask.
- `TextLKDemo` is their sandbox sender. It works for testing and **cannot be
  used for real traffic**.

Until your own sender ID is approved, put `TextLKDemo` in the env file and test
with that.

### c. Put some credit on the account

New accounts get 10 free SMS units, which is enough to prove the wiring. Units
do not expire. Top up by card or bank transfer before going live.

---

## 3. Put the credentials in the app

Local development: `.env.local` in the repo root. It is gitignored, and
`.env.example` is the committed template.

```
TEXTLK_API_TOKEN=the-token-you-just-copied
TEXTLK_SENDER_ID=ExtraCabs
SMS_ENABLED=true
```

Restart `next dev` afterwards. Environment variables are read at process start.

**On Vercel:** Project Settings, Environment Variables, the same three names.
Add them to Production and Preview, then redeploy. Consider setting
`SMS_ENABLED=false` on Preview so test bookings on a preview URL do not text
the owner at midnight.

**Never commit the token.** If it ever lands in a commit, revoke it in the
Text.lk dashboard and generate a new one. Rotating is cheap, a leaked token is
not.

---

## 4. Put the numbers in the panel

The numbers are **not** in the code. Sign in at `/999p7k` as the owner and go
to `/panel/team`, section **Booking alerts by SMS**. Every account is listed,
the owner included.

- Type a mobile and press Save. `077 123 4567`, `0771234567` and
  `+94 77 123 4567` are all accepted and stored as typed. A number that is not
  a valid Sri Lankan one is rejected on save rather than failing silently later.
- **Turn alerts off** stops texting one person without deleting their number.
- **Send a test** sends one real message to that number, now, and shows the
  result underneath. Use it the moment a number is added.
- Clearing the box stops texting that person entirely.
- A disabled account never gets alerts.

The right-hand label on each row says plainly whether that person will be
texted.

Under the list, **Last messages sent** shows the recent attempts with their
status, Text.lk's own message id, and the error text when one failed. That log
is how you find out the credit ran out, because the booking itself will still
have succeeded.

---

## 5. Testing without spending real credit

Leave `TEXTLK_API_TOKEN` blank. Nothing is sent, the exact message is printed
to the server console as `[sms] not configured, would send to ...`, and the
attempt is recorded in the panel with status `skipped`. The whole flow is
testable end to end that way.

---

## 6. What it costs to run

Billing is per **segment**. A GSM-7 message gets 160 characters per segment;
**one Sinhala or Tamil character, or a curly quote pasted out of Word, drops
that to 70** because the whole message switches to 16-bit encoding. The booking
alert is built and length-checked to stay inside one segment, and the segment
count of every message is recorded in the log so a change that starts costing
double is visible.

Cost per booking is therefore `1 segment x number of people on the list`. Three
recipients is three units per booking.

### Checking the balance

**Undocumented but working**, found by probing on 2026-09-08. Text.lk's own
docs list no balance endpoint:

```bash
curl -H "Authorization: Bearer $TEXTLK_API_TOKEN" \
     -H "Accept: application/json" \
     https://app.text.lk/api/v3/balance
# {"status":"success","data":{"remaining_balance":"9","expired_on":"8th Sep 26, 4:44 PM"}}
```

`GET /api/v3/sms` lists everything sent, with Text.lk's own delivery status per
message, which is worth comparing against our log when a message goes missing.
`GET /api/v3/me` returns the account. **It also returns the API token in
plaintext**, so treat that response as a secret.

Note the `expired_on` field. The FAQ says units never expire; the trial credit
carries a date anyway. Worth confirming with them before relying on a balance
sitting unused.

---

## 7. What this does not do yet

- **The customer gets nothing.** Only staff are texted. Sending the customer a
  confirmation is a small change in `notifyNewBooking()`, but it is a real cost
  per booking and a decision for the owner.
- **Contact form enquiries do not text anyone.** Only bookings do. Wiring
  `createEnquiryAction` the same way is a few lines.
- **No delivery receipts.** Text.lk's response says whether they accepted the
  message, not whether the handset received it. Their delivery reports would
  need a webhook.
- **No retry.** A failed send is recorded, not retried. The plan calls for an
  outbox worker with retries in Phase 4.
- **The access OTP still is not on SMS.** That is the other half of the Text.lk
  work: `AccessRequest.devCode` is still shown on the owner's screen. The
  gateway module here is what that will use, so it is now a small job.

---

## 8. Where the code is

| Piece | File |
| --- | --- |
| Gateway client, phone normalising, segment counting | `src/lib/sms/textlk.ts` |
| Who gets told, the message text, the log | `src/lib/sms/notify.ts` |
| The trigger | `createBookingAction` in `src/app/panel/actions.ts` |
| Numbers, toggles, test button, log | `src/app/panel/team/page.tsx` |
| Stored numbers and message log | `StaffUser.phone`, `PanelData.messages` |

Nothing in `src/lib/sms/` ever throws at its caller. A booking must not fail
because a text message did not go out.
