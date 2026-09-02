# Octovova Finance — UI Modernization Brief + Antigravity Build Prompt

This document has two parts:
1. **The UI Modernization Spec** — how your blueprint's forms/screens translate into a modern, ET Money / CRED / Groww-grade product called **Octovova Finance**.
2. **A single copy-paste prompt for Antigravity** (Google's agentic IDE) that hands the whole frontend build off with a mock API layer.

---

# PART 1 — UI Modernization Spec

## Why the original spec reads "form-y" and how to fix it

Your blueprint (Sections 1–8) is a correct, well-validated deterministic data model. But a literal build of it — label, input, label, input, submit — is what makes government portals and old-school financial calculators feel dead. ET Money, CRED, and Groww win on the same underlying data by doing four things differently:

| What they do | What you currently have | What to change |
| :--- | :--- | :--- |
| **Numbers feel alive** — animated counters, live recalculation, motion on every input | Static tables of fields | Every number (net worth, SIP required, goal FV, cash flow) recalculates and animates in real time as inputs change |
| **Progressive disclosure** — one decision per screen, not a form wall | 9 sections presented as tables | Convert Sections 1–7 into a conversational, one-question-at-a-time flow (like CRED's onboarding), not a multi-field form |
| **Data visualized before it's explained** | Numbers in tables | Every KPI (net worth, cash flow, risk score, allocation) gets a chart or ring/gauge first, number second, explanation third |
| **Dark, premium, low-chrome UI** with a single accent color doing all the work | Not specified | Adopt a dark-first theme with one signature accent (see design system below) |

---

## Brand: Octovova Finance

- **Name logic**: "Octo" (eight — the 8 sections of financial data captured: profile, income, expenses, assets, liabilities, risk, goals, plans) + "Nova" (new/bright — the AI-generated plan).
- **Positioning line**: *"Eight inputs. One clear plan."*
- **Tone**: Confident, calm, numbers-literate — not playful (this isn't a budgeting toy), not corporate-bank-boring (this isn't a legacy netbanking portal).

---

## Design System

### Palette
- **Theme**: Dark-first (default), light mode as toggle
- **Background**: `#0B0E14` (near-black, slight blue cast)
- **Surface**: `#12161F` (cards)
- **Surface-raised**: `#1A1F2B` (modals, sheets)
- **Border**: `#232937` (hairline, 1px)
- **Accent (primary)**: `#6C5CE7` → `#8B7FFF` gradient (violet — "Octovova violet")
- **Accent (secondary)**: `#00D9A3` (mint green — used ONLY for positive/gain states and "on track" indicators)
- **Danger / negative**: `#FF5C7A` (used ONLY for risk warnings, negative cash flow, shortfalls)
- **Text primary**: `#F5F6FA`
- **Text secondary**: `#8A8FA3`
- **Text tertiary**: `#565B6E`

### Typography
- **Headings**: "Cabinet Grotesk" or "General Sans" (geometric, CRED-like); fallback: Inter
- **Numbers**: Tabular numbers (`font-mono` / `tabular-nums`), slightly larger weight than body text, always
- **Body**: Inter / SF Pro fallback

### Geometry & Depth
- **Corner radius**: `20px` on cards, `14px` on buttons/inputs, `999px` on pills/badges
- **Shadows**: None on dark surfaces — separation via `1px` border + subtle background luminance step, not drop shadow
- **Motion**: `200–280ms` ease-out on all state changes; number counters animate over `600–800ms` on first paint

---

## Screen-by-Screen Mapping (Blueprint Section → Modern Screen)

| Blueprint Section | Old Form | Octovova Screen | Key UI Pattern |
| :--- | :--- | :--- | :--- |
| **1. Profile** | name/age fields | **Welcome + Identity** | Single-field-per-screen, big centered input, auto-advance on valid entry (CRED-style) |
| **2. Income** | repeatable rows | **Add Income Sources** | Swipeable cards, one per source, "+" FAB to add another, live running total pinned to top |
| **3. Expenses** | repeatable rows | **Add Expenses** | Category chips with icons (Housing 🏠, Food 🍲, Transport 🚗, EMI 💳, Other), amount on tap-in |
| **4. Assets** | repeatable rows | **Your Assets** | Icon-led list cards, grouped by liquidity (Cash/FD first, Property last), live net-worth ring updates as you add |
| **5. Liabilities** | repeatable rows | **Your Liabilities** | Same pattern as assets, red-tinted accent for outstanding amounts, interest rate shown as a small badge |
| **6. Risk Assessment** | 5 radio questions | **Risk Quiz** | Full-screen one-question-at-a-time, large tappable option cards (not tiny radio buttons), progress dots at top, subtle tap animation |
| **7. Goals** | repeatable rows | **Set Your Goals** | Goal-type icon grid first (House / Retirement / Education / Wedding / Custom), then a single card per goal with a live inflation-adjusted preview: *"₹80L today → ₹1.07Cr in 5 years"* updating as they type, priority as a draggable chip |
| **Assumptions (inflation_rate, returns)** | implied, not in table | **Assumptions Panel** | Collapsed by default behind a "⚙ Adjust assumptions" link — don't surface inflation/return assumptions on the main flow, keep them power-user-accessible |
| **Dashboard (home)** | — | **Dashboard** | This is the screen users return to. Net worth hero number top (animated), cash-flow sparkline, risk badge, goal progress rings in a horizontal scroll, "Generate Plans" CTA if none exist yet |
| **Plans / Compare** | — | **Plans / Compare** | 2–3 plan cards (Conservative / Balanced / Growth style), swipeable on mobile, side-by-side on desktop. Each card showcases: Asset Allocation Donut, Expected CAGR %, Required Monthly SIP (`<AnimatedNumber />`), Risk profile alignment badge, and AI explanation narrative |
| **8. What-If** | textarea | **What-If Chat** | Full chat UI (like a finance-literate assistant), each answer renders an inline before/after comparison metric card, not just text |
| **9. Feedback** | stars + text | **Feedback Sheet** | Bottom sheet, not a page — triggered contextually after viewing a plan, not a separate menu item |

---

## Component Inventory to Build

- `<AnimatedNumber value={...} currency="INR" />` — counts up/down on value change, respects Indian currency formatting (₹, lakh/crore grouping)
- `<GoalCard />` — icon, target year, live-computed inflation preview, priority chip
- `<RiskQuizCard />` — full-bleed option card, 5-option layout, progress dots
- `<AllocationDonut />` — equity/debt/cash, Recharts-based, Octovova violet/mint/gray palette
- `<WhatIfChatBubble />` — chat bubble with inline before/after chart slot
- `<KPICard />` — net worth / cash flow / emergency fund, ring or sparkline + AnimatedNumber
- `<AssumptionsSheet />` — collapsed settings sheet, editable inflation/return rates
- `<PlanCompareCard />` — swipeable plan card with AllocationDonut + Expected CAGR + Monthly SIP + AI narrative excerpt

---

## Non-Negotiable Guardrails

1. **Deterministic Calculations Only**: Every AI-generated number stays deterministic under the hood. The UI can animate and style the number, but the value itself must come from the backend calc engine / mock math layer, never from LLM arithmetic.
2. **Editable Assumptions**: Assumption values (inflation %, expected returns) must always be visibly editable, never buried as hidden constants — the "⚙ Adjust assumptions" sheet is a trust requirement.
3. **Transparent Danger States**: Negative net worth / negative cash flow is flagged clearly in red/danger style, never hidden or blocked with an error screen.
4. **Numbers First in What-If**: What-if answers must show the recalculated numbers before the LLM's explanation renders, so the user never sees prose that outruns the math.

---

# PART 2 — Antigravity Build Prompt

*Copy everything in the box below into Antigravity as your build prompt.*

```markdown
Build "Octovova Finance" — a modern personal finance planning web app frontend in the visual language of ET Money, CRED, and Groww: dark-first, premium, animated, data-forward. This is NOT a generic form-based fintech admin panel — treat every screen as a product screen, not a CRUD form.

STACK
React + Next.js (App Router) + TypeScript
Tailwind CSS for styling
Recharts for all charts (donut, sparkline, bar)
Framer Motion for transitions and number animations
Lucide React for clean modern iconography
Use a mock API layer (in /lib/mockApi.ts) matching the endpoint contracts below so the UI is fully functional standalone; keep the fetch calls isolated so they're trivial to swap to a real backend later.

DESIGN SYSTEM (apply globally via Tailwind config + CSS variables — do not deviate)
Background: #0B0E14 | Surface: #12161F | Surface-raised: #1A1F2B | Border: #232937 (1px hairline)
Accent primary: gradient #6C5CE7 -> #8B7FFF (violet) — used for CTAs, active states, progress
Accent secondary: #00D9A3 (mint) — ONLY for positive/gain values and "on track" states
Danger: #FF5C7A — ONLY for warnings, negative cash flow, shortfalls, risk flags
Text: primary #F5F6FA, secondary #8A8FA3, tertiary #565B6E
Font: Inter (headings slightly heavier weight, numbers use tabular nums and are visually larger than surrounding body text)
Corner radius: 20px cards, 14px buttons/inputs, 999px pills/badges
No drop shadows on dark surfaces — separate elements using the 1px border + background luminance steps only
All value changes (numbers, chart segments) animate over 200–800ms ease-out; never snap instantly

SCREENS TO BUILD (in this order)

1. Welcome + Identity
- Full-screen, centered, single field at a time (name, then age); auto-advances on valid entry
- Validation: name 2–60 chars, age 18–75, inline error state (danger color, no alert popups)

2. Add Income Sources
- Swipeable/stacked cards, one per income entry, dropdown for source (Salary / Business / Rental / Other), number input for monthly_amount (>0, <= 1 crore)
- Floating "+ Add Income" button; running total pinned at top, animates on change

3. Add Expenses
- Category chips with icons: Housing, Food, Transport, EMI, Other
- Tap a chip to reveal amount input inline (>=0); running total + a small live donut showing expense breakdown by category, updating as entries are added

4. Your Assets
- Icon-led list, dropdown type (Cash / FD / Mutual Fund / Stocks / Property / Other), value >=0
- A live "net worth" ring/counter component visible on this screen and the next (assets minus liabilities so far), animates on every keystroke (debounced)

5. Your Liabilities
- Same list pattern, dropdown (Home Loan / Personal Loan / Credit Card / Other), outstanding amount >=0, optional interest_rate (0–36%, defaults by type — Home Loan 8.5, Personal Loan 14, Credit Card 36, Other 12), shown as a small red-tinted badge next to each entry

6. Risk Assessment Quiz
- Full-screen, one question at a time, 5 questions total (investment horizon, reaction to a 20% drop, primary goal type, income stability, prior experience), each scored 1–5
- Large tappable option cards (not native radio buttons), 5 options per question, progress dots at the top, subtle scale/tap animation on selection, auto-advance after selection with a short delay
- On completion, show an animated reveal of risk score (out of 25) and category (Conservative / Moderate / Balanced / Growth / Aggressive)

7. Set Your Goals
- Icon grid to pick goal_type first (House, Retirement, Education, Wedding, Custom)
- Then a card per goal: target_year (year picker, current year+1 to +50), today_cost (>0), priority (default 3, shown as a draggable chip 1–5, not a slider)
- CRITICAL: as today_cost and target_year are entered, show a live-updating preview line below the inputs: "₹[today_cost] today -> ₹[computed_future_value] in [years] years" using future_value = today_cost * (1 + inflation_rate)^years, recalculating on every keystroke (debounced ~300ms). Default inflation_rate = 6%, sourced from the Assumptions panel below — do NOT hardcode it separately in this screen.

8. Assumptions Panel (global, accessible from a gear icon in the top bar on every screen after onboarding, and specifically linked from the Goals screen)
- Collapsed bottom sheet by default. Contains: inflation_rate (default 6%, editable), expected returns per asset class (Equity 11%, Debt 6.5%, Cash 4% — clearly labeled "assumption, not a guarantee"). Changing a value here live-recalculates every dependent number shown elsewhere in the app (goals preview, plans, dashboard).

9. Dashboard (home screen after onboarding is complete — this is the "return to" screen)
- Hero: animated Net Worth number (large, tabular-nums), small sparkline of cash flow beneath it
- KPI row: Cash Flow, Emergency Fund (X of 6 months covered — render as a partial-fill ring, red if <6, mint if >=6), Risk Category badge
- Horizontal scroll of goal progress rings, one per goal, % funded
- Warnings surfaced as dismissible banner cards (danger-tinted), e.g., "Emergency fund covers only 2 of 6 recommended months" — never a blocking modal
- "Generate Plans" primary CTA (gradient button) if no plan exists yet; once plans exist, show the AI-generated one-line plan summary as a card here instead of the CTA

10. Plans / Compare
- 2–3 plan cards (Conservative / Balanced / Growth, driven by mock API): swipeable on mobile, side-by-side on desktop
- Each card: AllocationDonut (equity/debt/cash, violet/mint/gray), expected CAGR %, monthly_investment_required (AnimatedNumber), and risk suitability badge
- Tapping a plan opens a detail sheet with the AI-generated narrative explanation plus a "Select this plan" button

11. What-If Chat
- Full chat interface, user types free text (max 500 chars, sanitized display)
- On a recognized what-if (mock: intercept for "inflation", "income", "invest", "delay" keywords and return a calculated before/after delta), render the assistant's reply as: (a) an inline before/after mini-chart or number comparison FIRST, (b) the natural-language explanation text SECOND — never the reverse order
- Unrecognized/out-of-scope questions get a graceful canned reply: "I can help with income, contributions, inflation, and retirement timeline changes right now."

12. Feedback
- NOT a separate page — a bottom sheet triggered by a "How was this plan?" prompt after the user views a plan detail sheet for a few seconds, or from a persistent small feedback icon
- Star/slider rating (1–5, required) + optional comment (max 500 chars)

COMPONENTS TO BUILD AS REUSABLE
<AnimatedNumber value={amount} currency="INR" /> — formats with lakh/crore grouping, counts up/down smoothly on value change
<GoalCard />, <RiskQuizCard />, <AllocationDonut />, <WhatIfChatBubble />, <KPICard />, <AssumptionsSheet />, <PlanCompareCard />

MOCK API CONTRACTS (implement in /lib/mockApi.ts, matching this shape so a real backend can be swapped in later without touching components)
POST /customers/{id}/profile         -> validated profile/income/expense/asset/liability records
POST /customers/{id}/risk-assessment -> { score, category }
POST /customers/{id}/goals           -> { goal_id, future_value }
POST /customers/{id}/plans/generate  -> array of { plan_id, type, allocation: { equity, debt, cash }, expected_cagr, monthly_investment_required, narrative: { name, explanation, risk_note } }
POST /customers/{id}/plans/{id}/what-if -> { parsed_intent, old_value, new_value, delta_amount, explanation }
POST /customers/{id}/feedback        -> { feedback_id }

GUARDRAILS (do not compromise these for visual polish)
1. Every displayed number must trace back to a plain deterministic calculation in the mock API layer (or later, the real backend) — components only format and animate, they never compute financial values themselves.
2. The Assumptions panel must always be reachable in <=2 taps from any screen post-onboarding.
3. Negative net worth or negative cash flow renders in the danger color with a clear label — never suppressed, never blocking navigation.
4. In the What-If chat, recalculated numbers must appear before the LLM-style explanation text in every response, both visually (chart/number block above) and in DOM order.

Build mobile-first, responsive up to a desktop two-column layout for the Dashboard and Plans screens. Ship with realistic seeded demo data (one demo customer, 2 income sources, 5 expense categories, 4 assets, 2 liabilities, a completed risk quiz, 2 goals) so the whole flow is explorable immediately without manual data entry.
```
