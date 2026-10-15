# InvoiceTemplateMaker — V3 visual editor and handoff

Historical snapshot from 2026-10-13. The V3/V3.1 implementation was subsequently committed and pushed to the feature branch. Current release status and test results are in [V3_1_RELEASE_AUDIT.md](V3_1_RELEASE_AUDIT.md); the status below describes the project at the time of this V3 handoff.

Date: 2026-10-13. Workspace: `C:\Users\ataou\OneDrive\Desktop\invoice-template-maker`.

## Status and release boundary

V3 is implemented locally on `feature/v2-pdf-reliability`, on top of the uncommitted V2 work. Nothing has been committed, pushed, merged, published or changed in Cloudflare/DNS. The existing production deployment has not been replaced. Do not treat a successful build or dry-run as a production release.

Final local validation passed: 169 tests, 12 real-browser tests, TypeScript, the static production build, SEO/assets verification and a non-publishing Cloudflare dry-run. Physical-device and account/dashboard review still precede release approval. One intermediate geometry run exceeded its 15-second limit while browser tests ran concurrently; the final sequential run passed without changing the geometry assertions or timeout.

## What users can do

1. Open the English or French homepage, or use automatic language detection at `/`.
2. Choose one of eight real invoice designs before entering personal details.
3. Preview a template in an accessible modal or apply it immediately.
4. Optionally select an activity to see suggestions; all designs remain available.
5. Click a highlighted field on the invoice and edit it in a controlled contextual input.
6. Edit business/client names, emails and addresses; invoice reference and dates; descriptions, quantities, prices; notes and payment terms.
7. Add rows below the document or remove a row from its contextual editor. At least one row remains.
8. Add a logo from the placeholder inside the header. The existing local logo uploader supports upload, replacement and removal.
9. Open optional settings for currency, document language, paper size, tax, discounts, shipping, payments, banking details, identifiers and accent colour.
10. Change the template without discarding any invoice data, settings or logo.
11. Review every page, initiate a PDF download, return to editing, correct the invoice, and download it again.
12. Keep drafts on the current device, export a JSON backup including the logo, restore a validated backup, or reset the active draft after confirmation.
13. Discover Ternyxa through an optional section after the tool and FAQ content.

No registration, invoice backend, analytics or active advertising was added. Ternyxa receives no invoice data through its link. PDFs contain no InvoiceTemplateMaker/Ternyxa watermark or promotion.

## Editing interaction and architecture

- `InvoiceBuilder.tsx` owns the single authoritative `InvoiceDraft` state. No second editable copy or uncontrolled `contentEditable` exists.
- `lib/pdf-layout.ts` still performs the measured, paginated layout used by PDF-Lib and the SVG preview. V3 adds semantic `EditableRegion` hit targets and an optional editing mode.
- Editing placeholders are generated only for display; they are never written into the draft or exported to PDF. Empty optional fields disappear in review/export, so their absence can reduce the page count compared with editing mode.
- When editable fields are populated, tests require identical drawing operations for editing and export, for all eight templates in EN and FR.
- Desktop field controls open next to the selected location. Narrow screens use fixed, readable bottom-sheet controls with 16px inputs and a touch-sized field navigator.
- Escape closes a field editor; closing restores focus to its document field. Review validation opens/focuses the first missing business name, client name or row description.
- Invalid numeric changes are rejected through the existing financial engine; a localized error is shown and the last valid document remains editable.
- The template-preview modal uses native `dialog` focus containment, Escape handling and explicit return focus.
- A dismissed guidance message stays dismissed for the current mounted editor session.
- Undo/redo was intentionally not offered because no tested history model exists.

The stored `wizardStep` property remains for backup compatibility, but V3 reuses its values as `1 = choose template`, `2 = edit document`, `3 = review`. Existing V2 step-2 drafts open in editing; step-3 drafts open in review. Explicit valid `?template=` links preserve existing data and open editing. No storage-key or backup-format reset was introduced.

## Templates and activity suggestions

| Design | Presentation | Suggested activity |
| --- | --- | --- |
| Modern Professional | Accent strip, contemporary table, right totals | Small business |
| Clean Minimal | Quiet header and pale table | Any activity |
| Classic Business | Ruled header and dark table | Contractor; consultant |
| Corporate Blue | Panel header and corporate blue accent | Consultant |
| Elegant Premium | Centred title, frame/rules, spacious rows | Any activity |
| Creative Studio | Bold right title and left totals | Creative professional |
| Freelance Services | Compact service rows and left totals | Freelancer |
| Small Business Retail | Centred heading and striped compact rows | Retail |

These are recommendations, not restrictions. They do not change tax, country, prices or payment rules.

## Financial and document functionality retained from V2

