# Calculator 2.0 — Product & Technical Spec

Status: **DRAFT — awaiting approval**
Owner: Nkosi
Target domain: `calculator.mynger.com`
Current state: static HTML/CSS/JS app (`public/`), deployed to Netlify at a `*.netlify.app` URL, using `math.js` client-side with a regex-sanitized `math.evaluate()` call.

---

## 1. Vision

Turn the current 4-function toy calculator into the best calculator **web app** in its class: a fast, installable, fully client-side scientific/graphing/symbolic calculator that feels like Wolfram Alpha's computation engine, without a login and without a server.

**One-line pitch:** everything Wolfram Alpha can *compute*, none of what it needs a *backend* for.

## 2. Hard constraints (non-negotiable)

These came directly from the brief and shape every decision below:

1. **Static site.** Ships as pre-built HTML/CSS/JS/WASM assets. No server-side rendering, no API routes, no database, no serverless functions required for core functionality. Must deploy to Netlify as a static publish directory, and must be trivially re-deployable to verify staticness (`netlify deploy` with a build dir, no "Functions" needed).
2. **Deterministic outputs.** Same input → same output, always, forever. This rules out:
   - Calling an LLM to interpret or answer queries (non-deterministic, needs a backend/API key, costs money per request).
   - Depending on live/real-time data for *core* features (exchange rates, weather, stock prices) unless explicitly opt-in and clearly labeled as such (see §7.5).
3. **No login.** No accounts, no auth, no server-side user data. Anything "remembered" (history, preferences) lives in the browser only (`localStorage`/`IndexedDB`).
4. **Custom domain.** Migrate from the current Netlify subdomain to `calculator.mynger.com`, matching the convention used by the user's other Mynger apps.

## 3. Scope: what "Wolfram Alpha level" means here

Wolfram Alpha is really two products bolted together: (a) a symbolic/numeric **computation engine**, and (b) a natural-language **knowledge engine** backed by curated datasets and live data, running on a big server farm. Constraint #2 above means we can only build (a), plus a *deterministic, offline* slice of (b) — a local grammar that parses phrases like "derivative of x^2" without calling any AI model. That's still a huge, legitimate step up from a 4-function calculator, and it's what this spec targets.

**Explicitly out of scope for this app** (call these out to the user as the boundary of "static + deterministic"):
- Free-form natural-language question answering ("who was the 3rd president") — that's a knowledge lookup, not a computation, and needs a backend or a bundled encyclopedia.
- Live data: currency exchange, weather, stocks, "what's the date in Tokyo right now" — technically possible from a static site via client-side `fetch()` to a public API, but breaks determinism/offline-first and introduces third-party network calls. Proposed as an **optional, clearly-labeled, opt-in module** (§7.5), off by default.

## 4. Feature roadmap (phased)

### Phase 1 — Solid foundation (replaces the current app 1:1, done right)
- Proper **tokenizer + recursive-descent parser + evaluator** (no `math.evaluate(rawString)` on user input, no `eval`). Full operator precedence, unary minus, implicit multiplication (`2π`, `3(4+5)`), nested parentheses.
- Operators: `+ − × ÷ ^ %`, and functions: `sin cos tan asin acos atan sinh cosh tanh log ln exp sqrt cbrt abs floor ceil round`.
- Constants: `π`, `e`.
- Degrees/Radians toggle.
- Memory: `M+ M- MR MC`.
- Percentage key with calculator-conventional semantics (`100 + 10% = 110`).
- Backspace, All-Clear, decimal point, keyboard input (full keyboard mapping incl. `Enter`=`=`, `Esc`=`AC`).
- Calculation history persisted in `localStorage`, exportable/clearable, click-to-recall.
- Error states are explicit and typed (divide-by-zero, domain error e.g. `asin(2)`, syntax error) rather than a generic `"Error"` string.
- Responsive layout (mobile-first), light/dark theme (respects `prefers-color-scheme`, manual toggle persisted).
- Accessibility: full keyboard navigation, ARIA live region on the display so screen readers announce results, visible focus states, WCAG 2.1 AA contrast.
- Installable PWA: manifest + service worker, works fully offline after first load.

### Phase 2 — Scientific & graphing
- Scientific functions beyond Phase 1: factorial `n!`, `nPr`/`nCr`, `gcd`/`lcm`, logs of arbitrary base, hyperbolic inverses.
- **Base-N mode**: binary/octal/decimal/hex conversion and bitwise ops (AND/OR/XOR/NOT/shift).
- **Unit conversion**: length, mass, volume, temperature, speed, data size, time — all offline, static conversion tables bundled with the app (no live rates).
- **Statistics mode**: enter a data set → mean, median, mode, variance, stdev (population/sample), quartiles, linear regression.
- **Function graphing**: plot `y = f(x)` (and eventually parametric/polar), pan/zoom, multiple traces, readout of value at cursor, find roots/extrema/intersections numerically on the graph.
- **Equation solver**: linear & quadratic (exact, via the quadratic formula incl. complex roots), numeric root-finding for arbitrary single-variable equations (bisection/Newton fallback), 2×2/3×3 linear systems.
- **Complex numbers**: arithmetic, modulus/argument, polar↔rectangular.
- **Matrices**: entry, add/subtract/multiply, determinant, inverse, transpose, up to a sane size (e.g. 6×6).
- **Date/time math**: add/subtract durations, day-of-week, day count between dates (fully computable offline, no timezone-API dependency needed for this).

