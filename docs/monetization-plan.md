# BizCard AI — Monetization Plan
## April 2026 | Prepared for Simon

---

## 1. Market Context

### Competitor Landscape

| App | Price (USD/mo) | Cards | OCR | Key Differentiator |
|---|---|---|---|---|
| **CamCard** | $4.99–$14.99 | Unlimited | ✓ | Largest user base, CRM sync |
| **ABBYY BCR** | $9.99 | Unlimited | ✓✓✓ | Best OCR accuracy, enterprise |
| **Covve** | $7.99–$14.99 | Unlimited | ✗ | AI relationship scoring |
| **Blink** | Free–$12.99 | Unlimited | ✓ | Fastest UX, social sharing |
| **BizCard AI** | **$0–$19** | 5→Unlimited | ✓✓ | **AI news + org chart + bilingual** |

### BizCard's Unique Moats
1. **Bilingual EN+ZH OCR** — no competitor has first-class Chinese + English
2. **News intelligence** — real-time company news tracking per contact (no competitor)
3. **Visual org charts** — auto-generated from card relationships
4. **HK-first pricing** — HKD pricing with local payment (WeChat Pay, Alipay, FPS)

---

## 2. Current Plan Structure (WHAT EXISTS)

```
┌────────────┬──────────┬──────────┬──────────┐
│            │  FREE    │  BASIC   │   PRO    │
├────────────┼──────────┼──────────┼──────────┤
│ Price (mo) │   $0     │   $9     │   $19    │
│ Price (yr) │   $0     │   $89    │   $189   │
│ Scans      │   5/mo   │   30/mo  │   ∞      │
│ Companies  │   3       │   10      │   ∞      │
│ OCR        │  Basic   │  Enhanced│  Advanced│
│ Export     │  CSV     │  CSV+PDF │  All     │
│ News       │  ✗       │  Basic   │  Realtime│
│ Team       │  ✗       │  ✗       │   ✓      │
│ Support    │  Email   │  Email   │  Priority│
└────────────┴──────────┴──────────┴──────────┘
```

### Problems with Current Structure

| Issue | Impact |
|---|---|
| **Basic→Pro gap too large** | $9→$19 jump with no clear "aha" upgrade moment |
| **Free too restrictive** | 5 scans/mo = user hits wall before getting value |
| **No consumption pricing** | Heavy users overpay, light users underpay |
| **No "viral" tier** | No incentive for users to invite others |
| **Stripe = disabled** | Checkout partially broken after Supabase removal |
| **No enterprise/team plan** | Missing B2B revenue channel |
| **HKD pricing absent** | UI shows USD only → HK users confused |
| **No free trial for paid tiers** | No risk-free way to experience Pro features |

---

## 3. Recommended Plan Structure (PROPOSED)

### Three-Tier + Enterprise

```
┌─────────────┬──────────┬──────────┬──────────┬──────────────┐
│             │  STARTER │   PRO    │  BUSINESS│  ENTERPRISE  │
│             │  (Free)  │ (HKD 68) │ (HKD 148)│  (Custom)    │
├─────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Price (mo)  │   Free   │ HK$68/mo │ HK$148/mo│ Contact us   │
│ Price (yr)  │   Free   │ HK$680/yr│ HK$1,480 │ Contact us   │
│             │          │ (2mo free)│(2mo free)│              │
├─────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Cards       │   10     │  100     │ Unlimited│  Unlimited   │
│ Scans/mo    │   10     │   50     │  200     │  1,000+      │
│ OCR quality │  Basic   │  Full    │  Advanced│  Custom      │
│ Export      │  CSV     │  CSV+PDF │  All+API │  API access  │
│ News        │  3 co.   │  10 co.  │  50 co.  │  Custom      │
│ Org Chart   │  ✗       │  ✓       │  ✓       │   ✓          │
│ Team seats  │  ✗       │  1       │  5       │  Unlimited   │
│ AI features │  ✗       │  Basic   │  Full    │  Full        │
│ Support     │  Email   │  Chat    │  Priority│  Dedicated   │
└─────────────┴──────────┴──────────┴──────────┴──────────────┘
```

### Key changes:

| Change | Rationale |
|---|---|
| **Free: 5→10 scans** | Gives enough runway for user to see value before upgrade trigger |
| **HKD pricing** | HK market. HK$68 ≈ $8.70 USD (competitive with CamCard $9.99) |
| **Pro: HKD 68** | Sweet spot — cheaper than CamCard Pro ($14.99), premium feel at ¥60 range |
| **Business: HKD 148** | Team tier with 5 seats, hits SME sweet spot in HK |
| **Enterprise: Custom** | Banking, legal, recruitment — high-volume scanner users |
| **Cards not scans** | "Cards stored" is what users care about. Scans = one-time action, storage = recurring value |
| **Annual = 2 months free** | 17% discount (vs typical 20%) — balances revenue predictability with perceived value |

---

## 4. Revenue Model — Beyond Subscriptions

### Primary: SaaS Subscriptions (70% of revenue)
- Monthly/annual recurring from Pro + Business tiers
- Target: 60% annual, 40% monthly

### Secondary: AI Credits / Overages (15%)
- Beyond plan limits, sell credit packs
- **Scan Pack**: 10 extra scans = HK$15
- **News Company Pack**: 5 extra companies tracked = HK$25
- **AI Analysis**: Per-report pricing for deep competitor analysis

### Tertiary: Enterprise (10%)
- HK$800–3,200/mo per enterprise client (10–50 seats)
- Custom OCR training for specific card formats (banking, legal, real estate)
- White-label API access

