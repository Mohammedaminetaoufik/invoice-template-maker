# Cloudflare version-upload and manual-promotion workflow

This project is a Cloudflare **Worker with static assets**, not a Cloudflare Pages project. Its Worker name and asset output are defined in `wrangler.jsonc` as `invoice-template-maker` and `./out`.

## Required one-time dashboard settings

Open **Cloudflare Dashboard → Workers & Pages → invoice-template-maker → Settings → Builds** (the label may appear as **Build** in the current dashboard). Connect or inspect the Git integration and set:

- Git provider: GitHub
- Repository: `Mohammedaminetaoufik/invoice-template-maker`
- Production branch: `main`
- Root directory: `/`
- Build command: `npm run check`
- Deploy command: `npx wrangler versions upload --config wrangler.jsonc`

Save the settings. The Worker selected in the dashboard must be `invoice-template-maker`, matching `wrangler.jsonc`. The generated Cloudflare build token needs permission to upload a version of that existing Worker.

Do not use `wrangler deploy` as the production-branch deploy command. Cloudflare documents that `wrangler deploy` creates a version and immediately sends production traffic to it, while `wrangler versions upload` creates an undeployed version and a Version URL. See Cloudflare's [Workers Builds overview](https://developers.cloudflare.com/workers/ci-cd/builds/), [build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/).

GitHub Actions remains validation-only. It runs `npm run check`, browser tests, and a Wrangler packaging dry run. It has no Cloudflare credentials and must not be given an upload or deployment step while native Workers Builds owns uploads.

## Normal release sequence

1. Commit the reviewed changes and push that commit to GitHub `main`.
2. Confirm that the GitHub Actions **Main branch checks** workflow succeeds.
3. In the Worker, open **Deployments → View build history** and confirm that the build for the same commit succeeded.
4. Open **Deployments → Version History**. Select the newly uploaded version and open its Version URL.
5. Test at least `/en/`, `/fr/`, both reminder routes, both blog indexes, both articles, invoice editing, PDF download, locale switching, static assets, and internal links.
6. Compare the build's commit link/SHA with `git rev-parse HEAD` or the commit shown on GitHub. Do not select a version based only on its timestamp.
7. When approval is explicit, choose **Deploy version**, assign that version 100% of production traffic, review the confirmation, and deploy.
8. Verify `https://invoicetemplatemaker.com/` and key localized routes in a private browser window. Confirm the active deployment/version ID in Cloudflare.

Steps 7–8 are intentionally manual. A push or successful version upload must leave the existing production deployment unchanged.

## Rollback

Before promotion, note the current production version ID. If the new release has a production problem, open **Deployments**, select the last known-good version, choose **Deploy version**, and assign it 100% traffic. Cloudflare also supports `npx wrangler rollback <VERSION_ID> --config wrangler.jsonc`, but that command immediately changes production; use it only as an explicitly approved operational action. Cloudflare keeps rollback guidance in its [rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

After rollback, verify the custom domain and record the bad version ID, good version ID, affected commit, observed symptom, and rollback time.

## Why a GitHub push may not change production

The source repository can establish the following facts:

- `main` is the local branch and tracks `origin/main`.
- GitHub Actions validates but does not authenticate to or upload to Cloudflare.
- `wrangler.jsonc` targets the correct Worker name and `out` static assets.
- The previous README told Cloudflare to run `npm run build` and `wrangler deploy`; those instructions did not match the requested validate → upload → manual-promote workflow.

The repository cannot verify the live Cloudflare account. Check these in order when a push does not produce the expected result:

1. **Repository connection:** Settings → Builds must show the exact GitHub repository, not a fork or old project.
2. **Branch control:** production branch must be `main`; inspect whether the pushed SHA appears in build history.
3. **Build log:** `npm run check` must finish successfully. A failed check prevents version upload.
4. **Deploy command:** it must be exactly `npx wrangler versions upload --config wrangler.jsonc`.
5. **Worker identity/output:** build logs must target `invoice-template-maker`; `out/index.html` and localized `out/.../index.html` files must exist before upload.
6. **Version versus deployment:** a successful upload appears in Version History but, by design, does not change the active deployment or custom domain until manual promotion.
7. **Competing pipeline:** confirm no other GitHub workflow, deploy hook, or external CI job calls `wrangler deploy` for this Worker.
8. **Caching:** after promotion, compare the active version ID first. If it is correct but a browser appears stale, use a private window and inspect service-worker/cache state; do not repeatedly deploy to guess at a cache issue.

No remote connection, build history, Version URL, active deployment, custom-domain route, or build token was changed or verified during local implementation.
