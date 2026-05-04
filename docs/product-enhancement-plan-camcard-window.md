# BizCard AI — Product Enhancement Plan
## Exploiting the CamCard Implosion | May 2026

---

## 🎯 Strategy: Be the EXACT opposite of everything users hate about CamCard

```
CamCard does THIS          →  BizCard does THIS
═══════════════════════════════════════════════════════
Holds data hostage          →  "Your data, always yours. Export anytime, even on free tier."
$50 auto-charge trap        →  HKD pricing, no tricks, cancel in 1 tap
Made free tier useless      →  Generous free tier (10 cards, 10 scans/mo)
Cancellation hell           →  Cancel = immediate, no tickets, no calls
OCR got worse over time     →  Continuously improving AI (GPT-4o + fine-tuned)
Hidden fees                 →  All prices visible, HKD, no surprises
```

---

## 📋 PHASE 1: Capture the Refugees (Week 1-2)

### 1.1 "Switch from CamCard" Landing Page
**Goal:** Convert searching CamCard refugees

```
SEO targets:
- "CamCard alternative"
- "business card scanner no subscription"
- "CamCard too expensive alternative"
- "CamCard free alternative"
```

**Page structure:**
- Honest comparison table (not just marketing fluff)
- Real CamCard review quotes (the angry ones)
- One-click import walkthrough
- "Why 90,000+ users are leaving CamCard"

### 1.2 CamCard Data Import Tool
**Goal:** Zero-friction migration

**Two import paths:**
| Method | How |
|---|---|
| 📸 **Screenshot import** | User screenshots their CamCard card list → BizCard OCRs screenshots → imports all cards |
| 📤 **CSV/vCard export** | If they have export access → drag & drop → instant import |
| 🆘 **"I lost access" mode** | User describes: "CamCard locked me out, I can see 50 cards but can't export" → BizCard offers manual entry wizard with batch mode |

**UX flow:**
```
[Landing Page] → [Import from CamCard] → [Upload screenshot/CSV] → [AI extracts all cards] → [Welcome to BizCard!]
```

### 1.3 "Data Liberation Promise" — Front & Center
**Display on pricing page, signup, and footer:**

> 🛡️ **Your contacts are YOURS.**
> - Export all cards anytime (CSV, vCard) — even on Free tier
> - Delete account = all data wiped immediately
> - No data held hostage. Ever.
> - We'll never charge you to access what you already scanned.

---

## 📋 PHASE 2: Outperform on Core Product (Week 2-4)

### 2.1 Superior AI OCR Engine

**Problem:** CamCard reviews say "ChatGPT is way more accurate"

**Solution:** Replace current OCR with multi-model pipeline:
```
Image → GPT-4o Vision (primary) → Claude fallback → Structured output
```

**Edge cases CamCard fails at (target these):**
- Chinese + English mixed cards (HK market!)
- Stylized/creative fonts
- Vertical Chinese text
- Multi-language cards (EN/ZH/JP/KR)
- Low light / angled photos
- Cards with QR codes / logos that confuse OCR

### 2.2 Smart Correction UI
**Goal:** Fix CamCard's "50-60% needs correction" complaint

**Features:**
- **Confidence scores** per field: "Name: 98% ✓ | Company: 62% ⚠️"
- **One-tap correction**: Tap wrong field → type correct value → saves
- **AI auto-suggest**: "Did you mean 'HSBC' instead of 'HS CB'?"
- **LinkedIn lookup**: "Found John Smith at Google — confirm?"
- **Batch review mode**: Scan 10 cards → review all at once on a single screen → approve one by one

### 2.3 Batch Scan Mode
**Goal:** "I have 100 business cards to scan" — the CamCard review that got them charged $50

**Flow:**
```
[Open Batch Mode] → [Snap photo of each card, one after another] 
→ [All 100 cards processed in background] 
→ [Review screen: swipe left=approve, swipe right=edit, swipe up=delete]
→ [Done in 5 minutes instead of 2 hours]
```

### 2.4 Contact Auto-Enrich
**Goal:** Make scanned cards more useful than paper cards

**Features:**
- Auto-find LinkedIn profile
- Auto-detect company website & logo
- "When did we meet?" — auto-stamps date/location
- "Follow up reminder" — set follow-up in 3 days
- Notes: "Met at RISE Conference, talked about AI"

---

