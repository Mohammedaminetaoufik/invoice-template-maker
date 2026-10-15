# InvoiceTemplateMaker V3.1: release audit and verification

The feature branch combines V2's precise financial calculations and multipage PDF layout with V3's eight visual templates and direct invoice editing. V3.1 keeps mobile editing compact and leaves the completed invoice visible after download initiation. This follow-up fixes the homepage CTA contrast, strengthens keyboard focus and footer readability, makes clean Next.js type generation explicit, separates the large PDF geometry checks by template and paper size, and adds a non-publishing GitHub Actions workflow.

It also replaces the generic site document glyph with a small SVG invoice mark in the existing teal/orange palette, reused in the header, footer, root fallback and browser tab icon. This is site branding only; customer-uploaded logos and PDF output are unchanged.

The follow-up adds a bilingual installable PWA manifest, Android/Apple home-screen icons, a versioned static-asset service worker, and EN/FR footer install instructions. The generator and PDF assets are precached for offline use after the first successful online visit; private drafts, uploaded logos and generated PDFs are never written to the service-worker cache. Physical Android/iOS install behavior remains a manual release check.

The editor keeps the draft in the browser and logos in IndexedDB. Uploaded images are processed locally. PDF generation loads when needed. The static export, localized EN/FR routes, root-language routing and Cloudflare Workers Static Assets configuration remain in place. No invoice details or Ternyxa branding are added to downloaded PDFs.

Review includes all eight templates, EN/FR and A4/Letter pagination, multiple currencies and payment adjustments, uploaded PNG/JPEG/WebP logos, recovery/import, 50- and 100-item invoices, narrow-screen editing, correction after download, and the final Ternyxa/FAQ order. Exact results and screenshots are in [V3_1_RELEASE_AUDIT.md](../V3_1_RELEASE_AUDIT.md).

The CI workflow installs locked dependencies on Node 24, runs TypeScript, Vitest, static build/SEO verification, Chromium browser workflows, and a Wrangler dry-run. It has read-only GitHub permissions and no deployment step. Its first hosted run is pending the owner's approval to push this change.

Cloudflare's build and version-upload settings must be checked in its dashboard before any push that could trigger a connected build. `wrangler versions upload --config wrangler.jsonc` creates a version without routing production traffic, but the current remote settings have not been verified. Owner approval is required before pushing, creating a draft PR, promoting a version, or merging into `main`.

For rollback after an approved production release, use Cloudflare's Deployments page to select the previously serving Worker version, then confirm the domain and static assets. A rollback changes live traffic and requires owner authorization.
