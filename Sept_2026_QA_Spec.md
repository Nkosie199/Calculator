# Calculator — September 2026 QA Spec

Source: *QA Testing Notes — September Round* (25 Sep 2026).
Target: launch-ready, zero known bugs, **1 January 2027**.
Tracking: DeepDiary project **"Calculator - CEO backlog"** (id 21).

## 1. QA finding

### CA-1 On a phone, the AI box comes before the calculator (Low, enhancement)

**Report:** "the first thing that you see on the phone is the AI chatbot and you have to scroll down to the calculator."

**Current layout (`index.html`):** header → `#welcomeBanner` (first visit) → `#askForm` / `#askResult` (natural-language "Ask") → `main#calculator`. On a 375 px phone the keypad starts below the fold.

**Fix:**
1. The calculator (display + keypad) is the first thing in the viewport on every width. At < 768 px the keypad fills the screen.
2. "Ask" becomes a compact button in the header (sparkle icon, "Ask") that opens a bottom sheet with the input and result. The display gets a small "Ask" chip too, so a typed word problem can be sent from the display.
3. The welcome banner shows once, as a dismissible one-line strip under the header, not a card above the keypad.
4. Desktop (≥ 1024 px): calculator left, Ask panel right, both visible.

**Acceptance:** at 320, 375 and 768 px the full keypad is visible without scrolling on first load (with and without the welcome strip); Ask opens and answers from the header; axe clean in both themes.

## 2. Home hub

The calculator is the home. Around it:

| Element | Content |
|---|---|
| Mode switcher | Standard, Scientific, Graph, Equations, Matrix, Units, Dates, Stats (existing modes), last used remembered |
| History | Last 10 results (existing overlay) with copy/reuse |
| Favourites | Pinned conversions/formulas |

No cross-app cards; the Calculator is intentionally single-purpose. It's reachable from Mynger's Apps page and from SuperAI answers that contain a calculation ("Open in Calculator").

## DeepDiary tasks

- #173 Keypad first on phones (CA-1)