## 📋 PHASE 3: Monetize WITH Trust (Week 3-6)

### 3.1 HKD Pricing — No One Does This

| | Free | Pro HK$68/mo | Pro HK$388/lifetime |
|---|---|---|---|
| Cards | 10 | Unlimited | Unlimited |
| Scans/mo | 10 | 100 | 100 |
| Export | ✅ CSV/vCard | ✅ All formats | ✅ All formats |
| OCR quality | Standard AI | GPT-4o Enhanced | GPT-4o Enhanced |
| LinkedIn enrich | ❌ | ✅ | ✅ |
| Batch scan | ❌ | ✅ | ✅ |
| Custom fields | ❌ | ✅ | ✅ |
| Tags & folders | ❌ | ✅ | ✅ |

**Key differentiators:**
- **Lifetime option** (Covve has this, users LOVE it)
- **HKD pricing** (no one in HK market does this clearly)
- **Free tier that's ACTUALLY useful** (10 cards + export = real value)
- **No auto-charge trap**: "We'll email you 3 days before trial ends. Cancel anytime in 1 tap."

### 3.2 Referral Program — Viral Growth
**"Give 5 free Pro scans to a friend, get 5 for yourself"**

```
You (Free) → Share link → Friend signs up → Friend gets 5 free Pro scans → You get 5 free Pro scans
```

- Low friction (no payment needed)
- Both sides win
- Creates network effect
- Directly competes with CamCard's "scan one card = $50 charge"

### 3.3 CamCard Refugee Welcome Offer
**"You were burned by CamCard. Here's 30 days of Pro, on us."**

- Auto-detected if user mentions CamCard during onboarding
- Special welcome flow: "Let's get your contacts back"
- No credit card required for the 30 days
- After 30 days: "Keep your cards on Free forever, or upgrade to Pro for HK$68/mo"

---

## 📋 PHASE 4: Moats & Differentiation (Week 6+)

### 4.1 HK/Macau/China Optimized
- Cantonese name handling (陳大文 → Chan Tai Man)
- Simplified/Traditional Chinese auto-conversion
- WeChat mini-program version
- HK phone format (+852 XXXX XXXX)
- Company registry lookup (HK CR number → auto-fill company details)

### 4.2 Privacy-First Positioning
- **"We don't sell your contacts"** — CamCard review says "ads on lock screen for premium features" = BizCard NEVER does this
- **End-to-end encryption option** for Pro users
- **GDPR / PDPO compliant** (HK data privacy)
- **Delete = really deleted** (not "soft deleted and sold")

### 4.3 API & Integrations
- Zapier/Make integration
- Salesforce/HubSpot sync (Enterprise)
- Google Contacts 2-way sync
- Slack: "Scan a card → post to #new-contacts channel"

---

## 📊 PRIORITY MATRIX

```
                    HIGH IMPACT
                        │
        1️⃣ Import Tool  │  2️⃣ Better OCR
        3️⃣ Pricing Page │  4️⃣ Batch Scan
        5️⃣ Landing Page │  6️⃣ Referral
                        │
LOW EFFORT ─────────────┼───────────── HIGH EFFORT
                        │
        7️⃣ Data Promise │  8️⃣ LinkedIn Enrich
        9️⃣ Export CSV   │  🔟 WeChat Mini-App
       11️⃣ Cancel Flow  │ 12️⃣ API/Integrations
                        │
                    LOW IMPACT
```

**WEEK 1-2 priorities (ship fast, capture refugees):**
1. "Switch from CamCard" landing page + SEO
2. Data Liberation Promise (add to pricing/signup)
3. HK$ pricing page + lifetime option
4. CSV/vCard export (even on Free)

**WEEK 2-4 (core product advantage):**
5. GPT-4o OCR upgrade
6. Smart correction UI with confidence scores
7. Screenshot import tool

**WEEK 4-6 (growth & monetization):**
8. Batch scan mode
9. Referral program
10. CamCard Refugee 30-day free Pro offer

---

## 🏴‍☠️ The Killer Move

> **"CamCard is holding your contacts hostage. We'll get them back — for free."**

Put this on the landing page. Back it up with a working import tool. Watch the 90,000+ angry CamCard users come flooding in.

The product itself doesn't even need to be better than CamCard (though it will be) — it just needs to be NOT evil. That's the bar they've set, and it's on the floor.