### Phase 3 — Symbolic engine (CAS-lite)
- Symbolic differentiation of standard functions, symbolic simplification, factoring of polynomials, basic symbolic integration (power rule, common forms), Taylor/Maclaurin series expansion to N terms.
- Built on a proven JS/WASM computer-algebra library (e.g. `algebrite`/`nerdamer`, or hand-rolled for the subset we need) rather than reinventing a CAS from scratch — evaluated during implementation planning, not this spec.
- Step-by-step solution display for solves/derivatives where feasible (a key Wolfram Alpha differentiator).

### Phase 4 — "Ask it" query bar (deterministic NL-lite)
- A single input box layered on top of Phase 1–3 that recognizes a fixed, documented grammar of query patterns and routes them to the right module: `"derivative of x^2"`, `"solve x^2 - 4 = 0"`, `"5 km in miles"`, `"plot sin(x)"`, `"15% of 240"`, `"gcd(48, 18)"`. This is pattern-matching against a local grammar, not an AI model — same input always produces the same parse, fully offline.
- Graceful "did you mean…" / "unsupported query" messaging when a phrase doesn't match the grammar, rather than a silent failure.

Phases 2–4 are independently shippable; we can stop after any phase and already have shipped something meaningfully better than v1.

## 5. Explicitly NOT doing (unless you tell me otherwise)
- Accounts, sync-across-devices, cloud-saved history.
- Server-side anything (no functions, no API routes, no database).
- Ads.
- Any telemetry that phones home by default.

## 6. Architecture & tech stack

### 6.1 Frontend framework — recommendation

You mentioned Angular as an option. My recommendation is **Vite + TypeScript**, using small focused libraries rather than a heavy full framework, with **Angular as the fallback if you'd rather have its opinionated structure**. Reasoning:

| | Vite + TS (recommended) | Angular |
|---|---|---|
| Output | Static bundle, `vite build` → `dist/`, trivially static | Static bundle via `ng build`, also fine, but heavier runtime (zone.js, DI container) for an app that's fundamentally one interactive view |
| Bundle size / perf | Smaller, faster first paint — matters for a tool people expect to open instantly | Larger baseline even before your code |
| Fit for a math-heavy app | Plain TS gives you full control over the parser/evaluator/CAS core as framework-agnostic modules, UI is a thin layer on top | Same core is possible, but Angular's ceremony (modules, DI, RxJS) adds little value for a single-page calculator |
| Ecosystem for graphing/CAS | Any JS/WASM lib drops in easily | Same, just more wiring |
| Your stated bar ("super advanced") | Advanced ≠ heavy framework; advanced = the math engine, parser, CAS, graphing quality | Angular is a legitimate "advanced" choice if you specifically want it for other reasons (team familiarity, consistency with another Mynger app) |

**If you have another reason to want Angular** (e.g. consistency with another Mynger property, or you just like it), say so and I'll flip the spec — the core math/parser/CAS modules are framework-agnostic either way and the choice mostly affects the UI shell.

Either way:
- **TypeScript** throughout (correctness matters a lot for a calculator — this is the one place "it compiles" should mean something).
- Core packages, framework-independent, unit-testable in isolation:
  - `core/parser` — tokenizer + AST + evaluator
  - `core/units` — conversion tables
  - `core/stats`, `core/matrix`, `core/complex`
  - `core/cas` — symbolic engine (Phase 3)
  - `core/query` — NL-lite grammar (Phase 4)
- UI shell consumes `core/*` as a plain TS library — this also means the existing calculator's markup/CSS can be evolved incrementally rather than thrown away on day one.

### 6.2 Rendering for graphs
Canvas 2D (not an SVG-per-point plotting library) for performance at high point counts, hand-rolled or a small dependency-free plotting module — avoids pulling in a large charting library just to draw `y=f(x)`.

### 6.3 Testing
- Unit tests (Vitest) for the parser/evaluator/CAS with large tables of known-input → exact-output pairs (this is where "deterministic" gets enforced and regression-tested).
- Property-based tests for the parser (e.g. random valid expressions round-trip through tokenize→parse→evaluate without throwing).
- Visual/manual smoke test checklist for graphing (exact pixel-golden testing is overkill here).

### 6.4 PWA / offline
- `manifest.webmanifest`, service worker (Workbox or hand-rolled), precache all app assets. Works with no network after first visit — a genuine advantage over Wolfram Alpha, which requires a connection.

