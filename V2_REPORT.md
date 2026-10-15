# InvoiceTemplateMaker V2 — Development and Deployment Handoff

> Historical V2 baseline. The visual-editor redesign, current verification results and release handoff are in [V3_REPORT.md](V3_REPORT.md). Preserve this report for the retained calculation, PDF, storage and deployment history.

Report date: 13 October 2026 (Africa/Casablanca).

## 1. Repository and deployment baseline

- Repository: `https://github.com/Mohammedaminetaoufik/invoice-template-maker`.
- Baseline commit: `3a08b5a` — automatic language routing and localization.
- Previous commits: `ee036cb` — Wrangler configuration; `0ff5365` — first commit.
- The working tree was clean at the start.
- Development branch: `feature/v2-pdf-reliability`.
- No commit, push, merge, production deployment, DNS change, Worker rename or GitHub integration change has been performed.

The preserved architecture is **Next.js static export → Cloudflare Workers Static Assets → custom domain**.

`next.config.ts` still has `output: "export"`, `trailingSlash: true`, and unoptimized images. `wrangler.jsonc` still declares Worker `invoice-template-maker`, compatibility date `2026-10-12`, asset directory `./out`, and `not_found_handling: "404-page"`. Both configuration files are unchanged.

The existing production root, English homepage and French homepage returned HTTP 200 during the baseline check. This verifies HTTP availability, not the private Cloudflare dashboard configuration or the deployment of V2.

## 2. Historical errors versus current validation

The October 12 OpenNext failure in the supplied brief was historical. No OpenNext migration was attempted in this work. No OpenNext package, Worker entry point, server action, runtime API or server-dependent middleware has been introduced.

The baseline `npm run check` passed with 23 tests and 21 generated pages. A baseline dry-run using Wrangler 4.150.0 read 247 files from `out`, reported no bindings, and exited successfully without publishing.

Windows initially blocked `npm ci` because a local Next development process had the native SWC compiler open. The exact project development processes were stopped and the install was retried successfully. A similar lock reappeared during final validation when a development server was running again; this is a local file-lock issue, not a Cloudflare failure.

## 3. Critical PDF reliability changes

- Removed `draft.items.slice(0, 10)`; all items are rendered.
- Removed truncation of descriptions and notes.
- Introduced `lib/pdf-layout.ts`, a measured flow layout shared by the PDF and SVG preview.
- Added automatic pages, repeated table headings and page numbers.
- Kept ordinary rows together and split rows longer than a whole page across pages.
- Wrapped long descriptions, unbroken strings, business names, addresses, notes and payment instructions.
- Kept the financial summary together when space permits; notes can continue on later pages.
- Added A4 and US Letter.
- Preserved selectable PDF text and embedded Noto Sans regular/semibold fonts.
- Removed mandatory InvoiceTemplateMaker branding and watermark text from exported invoices.
- Normalized unsupported narrow currency grouping spaces while preserving localized number formatting.
- Added an explicit localized error for characters outside the embedded font's coverage instead of exporting missing-glyph squares.
- Sanitized download filenames and delayed object-URL cleanup so downloads can start reliably.

The core files are `lib/pdf-layout.ts` and `lib/pdf.ts`. PDF libraries are dynamically imported when a download or print operation is requested.

## 4. Financial calculation accuracy

`lib/finance.ts` parses decimal number representations into integer ratios and uses BigInt for calculations. Both preview and PDF use the same results, including rounded line amounts.

Supported values:

- Decimal quantities and unit prices
- Rounded line amounts and subtotal
- Fixed or percentage discounts
- Optional shipping
- Tax
- Deposit received
- Other amount already paid
- Remaining balance
- Overpayment shown separately

Calculation policy:

1. Round each exact quantity × price product half up to the currency's minor unit.
2. Sum rounded line amounts.
3. Apply the discount; cap a fixed discount at the subtotal.
4. Add shipping to the discounted subtotal.
5. Calculate and round tax on that base, including shipping.
6. Add tax to obtain the total.
7. Subtract received deposits and other payments.
8. Clamp balance to zero and show overpayment separately.

No tax rate is selected automatically. Tax treatment and this calculation order are explicit tool behavior, not universal legal compliance.

Invalid, infinite and unsupported negative values are rejected. Tax and percentage discounts are limited to 0–100%. Each input is limited to 1,000,000,000,000; resulting monetary values above 1,000,000,000,000,000 minor units are rejected to protect conversion/formatting precision.

Currencies: USD, EUR, MAD, CAD, GBP, CHF, JPY and KWD. JPY exercises zero decimal places; KWD exercises three. Unit prices retain entered decimal precision in their display even when the payable line amount is rounded.

Full rules and numeric-boundary limitations: `docs/financial-calculations.md`.

