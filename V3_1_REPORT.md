# InvoiceTemplateMaker V3.1 release preparation

Date: 2026-10-14. Branch: `feature/v2-pdf-reliability`.

## Scope and release status

This is a focused polish of the existing V3 implementation. Nothing has been committed, pushed, merged or deployed. Owner approval is required for those actions. The working tree also contains the earlier V2/V3 work; do not discard those changes.

## Changes

- Mobile Quick Edit is a closed-by-default disclosure with one native field selector, replacing the large button grid. Selecting a field closes the navigator and opens the same controlled editor used by tapping the invoice.
- The mobile field editor is a compact bottom sheet, capped at 300px or 55% of the visible viewport. It responds to visual-viewport resize events, scrolls the selected field above the sheet, preserves the active highlight, and offers a labeled close button, Done and Escape. Closing restores focus without an extra scroll. Inputs use 16px text and editor controls have 44px minimum touch targets.
- Successful download initiation leaves the final preview and Edit Invoice, Download again and Change template available. A lightweight client wrapper moves the server-rendered Ternyxa section immediately below the invoice builder. FAQ/instructions remain after it; redundant hero/header/bottom creation CTAs are hidden in this state. The interface does not claim a browser saved or opened a file.
- The download-initiation flag is session component state, not persisted evidence of a saved file. Reloading restores invoice data without claiming a newly observed download. Reset/import clears this flag. Changing a template in the result preserves Download again.
- Template comparison has previous/next controls and an eight-template position indicator in the existing large preview. The selected card retains its badge and pressed state. Mobile thumbnail padding is smaller. Optional profession suggestions remain optional, and the direct Use action is unchanged.
- Template examples are explicitly identified as fictional. Selecting them still copies only the template identifier, never sample customer information or amounts.
- Export/review validation checks business name, customer name, invoice number, a valid issue date, any supplied due date, item descriptions and calculable financial values. Due date remains optional. Validation opens and focuses the missing document field with localized guidance.
- English copy now says “From blank page to professional invoice”; French says “D’une page blanche à une facture professionnelle”. All newly introduced UI copy has English and French entries. No usage statistics or customer claims were added.

## Black logo investigation

The original browser screenshot fixture was a 1×1 grayscale-plus-alpha PNG. Decoding it produced grayscale 0 and alpha 255: an opaque black pixel. Enlarging that image explains the black rectangle in the French screenshot. The browser fixture is now a transparent 160×64 PNG with a blue outline and the word DEMO. The small binary fixture remains appropriate for low-level storage tests. No change to the PDF layout engine was needed for this issue.

## Preserved functionality and architecture

All eight templates, shared invoice state, direct editing, local autosave, IndexedDB logo storage, logo-inclusive JSON import/export, financial precision, pagination, A4/Letter, independent interface/PDF languages, root-language routing, localized SEO routes and GitHub integration remain. `next.config.ts` static export and `wrangler.jsonc` Cloudflare Static Assets configuration remain unchanged by V3.1.

The main additions are `HomeWorkspace`, `QuickEditNavigator` and `EditableFieldPopover`. `HomePage` passes server-rendered content through ReactNode slots, so marketing/SEO content remains present in exported HTML. See [V3_REPORT.md](V3_REPORT.md) and [V2_REPORT.md](V2_REPORT.md) for the complete pre-existing functionality and architecture.

## Verification

Current artifacts are under `output/v3-1/`, with browser-generated PDF fixtures under ignored `tmp/pdfs/v3-1-*.pdf`. Earlier `output/v3/` evidence is historical.

| Check | Observed result |
| --- | --- |
| `npm run check` | First run passed 169 tests, TypeScript, production build and static SEO checks. Final run including two additional required-field tests is pending. |
| `npm run test:browser` | 13 passed, 2 intentionally skipped in 3.5 minutes. Chrome desktop 1440×1000, Edge desktop 1440×1000, Chrome mobile touch emulation 390×844. The two skips are the mobile-only sheet test on desktop projects. |
| Cloudflare Wrangler 4.150.0 dry-run | Passed, 286 static assets, 0.36 KiB worker upload / 0.26 KiB gzip, no bindings. Dry-run exited without deployment. |
| Shared state / logo persistence | All eight templates preserve draft data in each browser project. Uploaded logo remains visible after interface-language change and reload. |
| Actual PDF downloads | Content extracted and checked in all three projects. All eight logo-bearing French PDFs downloaded in Chrome desktop contain an image rendering operator. |
| Pagination | 50-row French invoices on US Letter produce matching 10-page preview/PDF output in each browser project; last row and payment terms retained. |
| Mobile | Default-closed navigator, field focus/highlight, sheet height ≤300px, selected field above sheet, close/focus return and no horizontal overflow at 320px verified. |
| Result experience | Browser assertions confirm Ternyxa immediately follows the builder, redundant CTAs are hidden and Download again remains visible. |
| Visual review | Reviewed mobile bottom sheet and comparison modal, desktop contextual editor and completed result, French mobile editing, all eight logo PDFs and long-invoice ending. No overlap or logo distortion found in those reviewed views. |
| Whitespace check | `git diff --check` passed; Git emitted Windows LF/CRLF conversion notices only. |

One verification attempt overlapped screenshot rendering and hit existing 5-second interaction and 15-second PDF geometry timeouts. It reported 169 passes and 2 timeout failures, with no assertion failure. Timeout limits were not increased; the final check is being rerun without competing browser/render work.

The PDF review workflow used the existing PyMuPDF renderer because Poppler is absent on this host. It rasterized existing browser downloads without modifying their contents.

### Reproduction

Run `npm run check`, then `npm run test:browser` sequentially. Run `$env:WRANGLER_SEND_METRICS='false'; npx --yes wrangler@4.150.0 deploy --dry-run --config wrangler.jsonc` for the dry-run only. `python scripts/render-v3-qa.py` renders current PDF QA fixtures. With `node scripts/serve-static.mjs` running on port 4137, `node scripts/capture-v3-detail.mjs` captures focused desktop/mobile evidence. Avoid overlapping the CPU-heavy test suite and screenshot/PDF rendering on this machine.

### Evidence

- [Mobile bottom sheet](output/v3-1/mobile-bottom-sheet.png)
- [Mobile template comparison](output/v3-1/template-comparison-mobile.png)
- [Desktop contextual editing](output/v3-1/contextual-field-desktop.png)
- [Completed desktop invoice](output/v3-1/result-en-chrome-desktop.png)
- [Completed mobile invoice](output/v3-1/result-en-chrome-mobile.png)
- [French interface with demonstration logo](output/v3-1/editing-fr-chrome-mobile.png)
- [Retail PDF logo rendering](output/v3-1/v3-1-logo-retail-page-1.png)
- [Long French PDF ending](output/v3-1/v3-1-long-fr-chrome-desktop-page-10.png)

## Manual release checks

Physical iOS/Android virtual keyboards, Safari/Firefox, actual printer dialogs and Cloudflare dashboard/domain settings require manual verification. Touch viewport emulation cannot establish physical keyboard or OS file-saving behavior. Review English and French on a real phone, including long notes, keyboard open/close and rotation. Confirm actual downloaded files in the chosen browser's download location. No production deployment is authorized.