### Quaternary: Affiliate/Partnerships (5%)
- CRM integration partners (Salesforce, HubSpot) — referral fees
- Event partnerships (conference badge scanning)
- Print partnerships (physical→digital card conversion services)

---

## 5. Conversion Funnel

```
AWARENESS → ACTIVATION → ENGAGEMENT → CONVERSION → RETENTION
                                                      ↑
                                              ┌───────────────┐
                                              │ Churn triggers │
                                              │• Paywall too   │
                                              │  early → rage  │
                                              │• No usage →    │
                                              │  forget app    │
                                              └───────────────┘
```

### Stage-by-Stage Tactics

| Stage | Tactic | Metric |
|---|---|---|
| **Awareness** | HK tech blogs, LinkedIn ads targeting HK professionals, event partnerships | Signups |
| **Activation** | First scan in <30 sec after signup. Pre-loaded demo card. | % who scan 1 card |
| **Engagement** | Daily news digest email for tracked companies. "Your network this week" summary. | DAU/MAU |
| **Conversion** | Free trial of Pro for 7 days. Upgrade prompt at 8/10 scans used. Stripe Checkout or WeChat Pay. | Free→Paid % |
| **Retention** | Monthly usage report. Card update alerts (person changed jobs). Annual plan lock-in. | Churn rate |

### Key Conversion Moments

1. **7th of 10 scans used** → "You're almost out of scans. Try Pro free for 7 days."
2. **4th company added** → "Track news for all 4 companies with Pro."
3. **Export attempt >10 cards** → "CSV includes only first 10. Upgrade for full export."
4. **30 days on Free** → "Here's what you've accomplished. Ready for more?"

---

## 6. Payment Infrastructure

### Current State
- Stripe test mode links hardcoded (`buy.stripe.com/test_bIY3eN9mh9hv95SbIJ`)
- `/api/checkout/create-session` endpoint exists but needs Supabase session → needs AppWrite session instead
- No webhook handling for subscription status updates

### Required Fixes

| Priority | Task | Effort |
|---|---|---|
| **P0** | Fix `/api/checkout/create-session` — use AppWrite session instead of Supabase | 2h |
| **P0** | Add Stripe webhook endpoint for subscription sync | 3h |
| **P0** | Add HKD pricing with currency toggle | 1h |
| **P1** | Add WeChat Pay / Alipay HK via Stripe | 4h |
| **P1** | Add FPS (Faster Payment System) via Stripe | 2h |
| **P2** | Add usage tracking per user in AppWrite | 3h |
| **P2** | Implement credit pack purchasing | 4h |

---

## 7. Revenue Projections (Conservative)

| Month | Users | Free→Paid % | MRR | ARR Run Rate |
|---|---|---|---|---|
| 1 | 100 | 3% | HK$612 | HK$7,344 |
| 3 | 300 | 4% | HK$2,448 | HK$29,376 |
| 6 | 800 | 5% | HK$8,160 | HK$97,920 |
| 12 | 2,000 | 6% | HK$24,480 | HK$293,760 |

Assumptions: 80% Pro (HK$68), 20% Business (HK$148). No enterprise yet. Conservative virality.

### Path to HK$1M ARR (Year 2)
```
2,000 users × 8% conversion × HK$85 avg = HK$13,600 MRR
+ 5 enterprise clients × HK$1,500/mo = HK$7,500
Total MRR = HK$21,100 → ARR = HK$253,200
Need ~4,000 users at 10% conversion for HK$1M ARR
```

---

## 8. Implementation Roadmap

### Phase 1: Fix Foundation (Week 1-2)
- [ ] Fix Stripe checkout (AppWrite session)
- [ ] Add webhook endpoint
- [ ] Add HKD pricing display
- [ ] Enable HK payment methods (WeChat, Alipay, FPS)

### Phase 2: Smart Gating (Week 3-4)
- [ ] Usage tracking per user in AppWrite
- [ ] Smart upgrade prompts at 80% limit
- [ ] Free 7-day Pro trial
- [ ] FreeUsageCounter redesign

### Phase 3: Revenue Expansion (Month 2)
- [ ] Business tier (multi-seat, team sharing)
- [ ] Credit pack purchasing
- [ ] Annual billing with 2-month discount
- [ ] Enterprise inquiry form

### Phase 4: Growth (Month 3+)
- [ ] Referral program ("invite a friend, both get 5 extra scans")
- [ ] Email marketing (weekly digest → upgrade CTA)
- [ ] Event partnership deals
- [ ] White-label API for enterprise

---

## 9. Key Success Metrics

| Metric | Target (Month 6) |
|---|---|
| Free→Paid conversion | 5% |
| Monthly churn | <8% |
| Activation rate (scan 1 card) | >60% |
| DAU/MAU | >20% |
| CAC (customer acquisition cost) | <HK$50 |
| LTV (lifetime value) | >HK$800 |
| Net Revenue Retention | >100% |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **CamCard / ABBYY undercut on price** | Differentiate on AI news + bilingual — not price war |
| **OCR API costs eat margin** | Bulk pricing from Deepbrick/KIE.AI. Cache OCR results. |
| **Stripe HK compliance** | Verify business registration. Use HK Stripe account (not US). |
| **Low conversion from free** | A/B test limits. Try 15 scans/mo free vs 10. |
| **No enterprise demand** | Start with LinkedIn outreach to HK recruiters + bankers first. |

---

*End of plan. Ready for discussion & refinement.*