- Eight currencies: USD, EUR, MAD, CAD, GBP, CHF, JPY and KWD.
- Exact decimal arithmetic using integer ratios/BigInt, not floating-point accumulation.
- Currency-specific decimal precision, half-up rounding per line, subtotal, fixed/percentage discount, shipping, tax, received deposit, other payment, balance due and overpayment credit.
- Tax is zero by default. Region/activity suggestions do not infer tax obligations.
- Noto Sans embedded fonts, selectable PDF text and EN/FR document labels independent of the interface language.
- A4 and US Letter, automatic page breaks, repeated table headers, long description/notes wrapping and no silent row limit.
- PNG/JPEG/WebP upload with file/header/dimension checks, 2 MB limit, 20 MP decoding limit, resizing/re-encoding to PNG, local IndexedDB storage and PDF embedding.
- Optional SIREN, SIRET, VAT, ICE, IF, RC, generic registration number, free-form identifiers, purchase order, IBAN, SWIFT/BIC and payment terms.
- Version-2 local drafts; migration of older drafts; malformed raw-draft recovery copies; validated JSON backup/restore with logo bytes.
- Optional printing remains available. Actual printer output, save location and PDF opening are not asserted by the download confirmation.

Detailed calculation and storage rules remain in `docs/financial-calculations.md` and `V2_REPORT.md`.

## Homepage, language and SEO

The compact hero now uses the supplied EN/FR copy and action labels. Supported trust statements are free, no signup, no watermark, professional PDF, and EN/FR. A compact audience strip addresses independent professionals and small businesses without invented metrics or testimonials.

The template-first workspace precedes explanatory/FAQ content. The Ternyxa discovery card appears after the tool; it is an ordinary optional link, not a popup, automatic redirect or PDF promotion. Icons are native SVG components, not a fabricated third-party logo.

All 20 localized routes, root routing, canonical URLs, EN/FR/x-default alternates, HTML languages, structured data, sitemap and robots remain. Homepage metadata was updated for the supplied positioning. Static verification also checks that gallery entry, FAQ and Ternyxa content are present in exported HTML, not hydration-only.

## V3 files

New:

- `lib/editor-copy.ts` — paired EN/FR redesign copy.
- `components/TemplatePicker.tsx` — eight real thumbnails, previews, selection and recommendations.
- `components/TemplatePreviewDialog.tsx` — native preview modal and focus restoration.
- `components/TernyxaDiscovery.tsx` — optional post-tool ecosystem section.
- `tests/visual-editor.test.tsx` — V3 interactions, persistence, validation, invalid amounts and correction after download.
- `tests/editor-layout.test.ts` — bounded field regions and drawing-operation parity.
- `tests/browser/editor.spec.ts` — actual Chrome/Edge/responsive interaction and PDF checks.
- `playwright.config.ts` — desktop Chrome, desktop Edge and 390px Chrome touch emulation.
- `scripts/serve-static.mjs` — loopback-only QA server for the exported `out/` directory; not a production backend.
- `scripts/capture-v3-detail.mjs` — focused desktop/mobile screenshot capture with fictional details.
- `scripts/render-v3-qa.py` — PNG rendering of browser-generated PDFs using existing PyMuPDF; does not modify PDFs.
- `output/v3/` — browser screenshot evidence.

Updated:

- `components/InvoiceBuilder.tsx`, `InvoicePreview.tsx`, `LogoUpload.tsx`.
- `components/HomePage.tsx`, `MarketingSections.tsx`, `app/globals.css`.
- `lib/pdf-layout.ts`, `lib/content.ts`, `lib/i18n.ts`.
- `scripts/verify-static.mjs`, `package.json`, `package-lock.json`, README and report files.

The old V2 `tests/wizard.test.tsx` is superseded by V3 visual-editor tests because the multistep form is no longer the intended interface. Non-UI financial, PDF, logo, backup, storage, privacy, locale and template tests remain.

The complete V2 file inventory and prior deployment history are retained in `V2_REPORT.md`. Preserve all unrelated dirty-worktree changes.

## Verification results

| Check | Final observed result |
| --- | --- |
| `npm run check` | Passed TypeScript, 169 tests across 13 files, Next.js production build and static verification |
| `npm run test:browser` | 12 passed in 2.4 minutes: four workflows in each of three browser projects |
| Browser projects | Installed Chrome desktop (1440×1000), installed Edge desktop (1440×1000), Chrome mobile/touch emulation (390×844) |
| Template coverage | All eight designs selected and switched while preserving the complete draft; activity suggestions remain optional |
| Direct edits | Business/client fields, description, quantity, price, row addition/removal and live amount checked |
| Validation/keyboard | Missing field focused; controlled field autofocus; Enter/Escape; native modal focus containment and return focus checked |
| Logo and persistence | Actual raster upload/normalization, local preview, IndexedDB-backed restoration after reload, template changes and EN→FR link navigation passed |
| PDF download/correction | Actual browser download event and downloaded PDF text/totals verified; edit and second download passed |
| Multipage accuracy | 50 long French rows on US Letter produced 10 pages in both review and PDF in all three projects; final row and payment terms retained |
| Placeholder isolation | Downloaded PDF has no empty address/logo prompts; populated editing/export drawing operations are equal for every template in EN/FR |
| Responsive layout | Horizontal-overflow assertions passed; focused capture separately reported no desktop/mobile overflow |
| Static SEO | All 20 localized routes, unique metadata, canonical/hreflang/x-default, sitemap, robots, structured data, static gallery/FAQ/Ternyxa and referenced assets passed |
| Cloudflare | Wrangler 4.150.0 dry-run passed: 286 assets read, no bindings, upload estimate 0.36 KiB (gzip 0.26 KiB), no publishing |
| Repository hygiene | `git diff --check` passed; only normal Windows CRLF notices were emitted |