## 5. Beginner workflow and accessibility

The homepage now places the generator directly below a compact introduction, before the promotional content.

Step 1 shows business/full name and customer name. Contact information, addresses, invoice number and dates are inside a collapsed optional section.

Step 2 shows products/services, quantities, prices, add/remove controls, currency and the current amount due.

Step 3 shows template selection, optional logo, document language, paper size, invoice preview and PDF download. It also provides edit, back, print and save-draft controls. Advanced financial, bank and registration details remain collapsed initially.

The progress indicator is keyboard-accessible, the current step has `aria-current="step"`, step changes focus the heading, validation messages use live regions, fields have labels and template buttons expose their selection state. SVG previews have unique title/description IDs and accessible page content.

The current wizard step is stored in the draft. Interface-language navigation therefore preserves progress. CSS uses a single column on mobile, responsive SVG pages and touch-sized navigation controls.

The approximately 60-second creation time is a usability target; no timing claim or measured usability score is made.

## 6. Logo upload and local persistence

`lib/logo.ts` and `components/LogoUpload.tsx` provide upload, replace, remove and preview.

- PNG, JPEG and WebP are accepted.
- Files must be non-empty and no larger than 2 MB.
- Raster signatures and dimensions are checked before decoding.
- Images above 20 million pixels are rejected.
- The browser decodes valid image content and re-encodes it as PNG on a canvas, removing metadata and converting WebP for PDF embedding.
- The largest image dimension is reduced to 1,200 pixels.
- Converted images must still fit the size limit.
- Binary PNG data stays in the `itm-assets` IndexedDB database; the invoice draft contains only its logo reference.
- Every published template embeds PNG logos in the PDF and displays them in the preview.
- Missing referenced logos block export rather than silently disappearing.
- JSON backups include binary logo data and revalidate it when restored.

No logo is uploaded to a server. Browser image conversion and native print/download behavior still require the manual browser checks listed below.

## 7. Eight distinct templates

| Template | Main layout differences |
|---|---|
| Modern Professional | Top accent strip, expressive title, coloured table, striped rows, right totals |
| Clean Minimal | Smaller heading, neutral table, unstriped rows, restrained rules |
| Classic Business | Header rule, dark table, traditional spacing and striped rows |
| Corporate Blue | Framed header, blue default accent, coloured table and wider cell padding |
| Elegant Premium | Centred title/logo, fine frame rules, outline table and spacious rows |
| Creative Studio | Large right-aligned title, left logo, accent strip and left totals |
| Freelance Services | Compact heading and rows, outline table and left payment summary |
| Small Business Retail | Centred framed heading/logo, compact striped rows and right totals |

The shared style definitions are in `lib/templates.ts`. The gallery uses real invoice previews rather than synthetic decorative cards. Template links intentionally override a saved template while preserving invoice data. The longer-term target of 24 templates is not implemented; the required first expansion to eight is implemented.

## 8. Draft management

- Version 2 envelope: `{ version: 2, draft }`.
- Existing unversioned drafts migrate safely, with defaults for new optional fields.
- Unsupported versions and malformed fields are rejected at runtime.
- Item IDs, numeric values, currency, locale, template, colour, paper size, logo references and wizard progress are validated.
- A malformed local draft is preserved under `itm-invoice-draft-recovery` before a fresh draft is written.
- Drafts auto-save; blocked storage shows a localized message instead of crashing.
- Reset requires confirmation and clears the active draft/logo.
- Backup download includes the complete invoice and optional logo.
- Restore validates JSON, limits file size, rechecks logo content and requests confirmation before replacing current work.
- No invoice contents are sent to analytics.

The original storage key is retained for migration compatibility. Binary logos are stored separately in IndexedDB.

## 9. English/French support

All new labels, statuses, template names/descriptions, business fields and pages have English and French text. Structural completeness tests continue to compare both dictionaries.

The existing root automatic-routing script is preserved: explicit saved preference first, then supported browser preferences, then English. It uses `location.replace()` only at `/`. Direct `/en/` and `/fr/` visits remain on their requested language.

Navbar switching preserves the locally stored draft and independent PDF language. It still navigates when preference storage is blocked.

French names, accents, labels, amounts and long instructions are extracted from actual generated PDFs during tests.

## 10. Optional business and payment fields

Advanced mode includes a region selector with dedicated optional SIREN/SIRET/VAT fields for France, ICE/IF/RC fields for Morocco, and generic registration/tax identifiers for other businesses. String storage preserves leading zeros. Changing the selector does not erase entered identifiers. An additional multiline identifier field remains available. Dedicated IBAN, SWIFT/BIC, purchase-order and payment-terms fields and freeform payment notes are also provided.

