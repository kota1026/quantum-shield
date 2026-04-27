# UX Regression Hunter

Automated UI regression detection using Playwright screenshots + Claude vision.

## Why

Pixel-diff tools (Percy, Chromatic) flood you with noise — anti-aliasing, font
hinting, sub-pixel rendering all trigger false positives. We use Claude as the
classifier so a regression is judged by *whether a human would notice*, not by
RGB delta.

## Pipeline

```
[Playwright capture] → screenshots → [pixel hash filter] → [Claude vision] → report.md/json → CI gate
```

1. **`capture.spec.ts`** — drives Playwright across `routes.ts`, captures
   full-page PNGs at 3 viewports (desktop/tablet/mobile). Volatile elements
   (timestamps, block counters) are masked via CSS to suppress known noise.
2. **`vision-diff.ts`** — for each pair, compares SHA-256. If identical →
   `severity: none`. Else sends both images to Claude with a strict rubric:
   `none | cosmetic | regression | broken`. Returns structured JSON.
3. **CI gate** — non-zero exit if any pair is `regression` or `broken`. Cosmetic
   diffs are reported but not blocking by default (configurable via `UX_FAIL_ON`).

## Commands

Add to `src/frontend/web/package.json` scripts:

```json
{
  "ux:baseline": "UX_MODE=baseline playwright test e2e/visual-regression/capture.spec.ts",
  "ux:capture":  "UX_MODE=current  playwright test e2e/visual-regression/capture.spec.ts",
  "ux:diff":     "tsx e2e/visual-regression/vision-diff.ts",
  "ux:full":     "pnpm ux:capture && pnpm ux:diff"
}
```

Local workflow:
```bash
# After intentional UI change — refresh the reference corpus:
pnpm ux:baseline
git add e2e/visual-regression/.snapshots/baseline
git commit -m "ux: refresh visual baselines"

# On feature branch — check for regressions:
pnpm ux:full
open e2e/visual-regression/report.md
```

CI workflow (excerpt):
```yaml
- run: pnpm ux:full
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    UX_FAIL_ON: regression
    UX_MAX_PAIRS: 30  # cost cap
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: ux-regression-report
    path: |
      src/frontend/web/e2e/visual-regression/report.md
      src/frontend/web/e2e/visual-regression/report.json
      src/frontend/web/e2e/visual-regression/.snapshots/current
```

## Severity Rubric

| Severity | Definition | CI gate (default) |
|----------|------------|-------------------|
| `none` | Pixel-identical or imperceptible | pass |
| `cosmetic` | Minor spacing/color drift, no comprehension impact | pass (warn) |
| `regression` | Layout break, broken alignment, contrast loss, missing element | **fail** |
| `broken` | Empty page, error overlay, missing CTA | **fail** |

## Cost & Limits

- ~1 vision call per changed pair. Pairs that hash-match skip the API entirely.
- `UX_MAX_PAIRS` caps the call count per run for cost control.
- Sonnet 4.6 vision pricing: ~$0.003/megapixel image. Full-page screenshots
  at 1440×3000 ≈ 4MP → ~$0.012/pair. A 30-pair run ≈ $0.36.

## Adding a route

Edit `routes.ts`. Each route needs:
- Stable `id` (used as filename key)
- `path` reachable without auth, OR fixture-loaded `storageState`
- `waitForTestId` or `waitFor` selector to suppress race-condition snapshots

## Suppressing volatile UI

Add `data-volatile="true"` to elements that change every render (live block
numbers, "X seconds ago" timers). The capture spec hides these via CSS so they
do not trigger Claude on every run.

## Limitations

- Auth-gated routes (Consumer dashboard post-SIWE, Prover/Observer admin) are
  excluded by default. Add a wallet fixture + `storageState` to include them.
- Claude judgement is non-deterministic. The rubric is conservative ("prefer
  regression over cosmetic if unsure"), so false positives are possible.
  Re-run on disagreement; persistent classification is the signal.
- This is a UI-only check. Functional regressions (correct number, correct
  state transition) are still the job of `consumer/`, `governance/`, etc. specs.
