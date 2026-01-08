# ORACELIS

Personalized spiritual readings platform with secure payment processing.

## Quick Start (Local Testing)

```bash
# Just open index.html in browser
open index.html

# Or use a local server
npx serve .
```

## Netlify Deployment

### 1. Deploy to Netlify

- Drag & drop folder to [Netlify](https://app.netlify.com/drop)
- Or connect your GitHub repo

### 2. Add Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PRICE_TIER1=price_xxx     # $29 product price ID
STRIPE_PRICE_TIER2=price_xxx     # $49 product price ID
STRIPE_PRICE_UPGRADE=price_xxx   # $20 upgrade price ID
TOKEN_SECRET=your-random-secret-key-min-32-chars
```

### 3. Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create three products:
   - **Insight Overview** - $29 one-time
   - **Complete Reading** - $49 one-time
   - **Upgrade to Complete** - $20 one-time
3. Copy each Price ID to your env variables

### 4. Update Google Analytics

Replace `G-XXXXXXXXXX` in `index.html` with your GA4 Measurement ID.

---

## File Structure

```
oracelis/
├── index.html              # Landing page
├── reading.html            # Reading display (paginated)
├── netlify.toml            # Netlify config
├── package.json            # Dependencies
├── css/
│   ├── styles.css          # Main styles
│   └── reading.css         # Reading page styles
├── js/
│   ├── main.js             # Landing page logic
│   ├── readingPaginated.js # Reading navigation
│   ├── nodeTemplates.js    # Reading content
│   ├── nodes.js            # Profile calculator
│   ├── stripe.js           # Payment integration
│   └── analytics.js        # GA4 tracking
└── netlify/functions/
    ├── create-checkout.js  # Creates Stripe session
    ├── verify-payment.js   # Verifies payment, issues token
    └── verify-token.js     # Validates access token
```

## How It Works

1. User enters name + birth date
2. Free reading pages shown (1-3)
3. User hits paywall → sees tier options
4. Clicks upgrade → Stripe Checkout
5. Payment success → Netlify function verifies
6. Signed token generated → redirects to reading
7. Reading page verifies token → unlocks paid content

## Security

- Payments verified server-side via Stripe API
- Access tokens are signed (HMAC-SHA256)
- Tokens expire after 48 hours
- No client-side tier manipulation possible

## Tier Structure

| Tier | Price | Content |
|------|-------|---------|
| Free | $0 | Core Theme, Current Experience, Life Lessons |
| Tier 1 | $29 | + Strengths, Challenges, Action Steps |
| Tier 2 | $49 | + Success Code, Alignment Guide |
| Upgrade | $20 | Tier 1 → Tier 2 (for existing $29 buyers) |

---

Built with ❤️ by EBSS Web Studio
