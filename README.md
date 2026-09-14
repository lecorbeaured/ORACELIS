# ORACELIS

Personalized spiritual readings platform with secure payment processing.

## Quick Start (Local Testing)

```bash
# Just open index.html in browser
open index.html

# Or use a local server with the API routes available
npx vercel dev
```

## Vercel Deployment

### 1. Deploy to Vercel

- `vercel` from the project root, or connect your GitHub repo in the Vercel dashboard
- Build settings come from `vercel.json` (no build step required)

### 2. Add Environment Variables

In the Vercel dashboard → Project Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PRICE_TIER1=price_xxx     # $29 product price ID
STRIPE_PRICE_TIER2=price_xxx     # $49 product price ID
STRIPE_PRICE_UPGRADE=price_xxx   # $20 upgrade price ID
TOKEN_SECRET=your-random-secret-key-min-32-chars
RESEND_API_KEY=re_xxx            # required — sends the reading email
RESEND_AUDIENCE_ID=c942e291-cf04-4e64-abb0-aaa66d7bcf59   # "ORACELIS Readings" audience — set in Vercel as of Sep 2026; without it, emails are sent but contacts are NOT saved to any Resend Audience
CONTACT_EMAIL=support@oracelis.app  # optional — where the contact form's notification email goes; defaults to support@oracelis.app if unset
```

`TOKEN_SECRET` is required in every environment. If it's missing, `/api/verify-payment` and `/api/verify-token` now refuse to issue or verify tokens rather than falling back to a default value — that fallback used to be a way to forge free access to paid tiers, so treat a "Server misconfigured" error there as a sign this variable isn't set.

### 3. Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create three products:
   - **Insight Overview** - $29 one-time
   - **Complete Reading** - $49 one-time
   - **Upgrade to Complete** - $20 one-time
3. Copy each Price ID to your env variables

### 4. Update Google Analytics

Replace `G-XXXXXXXXXX` with your GA4 Measurement ID in **both** `index.html` and `reading.html` — the reading page now loads the same GA snippet as the landing page (it didn't before, so every paywall/purchase `gtag` event was silently no-op'ing past the landing page), so both copies of the placeholder need to match your real ID or funnel data will still be incomplete.

---

## File Structure

```
oracelis/
├── index.html              # Landing page
├── reading.html            # Reading display (paginated)
├── vercel.json             # Vercel config + security headers
├── package.json            # Dependencies
├── css/
│   ├── styles.css          # Main styles (landing page + shared)
│   └── reading.css         # Reading page styles
├── js/
│   ├── main.js             # Landing page logic
│   ├── readingPaginated.js # Reading navigation, tier gating, soft-preview teaser
│   ├── nodeTemplates.js    # Reading content
│   ├── nodes.js            # Profile calculator
│   ├── stripe.js           # Payment integration
│   └── analytics.js        # GA4 tracking
└── api/
    ├── _token.js               # Shared token encode/decode (AES-256-GCM); not a route (underscore-prefixed)
    ├── _rateLimit.js           # Shared in-memory per-IP rate limiter; not a route (underscore-prefixed)
    ├── create-reading-token.js # Issues a free-tier access token (no payment involved) so the reading URL carries a token instead of raw name/dob/email
    ├── create-checkout.js      # Creates Stripe session
    ├── verify-payment.js       # Verifies payment, issues access token
    ├── verify-token.js         # Validates access token
    ├── send-reading.js         # Emails the reading via Resend, adds to Resend Audience
    └── contact.js              # Contact form handler — sends a notification via Resend to CONTACT_EMAIL (defaults to support@oracelis.app)
```

## How It Works

1. User enters name + birth date
2. `/api/create-reading-token` issues a signed, encrypted `tier: 'free'` access token for this reading — so the URL that opens is `reading.html?token=...` rather than `reading.html?name=...&dob=...&email=...`. If that call fails for any reason, the client falls back to the old raw-param URL rather than blocking the reading.
3. Free pages shown: Core Theme in full, then a shortened preview of the next free page with a "Continue Reading" prompt
4. User hits paywall → sees tier options
5. Clicks upgrade → Stripe Checkout
6. Payment success → `/api/verify-payment` verifies with Stripe, issues an access token
7. Reading page verifies the token via `/api/verify-token` → unlocks paid content
8. The reading is also emailed via Resend at every tier (free included); if `RESEND_AUDIENCE_ID` is set, the email is also added to that Resend Audience for follow-up marketing

## Security

- Payments verified server-side via Stripe API
- Access tokens are AES-256-GCM encrypted and authenticated (`api/_token.js`); `TOKEN_SECRET` must be set or token endpoints refuse to run. The GCM auth tag rejects any tampered token the same way the old HMAC signature did, and now the payload (name/DOB/email) is unreadable to anyone without `TOKEN_SECRET` — a leaked reading URL no longer exposes that data. Tokens issued before this change (2-part HMAC-signed-but-plaintext format) are still honored until they expire, so already-sent purchase emails keep working.
- Tokens expire after 48 hours
- No client-side tier manipulation possible
- Free-tier readings are also opened via a token (`/api/create-reading-token`) rather than raw name/DOB/email query params, so a free reading's URL doesn't expose that data in browser history or if the link is forwarded/screenshotted — the same protection paid tiers already had. (This does mean a free reading link now expires after 48 hours too, matching paid links, where it previously never expired.)
- `api/_rateLimit.js` adds a per-IP, in-memory rate limit to every API route (contact form: 5/hour, send-reading: 10/hour, create-checkout: 20/hour, create-reading-token: 20/hour, verify-payment: 30/hour, verify-token: 60/hour) as a backstop behind the client-side checks, which anyone can bypass by clearing localStorage or calling the endpoint directly. This is best-effort, not a distributed limit — it resets on cold start and isn't shared across concurrent Vercel instances, so it stops casual/scripted abuse from one source but won't hold up under a coordinated attack. Swap in a shared store like Upstash Redis behind the same `rateLimit()` signature if you need airtight protection.
- All user-supplied text (first name, and the reading content sent to `/api/send-reading`) is HTML-escaped before being placed into a page or email, so it can't be used to inject markup or scripts

## Tier Structure

| Tier | Price | Content |
|------|-------|---------|
| Free | $0 | Core Theme (full) + a shortened preview of "What You're Likely Experiencing Right Now" |
| Tier 1 | $29 | + Life Lessons, Strengths, Challenges, Daily Practices |
| Tier 2 | $49 | + Success Code, Alignment Guide |
| Upgrade | $20 | Tier 1 → Tier 2 (for existing $29 buyers) |

---

Built with ❤️ by EBSS Web Studio
