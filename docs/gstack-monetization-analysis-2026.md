# BizCard AI — gstack Monetization Analysis
## May 2026 | Live Competitor Research

---

## 1. Competitor Pricing (Live Data, May 2026)

### Blinq — The Benchmark
| Tier | Price (Annual) | Key Features |
|---|---|---|
| **Free** | $0 | 2 cards, unlimited sharing, unlimited contacts, QR/email/SMS, Apple/Google Wallet |
| **Premium** | **$7.33/mo** ($88/yr) | 5 cards, universal scanner, AI notetaker, AI enrichment, branded QR, export contacts |
| **Business** | **$4.99/mo/card** | Team cards, admin dashboard, templates, CRM sync, lead capture, analytics |
| **Enterprise** | Custom | SSO, webhooks, dedicated CSM |

🟢 **Key insight:** Blinq is the new market leader on pricing transparency. "Relationship Intelligence" is usage-based AI pricing — a new trend.

### HiHello — Cheapest Paid
| Tier | Price (Monthly) | Price (Annual) |
|---|---|---|
| **Personal** | Free | Free |
| **Professional** | $8/mo | **$6/mo** ($72/yr) |
| **Business/Enterprise** | Contact us | Contact us |

🟢 **Key insight:** HiHello at $6/mo annual sets the price floor for branded digital cards.

### Covve — Premium B2B
| Tier | Price |
|---|---|
| **Individual** | **$120/seat/yr** (~$10/mo) — unlimited scans, 60+ languages, AI research, export |
| **Business** | **$299/seat/yr** (~$25/mo) — CRM (Salesforce, HubSpot), team collab, dedicated AM |
| **Enterprise** | Custom — 99.95% SLA, custom dev, EntraID |

🟡 **Key insight:** Covve positions as premium B2B lead capture, not consumer. No free tier — trial-only.

### Popl — Enterprise Only
- No public pricing. "Request pricing" form.
- Positioned as "event lead capture platform" — pivoted from digital business cards.
- Trusted by 90% of Fortune 500.

### CamCard — Hidden Pricing
- Pricing now gated behind contact form (enterprise sales motion)
- Previously: Free → $4.99–$14.99/mo
- Largest user base in Asia, strong Chinese OCR heritage

### ABBYY BCR — Enterprise SDK Pivot
- Consumer app deprecated. Now "Mobile Web Capture SDK" for enterprise onboarding.
- Not a competitor anymore.

---

## 2. Market Positioning Map

```
                    PRICE →
            FREE          LOW ($5-8)     MID ($8-15)    HIGH ($15+)    ENTERPRISE
FEATURES
Scanner     Blinq,HiHello  Blinq          Covve          Covve Biz      Popl,ABBYY
Digital Card Blinq,HiHello  HiHello($6)   Blinq($7.33)  —              Popl
AI Features Blinq(basic)    Blinq(AI)     Covve(AI)      —              Popl
CRM Sync    —               —             Blinq Biz      Covve Biz      Popl
Team Mgmt   —               —             Blinq Biz($5/card) Covve($25) Popl
Bilingual   ❌ NONE         ❌ NONE        ❌ NONE         ❌ NONE         ❌ NONE ← BIZCARD ONLY
News Track  ❌ NONE         ❌ NONE        ❌ NONE         ❌ NONE         ❌ NONE ← BIZCARD ONLY
HK Payment  ❌ NONE         ❌ NONE        ❌ NONE         ❌ NONE         ❌ NONE ← BIZCARD ONLY
```

**BizCard's unique positioning remains:**
1. **Bilingual EN+ZH OCR** — ZERO competitors have this
2. **Company news tracking** — ZERO competitors
3. **HKD pricing + local HK payment** — ZERO competitors

---

## 3. Monetization Recommendations

### 🔴 CRITICAL: Current pricing is broken
| Problem | Details |
|---|---|
| **Stripe checkout dead** | Disabled after Supabase removal — nobody can pay |
| **USD only** | HK target market sees foreign currency → trust drop |
| **Free too tight (5 scans)** | Blinq gives 2 full cards free with unlimited sharing; CamCard historically gave generous free tier |
| **No upgrade trigger** | Users hit limit with no smooth path to pay |

### 🟢 RECOMMENDED PRICING (Revised for 2026)