## 7. Non-functional requirements

1. **Performance:** Lighthouse Performance ≥ 95, first interaction < 1s on a mid-tier mobile device.
2. **Accessibility:** WCAG 2.1 AA, full keyboard operability, screen-reader-announced results.
3. **Browser support:** last 2 versions of Chrome/Edge/Firefox/Safari, iOS Safari, Android Chrome.
4. **No runtime backend dependency** for anything in Phases 1–3.
5. **Optional live-data module (currency conversion, etc.):**
   - Off by default.
   - If enabled, clearly labeled in the UI ("requires internet, rates may be delayed"), calls a public API directly from the browser (no Mynger server in the middle, so no new backend to build/maintain), and is the *only* part of the app allowed to be non-deterministic.
   - Ship this only if you confirm you want it — otherwise Phase 2 unit conversion stays 100% static tables (e.g. fixed physical unit ratios, which are constants, not exchange rates).
6. **Privacy:** see §8.
7. **No secrets/API keys in the client** — if the optional live-data module ships, it must use an API that doesn't require a secret key exposed client-side, or that module simply isn't offered.

## 8. Privacy policy

Given no login and no server, the honest privacy policy is short — but you should still publish one, both because app stores/PWA install prompts and general good practice expect it, and for consistency with your other Mynger properties. Proposed content (to live as a static route, e.g. `/privacy`):

- We do not collect, store, or transmit any personal data.
- All calculations happen locally in your browser.
- Calculation history and preferences (theme, angle mode, etc.) are stored only in your browser's local storage, on your device, and are never sent anywhere. Clearing your browser data removes them.
- This site uses no cookies, no accounts, and no third-party analytics or advertising trackers by default.
- If the optional currency/unit live-data feature is ever enabled by you, that specific action sends the amount/currency pair to a third-party rate provider — called out explicitly in that feature's UI — and nothing else on the site does this.
- If you later add any privacy-respecting analytics (e.g. Plausible/Fathom, or Netlify's server-log-based analytics which needs no client script), the policy gets a one-line addendum naming the provider and what it collects (typically aggregate page views, no personal data, no cross-site tracking). **Recommendation: ship with zero analytics initially**; add only if you decide you want usage numbers later.

I'll draft the actual `/privacy` page copy during implementation once you approve this spec.

## 9. Domain migration: Netlify subdomain → `calculator.mynger.com`

1. Keep deploying the *same* Netlify site (no need to recreate it) — add `calculator.mynger.com` as a custom domain in Netlify's site settings.
2. Add a `CNAME` (or `ALIAS`/`ANAME` at the zone apex if ever needed, not applicable for a subdomain) record at your DNS provider pointing `calculator` → the Netlify apex domain Netlify gives you (typically `<sitename>.netlify.app` or their load-balancer target) — same pattern presumably already used for your other `*.mynger.com` apps.
3. Netlify auto-provisions a Let's Encrypt cert for the custom domain once DNS resolves.
4. Set the old `*.netlify.app` URL to redirect (301) to `calculator.mynger.com` via a `_redirects` file (`/* https://calculator.mynger.com/:splat 301!`) or Netlify's domain-alias redirect setting, so old links/bookmarks keep working.
5. You then redeploy and hit the new domain directly to confirm the response is plain static files (no server round-trip beyond Netlify's static host) — e.g. check response headers show Netlify's static CDN, and there's no serverless function invoked in the request waterfall.

## 10. Migration plan for the existing app

- The current `public/index.html`/`index.css`/`index.js` becomes the seed for the new build's UI, not a throwaway — same visual language (purple accent, rounded buttons, history overlay) evolves rather than a total redesign, unless you'd like a visual refresh too (say so if you want that as part of this).
- `server.js`/`express`/local npm server: this was only ever for local preview and isn't part of the deployed static site (Netlify serves `public/` directly). It gets replaced by the new build tool's dev server (`vite dev` or `ng serve`) and can be deleted once the new toolchain is in place.
- Existing regex-sanitized `math.evaluate()` call gets removed entirely in favor of the new parser/evaluator — this also resolves the original brief's "no `eval`"-style constraint properly rather than working around it with a regex allowlist.

## 11. Decisions (confirmed 2026-09-13 — approved with recommended defaults)

1. **Framework:** Vite + TypeScript.
2. **How far to build now:** phase-by-phase, starting with Phase 1, reassess after each phase rather than committing blind to all four up front.
3. **Visual redesign:** evolve the current look (purple accent, rounded buttons, history overlay) rather than a from-scratch redesign.
4. **Optional live currency-conversion feature:** left out entirely — the app stays 100% deterministic and offline; unit conversion uses static physical-constant tables only.
5. **Analytics:** none.
6. **DNS access:** still needed from the user when we reach the domain-migration step (§9) — not required for Phase 1 implementation.

Implementation is now underway, starting with Phase 1.
