# Calculator

A fast, offline-first scientific calculator. Static site, no login, no tracking, deterministic
output. See [docs/CALCULATOR-2.0-SPEC.md](docs/CALCULATOR-2.0-SPEC.md) for the full product/technical spec.

## Stack

Vite + TypeScript. The math engine (`src/core/parser`) is a hand-written tokenizer/parser/evaluator
(no `eval`, no `Function()`), framework-independent and fully unit-tested. The UI (`src/ui`, `src/main.ts`)
is a thin DOM layer on top of it — no framework needed for a single interactive view.

## Prerequisites

Node 20+, npm.

## Commands

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build       # typecheck + production build to dist/
npm run preview     # serve the built dist/ locally, to sanity-check the static output
npm run test        # run the parser/evaluator test suite once
npm run test:watch  # run tests in watch mode
npm run typecheck   # typecheck only, no build
```

## Deployment

Static site, deploys to Netlify from `dist/` (see `netlify.toml`). No serverless functions, no
backend, nothing to configure beyond the build command and publish directory.

## Status

All four spec phases are implemented:

- **Phase 1**: core arithmetic engine, scientific functions, memory, history, themes, keyboard
  input, PWA/offline support.
- **Phase 2**: function graphing, equation solving, matrices, statistics, complex numbers,
  base-N/bitwise, unit conversion, date math — each its own mode tab.
- **Phase 3** (`src/core/symbolic/`, "Calculus" tab): symbolic differentiation (incl. chain/product/
  quotient rules and higher orders), symbolic integration of common elementary forms, algebraic
  simplification, Taylor/Maclaurin series, and polynomial factoring (rational-root search + the
  quadratic formula for the final remainder). All cross-checked against numeric differentiation/
  integration in the test suite, not just exact-string assertions.
- **Phase 4** (`src/core/query/`, the "Ask" bar at the top of the app, visible in every mode): a
  fixed, regex-based grammar — not an AI model — that routes phrases like "derivative of x^2",
  "solve x^2 - 4 = 0", "5 km in miles", or "plot sin(x)" to the right module above, with a plain
  expression-evaluation fallback and a graceful "here's what I understand" error state otherwise.

Domain migration to `calculator.mynger.com` and the PWA icon/privacy-contact follow-ups from the
spec are still open — see `docs/CALCULATOR-2.0-SPEC.md` §9 and the repo's earlier notes.