All are optional and included in preview, PDF and draft backups. No regional tax rate or universal compliance claim is assumed.

## 11. SEO and supporting pages

All previous localized routes remain. Added:

- `/en/about/` and `/fr/a-propos/`
- `/en/contact/` and `/fr/contact/`

Each localized page retains a unique title/description, canonical, reciprocal EN/FR hreflang, x-default, correct HTML language, static H1/content, JSON-LD and crawlable links.

The sitemap now omits modification dates where no accurate date is known; it no longer marks every page as freshly edited on every build. Language alternates include x-default.

Static verification now checks all 20 localized pages, not only six English primary pages. It checks unique titles, expected canonical URLs, indexability, sitemap inclusion, referenced JavaScript/CSS assets and font files.

The logo pages expose the actual generator/logo workflow. The simple page defaults new drafts to Minimal; the freelance page defaults new drafts to Freelance Services. Saved invoice data stays intact.

No keyword-volume, ranking, legal-compliance or performance-score claim is made. Core Web Vitals targets still need real browser/field measurement.

## 12. Ternyxa, contact and future monetization

A subtle bilingual footer link introduces Ternyxa. It is optional and never redirects automatically. No Ternyxa branding appears inside invoices.

About and Contact pages contain real project information. Contact links to the repository's issue tracker (HTTP 200 checked) and Ternyxa; no private email address or business address has been invented.

Privacy text now explains local drafts, IndexedDB logos, recovery copies and sensitive backups. Existing Terms explain responsibility and absence of professional advice.

Advertising is inactive. Two hidden placement markers reserve future locations without loading scripts, tracking users or creating empty layout space. A fail-closed privacy-preference reader defaults analytics and advertising to false. No analytics provider, consent manager or AdSense integration is active.

Future activation steps and prohibited invoice-data collection are documented in `docs/advertising-and-privacy.md`. AdSense approval is not claimed.

## 13. Tests and visual QA

The final check passed 147 tests across 12 files, including raster-header validation, dedicated business identifiers and the final refinements. The lockfile clean install passed before those last source-only additions.

Test coverage includes:

- Dictionary completeness, routes, labels and localized formatting
- Automatic-root locale resolution and manual preference priority
- Decimal accuracy, rounding, zero totals, large values and invalid inputs
- Discounts, shipping, taxes, received payments, balance and overpayment
- Zero/two/three-decimal currencies
- Actual PDF text extraction for 1, 10, 11, 25, 50 and 100 items
- Repeated headers and complete long content across pages
- A4 and US Letter dimensions and page numbers
- All eight templates in both languages
- Font coverage errors rather than missing glyphs
- Measured page bounds and text-overlap checks
- Logo file validation, IndexedDB persistence/removal and PDF image resources
- Safe legacy/v2 draft restoration, gallery selection and malformed recovery
- Backup round trips, logo payloads and missing-logo errors
- Actual React wizard progression and validation in jsdom
- Draft/progress/PDF-language preservation when interface language changes
- Disabled defaults for future privacy preferences

Visual QA generated 16 realistic 25-item logo-enabled invoices: eight templates in English/US Letter and eight in French/A4. Each had four pages. First and last pages were inspected in rendered contact sheets. Earlier full-page renders of the English and French samples were also inspected. The quantity-column wrapping defect discovered during template expansion was fixed.

The browser-control inventory exposed no browsers. No claim is made that Safari/Chrome/Firefox mobile interactions, actual image decoding, native download UI, print dialogs or Core Web Vitals have been verified on devices. jsdom tests supplement but do not replace those checks.

## 14. Dependencies and static output

No production framework or major dependency was upgraded. Added development-only packages for meaningful verification:

- PDF.js 6.4.299: extract actual exported text
- fake-indexeddb 6.2.5: exercise binary persistence
- jsdom 26.1.0 and Testing Library React 16.3.0: exercise React interactions

The npm lockfile is updated. TypeScript targets ES2020 for BigInt. PDF.js tests require Node 22.13+; this environment used Node 24.16.

The final completed build generated 25 static pages, including 20 localized routes. Output stays in `out/`; it contains root entry, EN/FR pages, sitemap, robots, `_next` resources and font assets. No runtime backend is required.

## 15. Deployment readiness and owner checks

V2 source is locally implemented and automated verification has passed on the feature branch. It has not been committed or deployed. Production remains the existing version. Release approval should wait for the manual device/browser checks below.

Before approving a release, manually check:

1. Mobile and desktop wizard interaction, touch targets and absence of horizontal scrolling.
2. PNG, JPEG and WebP upload, replace, remove, reload and language switching.
3. JSON backup/import with logos on a real browser.
4. A basic and a 100-item PDF, long descriptions/notes, all eight templates, both languages/paper sizes.
5. Native print/download behavior and browser popup restrictions.
6. Automatic root routing, direct localized URLs and manual preference priority.
7. Core Web Vitals; no scores have been measured here.

