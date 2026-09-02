# Octovova Finance

> **"Eight inputs. One clear plan."**
> A modern personal finance planning engine built on a pure deterministic financial math core with AI-powered narrative explanations and interactive scenario simulation.

---

## 📁 Key Blueprint & Architecture Documents

1. [**CONSOLIDATED_BLUEPRINT.md**](./CONSOLIDATED_BLUEPRINT.md)
   - Complete 22-section hackathon architecture blueprint.
   - Pure deterministic calculation engine (Net Worth, Cash Flow, Inflation-adjusted Goal FV, Monthly Required SIP, Retirement Corpus).
   - Rule & allocation engine (5 risk categories, timeline overrides, cash flow guards).
   - GenAI orchestration, prompt engineering, and numeric cross-checking guardrails.
   - Database schema (PostgreSQL) and FastAPI REST API contracts.
   - *Note: Monte Carlo simulation has been completely removed across the system architecture, database, APIs, and UI.*

2. [**UI_MODERNIZATION_BRIEF.md**](./UI_MODERNIZATION_BRIEF.md)
   - Product & design system specification (CRED/Groww/ET Money design language).
   - Conversational onboarding flow, interactive risk quiz, live animated metric counters, and What-If simulator.
   - Copy-paste Antigravity build prompt for rapid frontend prototyping.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0
- **Database**: PostgreSQL / SQLite
- **AI Orchestration**: Claude 3.5 Sonnet / OpenAI GPT-4o with numeric cross-checking validation