Retained tests cover exact finances, migration/backup validation, logo validation and all-template PDF embedding, locale resolution, privacy defaults, template distinctions, actual multipage PDF extraction, unsupported glyphs and page/text collision geometry. V3 contributes 27 interaction/layout tests; the old five wizard interaction tests were replaced, not silently retained as an outdated workflow.

Browser QA caught visible screen-reader label overlap (fixed with `.sr-only`), SVG-title hydration mismatch (fixed with a single string child), modal return-focus loss (fixed), and a selected-template accessible-name mismatch (fixed with a separate visible selection badge). The final browser run includes those fixes and the invalid-number document-preservation guard. No page errors occurred in the primary EN download flow.

### Screenshot and PDF visual evidence

`output/v3/` contains EN homepage/edit/result screenshots and FR editing screenshots for each browser project, focused desktop/mobile document and field-editor captures, and first/last-page raster previews of downloaded PDFs.

Inspected the desktop editing page, focused desktop document, mobile contextual editor, one-page EN PDF, and first/last pages of the 10-page FR PDF. The reviewed images show readable fields and totals, separate header metadata, no label/text overlap, properly wrapped rows/notes, intact page numbering and no PDF promotional branding. Automated geometry checks cover all pages and templates; visual spot-checking is not claimed as exhaustive inspection of every physical-device/browser combination.

Poppler was unavailable on this Windows host. The existing PyMuPDF 1.28.2 installation rendered the downloaded PDFs for visual review; it did not alter them. Test PDFs are intermediate files in ignored `tmp/pdfs/`; owner-facing raster evidence is in `output/v3/`. Original V2 sample PDFs remain unchanged in `output/pdf/`.

Useful review files:

- [Desktop homepage](output/v3/homepage-en-chrome-desktop.png)
- [Desktop editing view](output/v3/editing-en-chrome-desktop.png)
- [French editing view](output/v3/editing-fr-chrome-desktop.png)
- [Mobile contextual editing](output/v3/contextual-field-mobile.png)
- [Post-download result](output/v3/result-en-chrome-desktop.png)
- [French PDF first page](output/v3/v3-long-fr-chrome-desktop-page-1.png)
- [French PDF final page](output/v3/v3-long-fr-chrome-desktop-page-10.png)

## Owner review and known limits

1. Run `npm ci`, `npm run check`, then `npm run test:browser`. Browser QA needs installed Chrome/Edge, or appropriate Playwright browser channels. It tests the exported build, not the development server.
2. Open localhost with `npm run dev`; review `/en/` and `/fr/`. Use fictional data.
3. Choose a design before entering details. Click each main field; test long addresses, services, notes, logos and advanced finances.
4. Review/download, correct a field, and download again. Inspect PDFs in a real PDF viewer and test printing with your actual printer if required.
5. Review screenshots in `output/v3/` and V2 example PDFs in `output/pdf/`.
6. Verify on physical iOS/Android devices. Chrome touch/viewport emulation is not a physical-device or Safari test. Firefox/WebKit are not part of the current local browser configuration.
7. Review current Cloudflare dashboard integration/domain settings and obtain explicit approval before commit/push/deployment. These account settings are not proved by a dry-run.

Printing remains best-effort browser/PDF-viewer behavior. Download initiation does not prove that a file was saved or opened. Draft storage can be unavailable in restricted browsers; the UI warns, and backups/downloads remain important. Existing unsupported-font character handling is retained. Local data, recovery copies and downloaded backups may contain private invoice information; handle them accordingly.

## Commands and continuation guide

```powershell
npm ci
npm run check
npm run test:browser
$env:WRANGLER_SEND_METRICS='false'
npx --yes wrangler@4.150.0 deploy --dry-run --config wrangler.jsonc
```

Stop this project's development server before a clean install on Windows if its native compiler is locked. Avoid running the CPU-heavy PDF geometry suite concurrently with all browser tests. Keep `output: "export"`, `trailingSlash: true`, unoptimized images and the existing `wrangler.jsonc` static-assets configuration. Do not add OpenNext, runtime APIs, server actions, a new Cloudflare project, DNS changes or a second publishing pipeline.

Optional focused visual checks, with `node scripts/serve-static.mjs` running in another terminal:

```powershell
node scripts/capture-v3-detail.mjs
python scripts/render-v3-qa.py
```

The latter uses the existing optional PyMuPDF installation and intermediate PDFs saved by browser tests. The Playwright project configuration follows the [official configuration documentation](https://playwright.dev/docs/test-configuration) and uses [installed browser channels](https://playwright.dev/docs/browsers).

If another AI continues: read this file and `AGENTS.md`, then the relevant installed Next.js docs. Check the real worktree and current test results rather than assuming an old report proves a new change. Do not reset user changes. The local implementation/automated verification is complete; remaining work is owner/device/printer/dashboard review and an explicitly approved release, not an unapproved deployment.
