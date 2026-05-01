---
name: saas-monetization-planning
description: Create a detailed monetization/business plan for a SaaS product — competitor pricing research, tier structure, conversion funnel, payment infrastructure, revenue projections, and implementation roadmap.
---

# SaaS Monetization Planning

## When to Use

User asks:
- "monetization plan" / "how to make money from [app]"
- "pricing strategy" / "what should I charge"
- "business model" for a SaaS product
- "subscription plan" / "tier design"
- "which country/market to enter first" (market entry analysis — use sections 10-11 below)
- "analyze market" / "market opportunity" / "which segment to target"

**Before starting**: Check TaskFlow for existing project context — use the `taskflow` skill to look up the project group (e.g., "AI Portfolio", "BizCard AI") for related tasks, background, and previous decisions.

## Framework (always follow this structure)

### 1. Market Context
Research 3-5 direct competitors. Table with: app name, price, differentiator.

**Key question**: What makes THIS app unique? (moats)

### 2. Current State Audit
If the app already has pricing: audit what exists, identify gaps.

Problems table: | Issue | Impact |

### 3. Recommended Pricing Structure
- **3-4 tiers max** (Free → [Basic] → Pro → Enterprise)
- **Local currency** — use HKD for HK market, JPY for Japan, etc. Do not default to USD.
- **Annual = 2 months free** (17% discount, not 20% — balances revenue predictability)
- **Feature gating**: gate on dimensions users care about (storage, usage), not features they'll abandon over
- Table: tier names, prices (monthly/yearly), limits per tier

### 4. Revenue Model
```
Primary (70%): Subscriptions — monthly/annual recurring
Secondary (15%): Overages / credit packs
Tertiary (10%): Enterprise custom pricing
Quaternary (5%): Affiliate / partnerships
```

### 5. Conversion Funnel
```
Awareness → Activation → Engagement → Conversion → Retention
```

**Key conversion moments**: When does the paywall trigger?
- At 80% of usage limit
- When hitting a paywalled feature
- After user achieves value (not before)

### 6. Payment Infrastructure
- **For HK**: Stripe HK + WeChat Pay + Alipay HK + FPS
- List current state (broken? test mode?) and fix priority

### 7. Revenue Projections
Conservative 12-month forecast table: | Month | Users | Conv% | MRR |

Include path to 7-figure ARR with assumptions.

### 8. Implementation Roadmap
Phased: Fix Foundation → Smart Gating → Revenue Expansion → Growth

Each phase: checkbox tasks, effort estimates.

### 9. Risks & Mitigations
Table: | Risk | Mitigation |

## Antipatterns

- ❌ USD-only pricing for non-US markets
- ❌ Free tier too restrictive (user hits wall before seeing value)
- ❌ Basic→Pro price jump too large without clear "aha" moment
- ❌ No annual plan discount
- ❌ No free trial for paid tiers

## HK-Specific Notes

- Stripe HK requires HK business registration
- WeChat Pay + Alipay HK crucial for B2C adoption
- FPS (Faster Payment System) — preferred by HK SMEs
- HKD pricing signals local-first, not global-generic

## 10. Multi-Market / Market Entry Analysis

When the user wants to identify WHICH countries/markets to enter (before pricing):

### Criteria to Evaluate
1. **AI/Digital adoption** — lower is better (less competition, more greenfield)
2. **Market size** — fashion e-com size, # of sellers, growth rate
3. **Cost problem** — current manual costs per unit (higher = more savings to pitch)
4. **Payment infrastructure** — Stripe available? Local payment methods?
5. **Language barrier** — English proficiency, localization effort needed
6. **Competition** — any existing players in that market?

### Framework
Create a scored table with these criteria. Rank countries. Recommend top 3 with detailed entry strategies per country (pricing in local currency, platform partnerships, language requirements).

## 11. Risks & Mitigations + Success Metrics

Always include:

### Risks Table
| Risk | Mitigation |

### Key Metrics (Target by Month 6)
| Metric | Target |
|---|---|
| Free→Paid conversion | 5% |
| Monthly churn | <8% |
| Activation rate | >60% |
| CAC | <$X |

## Previous Analysis Examples

- `docs/monetization-plan.md` — BizCard AI plan (3 tiers, HKD, Stripe HK)
- `docs/ai-photo-market-analysis.md` — AI product photography country entry (Indonesia/Vietnam/Brazil)
