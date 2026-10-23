# InvoiceTemplateMaker V4.1.1 validation report

Date: 2026-10-23  
Baseline: `main` at `989df3f`  
Release state: local working tree only; no commit, push, Cloudflare upload, deployment, or production promotion was performed.

## A. Problems fixed

### 1. GitHub Actions reminder timeout

- **Original problem:** the desktop Chromium reminder test timed out after 60 seconds in GitHub Actions while the equivalent mobile case passed.
- **Root cause:** `getByLabel("Firm reminder").check()` attempted to click the visually hidden one-pixel radio control. Its visible label content intercepted the pointer action, so Playwright retried until the test timeout. The reminder generator, clipboard behavior, and email link were not the cause.
- **Files changed:** `tests/browser/reminder.spec.ts`, `playwright.config.ts`, `.github/workflows/verify.yml`.
- **Solution:** click the visible tone card and assert that the associated radio becomes checked. Playwright now also writes an HTML report, and failed CI runs upload traces, screenshots, error context, and the report as a 14-day diagnostic artifact. The workflow still fails normally when a test fails.
- **Verification:** the exact desktop test passed 10 consecutive CI-style repetitions. The full desktop/mobile Chromium suite passed twice.
- **Limitation:** the updated GitHub-hosted workflow cannot be called green until this working tree is committed, pushed, and the remote run succeeds.

### 2. English homepage canonical conflict

- **Original problem:** Google selected `/` instead of the declared `/en/` canonical. The root page was self-canonical and duplicated the English generator message while also redirecting users by language.
- **Best-supported diagnosis:** duplicate English fallback content and site-wide `x-default` links to `/` created stronger and less coherent root signals than intended. Google alone determines its selected canonical, so code can improve the signals but cannot force the outcome.
- **Files changed:** `app/(entry)/layout.tsx`, `app/(entry)/page.tsx`, `app/globals.css`, `lib/seo.ts`, `app/sitemap.ts`, `scripts/verify-static.mjs`, `tests/browser/locale-routing.spec.ts`.
- **Solution:** keep `/` as a real language-neutral, self-canonical selector and `x-default` for the homepage group. Its static fallback is now bilingual and no longer duplicates the English generator homepage, with `lang="und"` and crawlable links to both localized homepages. `/en/` and `/fr/` remain accessible, indexable, and self-canonical. The pre-paint root redirect still respects a saved choice and browser language; explicit localized URLs never redirect away.
- **Verification:** static checks validated root, both localized homepages, all canonical tags, initial HTML, sitemap entries, links, and indexability. Browser tests covered French browser detection, saved preference, explicit `/en/`, and manual language switching.
- **Limitation:** Google must recrawl the changed pages before Search Console can show whether it selected `/en/` as the English canonical.

### 3. Page-specific hreflang and `x-default`

- **Original problem:** every localized tool, guide, article, and legal page declared the unrelated root homepage as `x-default`.
- **Root cause:** one shared metadata/sitemap implementation added root `x-default` to every route group.
- **Files changed:** `lib/seo.ts`, `app/sitemap.ts`, `scripts/verify-static.mjs`.
- **Solution:** every translated route retains reciprocal, fully qualified `en` and `fr` alternatives. Only the homepage language group declares `/` as `x-default`; non-home route groups omit it because no equivalent language-neutral page exists. HTML and sitemap metadata now use the same helper.
- **Verification:** the static verifier checks exactly one canonical, the exact expected hreflang set, reciprocal route pairs, valid generated targets, matching sitemap alternates, supported route keys, absence of duplicate canonicals, and absence of `noindex` across all 26 localized routes.
- **Limitation:** search engines need to recrawl the affected route groups before their indexed hreflang interpretation changes.

### 4. Analytics consent enforcement

- **Original problem:** custom events were allowed whenever `window.gtag` existed, even after a previously consenting visitor withdrew consent.
- **Root cause:** event dispatch depended on script availability rather than the active consent state.
- **Files changed:** `lib/analytics.ts`, `components/AnalyticsConsent.tsx`, `tests/analytics.test.ts`, `tests/browser/analytics.spec.ts`.
- **Solution:** custom event dispatch now fails closed unless active analytics consent is true. Accepting or withdrawing updates both GA consent state and `ga-disable-G-PMW46NFNGD`; withdrawal blocks events immediately. The analytics script is still absent before consent, storage failures are handled without breaking the product, re-granting works, ad-related consent stays denied, and duplicate script initialization is avoided by stable Next Script IDs.
- **Verification:** unit and browser tests cover no consent, accept, decline, withdrawal without reload, reload after decline, re-grant, outgoing collection requests, a blocked provider, successful PDF/reminder actions, and a fully paid reminder that must not count as generated.
- **Privacy:** preserved event parameters are limited to anonymous product context. Tests assert that private invoice field names/content are absent from the analytics payload.
- **Limitation:** browser automation uses a deterministic local GA transport mock so it can assert network gating without sending test traffic to the real property.

### 5. Cloudflare upload-only release workflow

- **Original problem:** the desired push-to-upload/manual-promotion workflow needed confirmation, without accidentally introducing automatic production deployment.
- **Files audited:** `wrangler.jsonc`, `.github/workflows/verify.yml`, `package.json`, `README.md`, `docs/cloudflare-release.md`.
- **Result:** the Worker is `invoice-template-maker`, assets come from `./out`, Wrangler is pinned, GitHub Actions is validation-only, and there is only one repository workflow. It has no Cloudflare credentials or upload/deploy step. The release guide already documents `npm run check`, `npx wrangler versions upload --config wrangler.jsonc`, Version URL testing, manual promotion, and rollback.
- **Verification:** `wrangler deploy --dry-run` read 358 exported files, found no bindings, and exited without uploading. Repository search found no competing automatic production pipeline. The live HTTP endpoint redirected to the same HTTPS path and query with `301`.
- **Limitation:** local files cannot verify the connected Cloudflare repository, production branch, build token, dashboard commands, build history, Version URL setting, or active production version.