The Cloudflare dashboard is not accessible through the available tools. The owner must verify these existing settings:

| Setting | Required value |
|---|---|
| Worker | `invoice-template-maker` |
| Repository | `Mohammedaminetaoufik/invoice-template-maker` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.jsonc` |
| Static assets | `./out` |
| Hosting | Cloudflare Workers Static Assets |
| Domain | `invoicetemplatemaker.com` |

Confirm a compatible Node version for tests; do not recreate the Worker, add Pages, disconnect GitHub, change DNS, introduce OpenNext or add a second publishing workflow.

## 16. Commands and required approvals

Local validation:

```powershell
npm ci
npm run check
npx --yes wrangler@4.150.0 deploy --dry-run --config wrangler.jsonc
```

`npm run check` includes TypeScript, tests, `next build` and static verification. Separate commands, when needed, are `npm run build` and `npm run test:static`.

After owner review and explicit approval, commit the reviewed source on the feature branch and merge/push it to `main` through the owner's chosen workflow. The existing Cloudflare integration should build and publish automatically. Do not start a second manual deployment while that deployment is running.

The configured deployment command is `npx wrangler deploy --config wrangler.jsonc`. This command publishes and must not be run before owner approval.

After the approved deployment, smoke-test root, both homepages, both template galleries, sitemap, robots, assets/fonts, logo persistence, template selection and multipage PDF output. Report failures and use the existing last-known-good deployment for rollback if needed.

The outstanding approval is permission to commit, merge/push and deploy. No approval is implied by the requests to continue local development.

## 17. Remaining limitations

- Real-browser/device QA and dashboard verification remain outstanding.
- Browser PDF printing may require the PDF viewer's print button; popup permissions vary.
- Font coverage is Latin-focused; unsupported characters are rejected explicitly.
- Registration fields are optional; the tool does not automatically validate local laws or certify the identifiers.
- Eight templates are implemented; the future target of 24 is not.
- Advertising, analytics and consent UI are prepared but inactive.
- No accounts, server invoice history, payment processing, emailing or reminders are added.
- Storage can be blocked or full; backup export is available and a localized error explains failure.

## 18. Final verification record

| Check | Final result |
|---|---|
| `npm ci` | Passed after stopping the local development server to release SWC's Windows file lock; fonts copied successfully |
| `npm run check` | Passed: TypeScript, 147/147 tests, production build and static verification |
| Production export | 25 generated static pages; all 20 localized canonical pages verified |
| SEO/assets verification | Unique titles, canonicals, reciprocal hreflang, sitemap, robots, root routing, `_next` references and fonts passed |
| Wrangler 4.150.0 dry-run | Passed; read 286 assets from `out`, total Worker upload 0.36 KiB (gzip 0.26 KiB), no bindings, exited with `--dry-run` |
| `npm audit --json` | Zero reported vulnerabilities |
| `git diff --check` | Passed; only the repository's normal LF/CRLF notices were printed |
| Cloudflare/Next configuration diff | No changes to `wrangler.jsonc` or `next.config.ts` |
| Production publication | Not performed |

The final dry-run command was `npx --yes wrangler@4.150.0 deploy --dry-run --config wrangler.jsonc`, with Wrangler metrics disabled for that invocation. This pins the validation tool without adding a production dependency or changing the configured deployment architecture.

The development server was restarted at `http://localhost:3000` after clean-install verification. Stop it before a future Windows `npm ci` if SWC is locked again.

HTTP smoke checks on the local development server returned 200 for `/en/`, `/fr/`, `/en/about/` and `/fr/contact/`. This does not substitute for production smoke tests or browser interaction checks. Remote `main` was read-only checked with `git ls-remote` and still points to baseline `3a08b5a`.

Restarting `next dev` generated `AGENTS.md` and can point `next-env.d.ts` to development type files. These are framework-generated local files; no commit has been made. The installed static-export and server/client component guides were read after that instruction appeared. A production build regenerates the production type references.

Final sample invoices are `output/pdf/v2-invoice-en.pdf` and `output/pdf/v2-invoice-fr.pdf`, with an example logo, 25 complete line items, discounts, shipping, payments, optional business information, notes and page numbers. Both are four-page examples. The label `EXAMPLE` belongs to the fictional business logo and is not an application watermark.

Rendered QA artifacts are organized in ignored `tmp/pdfs/` for local review; they are not deployment assets. The historical `output/pdf/invoice-sample-fr.pdf` is a baseline artifact and should not be used to evaluate V2.
