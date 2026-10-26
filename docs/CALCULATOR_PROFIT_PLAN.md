# Calculator Profit Plan — Finalized

**Source:** DeepDiary project 21 ("Calculator - CEO backlog"), task 137. v1 drafted 2026-09-21 by
`ceo-calculator`; finalized 2026-10-26 by the Board. Status: **Done**. The task is closed in
DeepDiary and the summary is posted to the "Calculator CEO Office" Converse room.

## What the app is

**Join Calculator so that you can solve any maths instantly and offline, and earn COA by solving
other people's maths bounties.**

Live state on 2026-10-26: https://calculator.mynger.com returns 200 on Netlify (free tier; no
Netlify charges in the financial statements). The GA4 tag merged on 11 October is not deployed yet
(task 226). The spec (`docs/CALCULATOR-2.0-SPEC.md`) keeps it static, offline, deterministic, with
no login, server, ads or default telemetry. No CI.

## Group money rules (Board, 2026-10-26)

1. Every app must be profitable on its own costs, as if it ran alone.
2. The 10% withdrawal fee belongs to the app that made the sale.
3. Every revenue generator has its own entry in OpenBank's money-movement table.
4. All money moves through BlockBank/OpenBank. Users spend only COA inside the apps.

## Revenue model (approved): math bounties

Guest mode stays exactly as it is. Signing in with Mynger is only needed for bounties.

1. A signed-in user posts a problem with a COA bounty (**minimum R100**, configurable), a deadline
   and the correct answer, which stays hidden. The COA is held in escrow (`calculator/BOUNTY_HOLD`),
   on the same pattern as Luckybird's hosted-session escrow.
2. Solvers submit answers, hidden from everyone until the deadline.
3. At the deadline the answer is revealed. Calculator's deterministic engine checks submissions
   for mathematical equivalence (`1/2`, `0.5` and `2/4` all count), and the first correct one wins
   automatically (`calculator/BOUNTY_PAYOUT`). If nobody is right, the poster is refunded
   (`calculator/BOUNTY_REFUND`).
4. Users rate the revealed answer, building poster reputation and flagging bad answer keys.

**Board UI:** styled like the EA FC Ultimate Team transfer market. Each bounty is a card with the
problem, the bounty and the time left. The list is sorted by ending soonest by default and can be
re-sorted by bounty size or newest.

Winners keep 100%; Calculator earns 10% when they withdraw. The draft's donations link, Pro
licence, embed licences, sponsored pages and app-store wrapper are dropped.

**Spec change:** `CALCULATOR-2.0-SPEC.md` gains one exception to "no server", for signed-in
bounties only. Guest mode keeps every original constraint.

## Costs (resolved 2026-10-26)

| Line | $/month |
|---|---|
| Netlify (static site) | 0 |
| Own RDS Postgres db.t4g.micro, 20 GB (bounty backend) | ~14.70 |
| Own EC2 t3.micro (bounty backend) | ~12.70 |
| Route 53 zone and domain renewal | ~1.80 |
| VAT 15% | ~4.40 |
| **AWS subtotal** | **~33.60 (≈ R590)** |
| AI engineering: one Claude Pro seat for the daily ticket agent | R381 |
| **Total** | **≈ R970/month** |

Netlify stays: the guest calculator is still static, and moving it would add cost for no gain.

**Break-even:** about 97 minimum-size (R100) bounties a month, or fewer large ones.

## Timeline

**Profit date: 2027-12-31** (moved from 2026-12-31). Start: 2027-01-01.

Scheduling rule: one agent on a daily cron does one small ticket per day, and dependent tickets run
back to back. Dates are re-baselined as work lands.

### Before 2027-01-01 (Mynger Portfolio Dec 31 Launch Plan, ~4 agent-days)

| Ticket | Work | Days |
|---|---|---|
| 226 | Deploy master to Netlify so the GA4 tag and new privacy copy go live | 1 |
| new | CI | 2 |
| 211 | Brand colours | 1 |

### 2027 build (~14 agent-days, done by about 14 January)

| Dates | Work | Days |
|---|---|---|
| Jan 1 | Bounty spec (and the spec exception) | 1 |
| Jan 2–5 | Backend: bounties, hidden answers, submissions, deadline job | 4 |
| Jan 6–7 | Escrow movements (`BOUNTY_HOLD`, `BOUNTY_PAYOUT`, `BOUNTY_REFUND`) | 2 |
| Jan 8–9 | Equivalence check with the existing engine | 2 |
| Jan 10–12 | Transfer-market board UI with sorting | 3 |
| Jan 13 | Posting and solving flow | 1 |
| Jan 14 | Answer rating | 1 |

Bounties go public with BlockBank's public-money launch (2027-03-01).

## Marketing (cash budget R0)

Students and maths communities. Every bounty card can be shared to Mynger rooms and WhatsApp. No
referral codes.

## Risks carried forward

- A wrong answer key from a poster: ratings flag it, and repeat offenders can be limited.
- Answers must stay hidden server-side until the deadline.
- BlockBank's public-money launch gates bounties.
- One agent: any blocked ticket delays every ticket after it.