## B. GitHub Actions

- Original failure: `English reminder adapts dates and exposes deliberate copy and email actions` in desktop Chromium.
- Exact cause: Playwright was targeting the hidden radio input; its visible tone-card label intercepted pointer events until timeout.
- Fix: click the actual visible card, then assert its radio state.
- Diagnostics: HTML report plus retained traces, failure screenshots, error context, and conditional artifact upload using `actions/upload-artifact@v6`.
- Runtime alignment: workflow uses Node.js 24, `actions/checkout@v5`, `actions/setup-node@v5`, bundled Chromium, and `CI=true`.
- Local matrix: both complete CI-style browser runs passed with 39 passed and one intentional desktop-project skip each.
- Remote state: unverified until a pushed commit produces a successful GitHub-hosted run.

## C. SEO

- `/`: self-canonical language-neutral entry page, `lang="und"`, bilingual fallback, automatic saved/browser-language routing, and homepage-only `x-default`.
- `/en/`: self-canonical English homepage and the intended English search URL.
- `/fr/`: self-canonical French homepage and the intended French search URL.
- All non-home translations: reciprocal `en`/`fr` alternates only; unrelated root `x-default` removed.
- Sitemap: generated from the same alternate helper as HTML metadata, preventing drift.
- Preserved URLs: existing localized routes, including `/en/how-to-make-an-invoice/`, remain unchanged and self-canonical.
- Recrawl needed: `/`, `/en/`, `/fr/`, the sitemap, and localized route groups whose `x-default` changed.

This strategy keeps the useful language-neutral entry experience without publishing a second English homepage. It also follows Google's requirement that language alternatives identify themselves and their reciprocal equivalents, while reserving `x-default` for a genuine selector/fallback page.

## D. Analytics

- Consent is an explicit dispatch prerequisite, not an inferred side effect of `gtag` existing.
- Withdrawal sets GA's disable property, sends a denied consent update when available, and blocks custom events immediately.
- Saved consent is applied on future loads; no saved consent or inaccessible storage fails closed.
- Re-grant restores consent without duplicating initialization, and provider failure does not affect invoice creation.
- Preserved events: `invoice_template_selected`, `invoice_customization_started`, `invoice_pdf_download`, `payment_reminder_generated`, `payment_reminder_copy`, and `invoice_to_reminder`.
- No client names, business names, invoice numbers, addresses, descriptions, banking data, reminder text, or other invoice content is intentionally sent.

## E. Cloudflare

- Repository configuration: static Worker `invoice-template-maker`, asset directory `./out`, no bindings.
- Required dashboard values to confirm: GitHub repository `Mohammedaminetaoufik/invoice-template-maker`, branch `main`, root `/`, build command `npm run check`, deploy command `npx wrangler versions upload --config wrangler.jsonc`.
- GitHub Actions must remain validation-only to avoid a second competing publisher.
- Promotion: open the uploaded version in **Deployments**, test its Version URL against the release checklist, verify its commit SHA, then manually deploy that version at 100% traffic only after approval.
- Rollback: select the previous known-good version in **Deployments** and roll it back to 100% traffic. A Wrangler rollback changes production immediately and therefore requires explicit operational approval.
- Remote Cloudflare settings and histories remain unverified.

## F. Test results

| Validation | Result |
| --- | --- |
| `npm ci` | Passed; 251 packages installed. npm reported one critical dependency advisory. |
| TypeScript | Passed. |
| Unit tests | 202 passed in 15 files; 0 failed. |
| Production build | Passed; 33 static pages generated and PWA service worker built. |
| Static SEO verifier | Passed; root routing plus 26 localized routes, metadata, canonicals, hreflang, sitemap, robots, assets, links, structured data, and embedded fonts verified. |
| Former flaky reminder case | 10/10 CI-style desktop repetitions passed. |
| Focused analytics and locale tests | 12 passed across desktop/mobile Chromium. |
| Full browser suite, run 1 | 39 passed, 1 intentional desktop-project skip, 0 failed. |
| Full browser suite, run 2 | 39 passed, 1 intentional desktop-project skip, 0 failed. |
| Cloudflare dry-run | Passed; 358 asset files read, no bindings, no upload. |
| Live HTTP to HTTPS | Passed; `301`, with path and query preserved. |
| Final diff whitespace check | Passed. |

Next.js 16.4.0 and `npm audit --omit=dev` reported one critical vulnerable package covering GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, and GHSA-673q-mjm6-r5xr. The build succeeded on the required retry, but a dependency security upgrade remains recommended and was intentionally not mixed into this focused release.

## G. Remaining actions

1. Run and validate `next upgrade --agent=security --internal-nudge-id=a391a053-def4-409d-bc33-61142ab35cdc` in an isolated worktree before release, or explicitly accept the current dependency risk for this release.
2. Review these uncommitted V4.1.1 changes, then explicitly authorize a commit and push to `main` when ready.
3. Confirm the pushed commit's GitHub Actions run is green; download the diagnostic artifact if browser validation fails remotely.
4. Confirm the exact Cloudflare dashboard repository, `main` branch, root, build command, upload-only command, token, and Version URL setting. Verify there is no external competing deploy hook.
5. Test the uploaded version through its Version URL, compare the commit SHA, and manually promote it only after approval. Record the previous production version first for rollback.
6. After production promotion, submit or revalidate the sitemap and request recrawling for `/`, `/en/`, and `/fr/` in Search Console. Monitor Google's selected canonical without assuming an immediate change.