```
┌─────────────┬────────────┬────────────┬──────────────┐
│             │  STARTER   │    PRO     │   BUSINESS   │
│             │  (Free)    │ (HK$68/mo) │ (HK$148/mo)  │
├─────────────┼────────────┼────────────┼──────────────┤
│ Price       │   Free     │ HK$68/mo   │ HK$148/mo    │
│ Yearly      │   Free     │ HK$680/yr  │ HK$1,480/yr  │
│             │            │ (2mo free) │ (2mo free)   │
├─────────────┼────────────┼────────────┼──────────────┤
│ Cards       │   15       │   150      │  Unlimited   │
│ Scans/mo    │   15       │   80       │  300         │
│ OCR         │  Basic     │  Full      │  Advanced    │
│ Export      │  CSV       │  CSV+vCard │  All + API   │
│ News        │  3 co.     │  15 co.    │  80 co.      │
│ Org Chart   │  ✗         │  ✓         │  ✓           │
│ Team seats  │  ✗         │  1         │  5           │
│ AI features │  ✗         │  Basic     │  Full        │
│ Support     │  Email     │  Chat      │  Priority    │
└─────────────┴────────────┴────────────┴──────────────┘
```

### 💡 Why these numbers

| Decision | Reasoning |
|---|---|
| **15 free scans (was 5)** | Blinq gives 2 full cards free. 15 scans = enough to see value before upgrade trigger at scan #12 |
| **HK$68 Pro** | Below Blinq Premium ($7.33 ≈ HK$57) but with MORE features (news, bilingual, org chart). Premium positioning justified |
| **HK$148 Business** | Below Covve Biz ($25 ≈ HK$195). Competitive for HK SME market |
| **150/Unlimited cards** | "Cards stored" is what users value long-term, not scans |
| **Free: 15 cards, Pro: 150** | Generous enough free tier to drive virality; 10x jump to Pro |

### 📊 Revenue Model Mix (Recommended)

| Stream | % | Details |
|---|---|---|
| **SaaS Subscriptions** | 65% | Pro + Business recurring |
| **Overage/Credits** | 20% | 10 extra scans = HK$15; 5 extra companies = HK$25 |
| **Enterprise** | 10% | HK$800–3,200/mo for 10–50 seats |
| **Affiliate** | 5% | CRM integration referrals |

---

## 4. Key Strategic Insights

### Blinq's "Relationship Intelligence" is the new playbook
Blinq now charges **usage-based** for AI features (AI enrichment, AI notetaker, lead capture). This is the industry direction — ARR from AI consumption.

**→ BizCard should do the same:** Free tier gets basic OCR. Pro gets full AI. Business gets advanced AI + custom models.

### Nobody has cracked Asia/HK
CamCard is Chinese but enterprise-gated. HiHello, Blinq, Covve, Popl are all US/Euro-centric. **No competitor serves HK professionals with bilingual OCR + HKD pricing.**

**→ BizCard's moat is real and defensible.**

### Free tier is getting more generous
Blinq gives 2 full digital cards for free. HiHello gives 1 free. The trend is "give enough free to create habit, then charge for power features."

**→ 15 free scans/cards is competitive. Don't be stingy on free — be smart on upgrade triggers.**

---

## 5. Implementation Priority (P0 → P3)

### P0 — Revenue Unlock (Week 1-2)
- [ ] Fix Stripe checkout (replace Supabase session with AppWrite JWT)
- [ ] Add Stripe webhook for subscription sync
- [ ] Add HKD pricing display
- [ ] Increase free tier: 5→15 scans, 5→15 cards stored

### P1 — Conversion Optimization (Week 3-4)
- [ ] Smart upgrade prompts at 80% limit (scan #12)
- [ ] Free 7-day Pro trial on signup
- [ ] Usage tracking per user in AppWrite
- [ ] WeChat Pay / Alipay HK via Stripe

### P2 — Revenue Expansion (Month 2)
- [ ] Credit pack purchasing (10 scans = HK$15)
- [ ] Annual billing with 2-month discount
- [ ] Business tier with team management
- [ ] Enterprise inquiry form

### P3 — Growth (Month 3+)
- [ ] Referral program ("invite friend, both get 5 extra scans")
- [ ] Email digest → upgrade CTA
- [ ] HK event partnerships
- [ ] White-label API

---

*Analysis compiled May 2026 by gstack workflow. Competitor data sourced live from blinq.me, hihello.com, covve.com, popl.co, camcard.com.*
