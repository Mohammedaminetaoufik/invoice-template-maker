# InvoiceTemplateMaker

A static English/French invoice generator built with Next.js, React and TypeScript. Invoice calculations, logo processing and PDF creation stay in the browser.

## Development

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. Stop the development server before a Windows clean install if it locks the native SWC compiler.

## Functionality

- Permanent server redirect from `/` to `/en/`, with an EN/FR language switcher
- Template-first visual editor with contextual document fields and optional advanced settings
- Eight distinct shared invoice templates and real template previews
- English/French document language independent of the interface
- Selectable-text multipage PDFs in A4 and US Letter
- Logo upload/replace/remove and local IndexedDB persistence
- Exact decimal calculations, tax, discounts, shipping, received payments and balance
- Optional registration identifiers, purchase orders and payment instructions
- Validated/versioned local drafts and JSON backup/restore with logos
- Static bilingual SEO routes, About/Contact/Privacy/Terms pages and Ternyxa links
- Browser-only English/French late-payment reminder generator with safe invoice handoff
- Static bilingual payment guide and blog indexes
- Installable phone app with EN/FR launch routing, home-screen icons and offline invoice/PDF support after the first successful online load

## Install on a phone

The production site must be served over HTTPS. On Android, use the browser menu’s **Install app** or **Add to Home Screen** action. On iPhone, open the site in Safari and use **Share → Add to Home Screen**. The same instructions appear in English or French in the site footer. Browser installation is controlled by the device and browser; this site does not claim that a native package or App Store listing exists.

The service worker caches only static application files, both generator homepages, icons and PDF fonts—not invoice drafts, uploaded logos or generated PDFs. Once its initial cache has completed, the EN/FR generator can reopen and export a PDF offline. Other informational pages can be revisited offline after they have been opened online. Offline storage can still be cleared by the browser. On iOS, check whether an existing Safari draft is available in the newly installed home-screen app; use the built-in draft export/import if it is not.

`npm run dev` deliberately does not register the service worker. For local PWA testing, run `npm run build` and then `node scripts/serve-static.mjs`; the browser can use service workers on `127.0.0.1`.

## Verification

```powershell
npm run check
npm run test:browser
```

This generates the framework-managed route types, then runs TypeScript, financial/PDF/storage/interaction/translation tests, the production export, service-worker generation and static SEO/PWA asset verification.

Every public route has a page-specific 1200×630 Open Graph/Twitter card under `public/og/`. After changing social-card copy or styling, regenerate the committed assets with `npm run generate:og`; the static verifier rejects missing, duplicated, oversized, or incorrectly sized cards.

Tests use PDF.js for actual PDF text extraction, fake IndexedDB for binary storage, and jsdom/Testing Library for React interactions. PDF.js tests need Node 22.13 or newer; the verified environment used Node 24.16.

Browser QA runs against the static export with installed Chrome/Edge and a 390px Chrome touch viewport locally. GitHub Actions uses bundled Chromium on desktop and mobile. Run browser QA after the build and separately from the CPU-heavy unit/PDF suite. Representative screenshots are under `output/v3-1/`; generated QA captures are ignored by Git.

The visual document, preview and PDF share `lib/pdf-layout.ts`; financial calculations use `lib/finance.ts`. See [the V4.1.1 technical maintenance report](V4_1_1_REPORT.md), [the V4.1 SEO and growth handoff](V4_1_REPORT.md), [the SEO baseline](docs/v4.1-seo-baseline.md), [the analytics event guide](docs/analytics-and-growth.md), [calculation rules](docs/financial-calculations.md), [future advertising/privacy preparation](docs/advertising-and-privacy.md), [the V3 handoff](V3_REPORT.md), and [the V2 baseline](V2_REPORT.md).

## Static Cloudflare deployment

The production branch is `main`. The local branch tracks `origin/main`, so running `git push` while on `main` publishes the commit to GitHub's `main` branch. The GitHub Actions workflow validates pull requests and every push to `main`.

Preserve the existing Worker, GitHub integration and custom domain. In Cloudflare Workers & Pages, select the Worker and confirm these one-time settings under **Settings > Builds**:

- Git repository: `Mohammedaminetaoufik/invoice-template-maker`
- Production branch: `main`
- Build command: `npm run check`
- Deploy command: `npx wrangler versions upload --config wrangler.jsonc`
- Root directory: `/`

After those settings are saved, each push to `main` is validated and uploaded as a new Worker version by Cloudflare. It does **not** change production traffic. `npm run check` exports and verifies `out/`; `wrangler.jsonc` declares the static assets and no runtime backend. The GitHub Actions workflow intentionally performs validation only, so Cloudflare's native Git integration is the single version uploader.

A non-publishing configuration check:

```powershell
npx --yes wrangler@4.150.0 deploy --dry-run --config wrangler.jsonc
```

The `wrangler deploy --dry-run` command above validates packaging locally; despite the command name, `--dry-run` does not upload or promote anything. Local source cannot prove the remote dashboard settings, repository connection, build history, or active version. Confirm them in Cloudflare before relying on push-triggered uploads.

Local file changes, GitHub pushes, successful builds, and version uploads are not production promotion. See [the Cloudflare release guide](docs/cloudflare-release.md) for setup, preview, promotion, rollback, and troubleshooting, and [the V3.1 release audit](V3_1_RELEASE_AUDIT.md) for the earlier baseline.
