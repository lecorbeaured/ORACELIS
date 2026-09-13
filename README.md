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

Replace `G-XXXXXXXXXX` in `index.html` with your GA4 Measurement ID. Note that `reading.html` does not currently load the GA script at all, so paywall/purchase events fire the `gtag` calls but silently no-op — add the same GA snippet there if you want funnel data past the landing page.

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
    ├── create-checkout.js  # Creates Stripe session
    ├── verify-payment.js   # Verifies payment, issues token
    ├── verify-token.js     # Validates access token
    ├── send-reading.js     # Emails the reading via Resend, adds to Resend Audience
    └── contact.js          # Contact form handler — sends a notification via Resend to CONTACT_EMAIL (defaults to support@oracelis.app)
```

## How It Works

1. User enters name + birth date
2. Free pages shown: Core Theme in full, then a shortened preview of the next free page with a "Continue Reading" prompt
3. User hits paywall → sees tier options
4. Clicks upgrade → Stripe Checkout
5. Payment success → `/api/verify-payment` verifies with Stripe, issues a signed token
6. Reading page verifies the token via `/api/verify-token` → unlocks paid content
7. The reading is also emailed via Resend at every tier (free included); if `RESEND_AUDIENCE_ID` is set, the email is also added to that Resend Audience for follow-up marketing

## Security

- Payments verified server-side via Stripe API
- Access tokens are signed (HMAC-SHA256); `TOKEN_SECRET` must be set or token endpoints refuse to run
- Tokens expire after 48 hours
- No client-side tier manipulation possible
- Token payloads are signed but not encrypted — a leaked reading URL can be decoded to read the name/DOB/email inside it. Worth encrypting if that PII exposure matters for your threat model.
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
