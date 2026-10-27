# Field Notes

A small, typography-first Markdown blog built with Astro and TypeScript. Static
HTML, local fonts, a resilient light/dark switch, syntax highlighting, tags, RSS,
and no analytics, accounts, backend, database, or Azure services.

## Run locally

Use **Node.js 24 LTS** (minimum 22.22.0) and npm. From this folder:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Astro (normally `http://localhost:4321/`).
To check the production site:

```sh
npm run check
npm run build
npm run preview
```

`dist/` is the deployable output. Preview serves that output; rebuild after
editing. No external fonts or runtime services are required.

## Make it yours

- **Title, description, author:** `src/config.ts`. The author uses the public
  GitHub display name; edit it and the introduction whenever you like.
- **About page:** `src/pages/about.astro`. Edit the introductory copy and
  starter-content explanation when ready.
- **Colors, typography, spacing:** `src/styles/global.css`.
- **Icon:** `public/favicon.svg`.
- **Posts:** `src/content/posts/*.md`. The first technical note covers Fabric
  Warehouse identity and permissions. Three older instructional samples can be
  removed or adapted; set `starter: false` on your own work.

The homepage’s starter notice is in `src/pages/index.astro`; remove or rewrite it
if you remove all instructional examples. Themes follow the system until a
reader explicitly chooses one. A blocked browser storage API does not break the
switch; the choice simply cannot persist between visits.

## Write a note

Copy `src/content/posts/draft-template.md` to a unique lowercase, hyphenated
filename. The filename becomes the post URL. Use this frontmatter:

```yaml
---
title: "A clear title"
description: "A short, specific summary for the list, feed, and search engines."
date: 2026-10-27
tags: [learning, writing]
draft: true
starter: false
---
```

Write regular Markdown below the frontmatter. Use `##` headings for the automatic
article contents list, fenced code blocks with a language (such as `typescript`),
and descriptive link text. Titles, summaries, dates, and lowercase hyphenated tags
are validated at build time. Dates display in UTC. Posts sort newest first,
with filename order as a stable tiebreaker. Dates **do not schedule publication**:
a future-dated post with `draft: false` is public.

Set `draft: false` to publish. The same query in `src/lib/posts.ts` filters drafts
from **home, post routes, tag routes, and RSS**, even during development. To view
a draft locally, temporarily set it to `false`, then revert before publishing.

**Drafts are not private storage.** They are excluded from the generated site,
but remain readable in a public source repository and its history. Do not write
secrets, customer data, internal code, private URLs, screenshots, or confidential
work material into this repository. Use synthetic examples, verify permissions,
credit sources, and follow any employer/client review process.

### Links and images

Page templates use `withBase()` from `src/lib/urls.ts`. Keep that convention for
new template links and public assets.

Markdown content cannot call this helper. Use portable **relative** internal
links. From `/posts/my-note/`, `../../about/` points to About at either the domain
root or a repository subpath; `../another-note/` points to another post.
Markdown images are resolved relative to the source file by Astro. Store an image
at `src/assets/example.svg` and reference it from a post as
`![Descriptive alternative text](../../assets/example.svg)`. Astro emits the asset
with the configured deployment base. Do not hardcode
root paths such as `/about/` into Markdown for a project site. The verification
command checks all generated local `href`/`src` links and heading fragments.
The RSS feed includes plain-text descriptions and article links, not full HTML.

## URL configuration and project-site preview

`SITE_URL` is an **origin only**, such as `https://username.github.io`.
`SITE_BASE_PATH` is `/` for `username.github.io` repositories and custom domains,
or `/repository-name/` for project sites. Canonicals, Open Graph URLs, navigation,
article/tag links, feed links, scripts, styles, and icons respect the base path.

Locally, either copy `.env.example` to `.env` and edit it, or set environment
variables in the terminal. The default origin `https://example.com` is only a
local-build placeholder; replace it before manual deployment. For example:

```powershell
# PowerShell
$env:SITE_URL = "https://username.github.io"
$env:SITE_BASE_PATH = "/field-notes/"
npm run build
npm run preview
# Visit http://localhost:4321/field-notes/
# Clear overrides when done:
Remove-Item Env:SITE_URL, Env:SITE_BASE_PATH
```

```sh
# macOS/Linux
SITE_URL=https://username.github.io SITE_BASE_PATH=/field-notes/ npm run build
SITE_BASE_PATH=/field-notes/ npm run preview
```

Use the **same base** when building and previewing. The config loads `.env` with
Node's built-in loader; explicit shell/workflow variables take precedence.

## Verification

```sh
npm run check                  # Astro + TypeScript diagnostics
npm run verify                 # root AND /field-notes-test/ builds and link audit
npx playwright install chromium
npm run test:browser           # requires a preceding npm run build
```

`verify` checks every generated HTML page’s local links/resources and fragments,
canonical and Open Graph URLs, RSS channel/article links, draft exclusion,
syntax highlighting, the 404 noindex flag, and `.nojekyll`. It restores a normal
build after testing both paths. It builds with a verification-only example
origin, with no network or remote publishing actions.

Browser tests start and stop their own **production preview** server. They cover
navigation, keyboard skip links, theme persistence, blocked storage, system
preference changes, mobile overflow, draft 404s, RSS, and no-JavaScript reading.
To repeat browser tests for a project path, build with `SITE_BASE_PATH` set and
leave that variable set for `npm run test:browser`. They use port 4321; stop any
other local server on that port first. Update sample-count/title assertions if
you remove the instructional posts.

## Publish to GitHub Pages

The publishing destination is the public repository
<https://github.com/bibo702/field-notes>, with the site at
<https://bibo702.github.io/field-notes/>.

To publish a new post from GitHub without running anything locally:

1. Open `src/content/posts` in the repository and choose **Add file → Create new
   file**.
2. Name the file `your-post-title.md`, copy the frontmatter shown above, and write
   your Markdown. Set `draft: false` when ready.
3. Commit to `main`. The **Deploy Field Notes to GitHub Pages** workflow rebuilds
   and publishes the site automatically. Check the **Actions** tab for its result.

To publish local edits:

```powershell
git add src
git commit -m "Add a learning note"
git push origin main
```

Review all staged changes for public sharing before committing. Drafts remain
visible in the public source repository even though they are excluded from the
site. The instructional sample posts can be edited or removed.

For another repository, use the `main` publishing branch (or change the
workflow) and select **GitHub Actions** in **Settings → Pages**.

The prepared workflow installs from `package-lock.json`, runs type checking,
builds, uploads `dist`, and deploys through the official Pages actions. It uses
`configure-pages` outputs for **both origin and base path**, so a user site,
project site, or configured custom domain does not require hardcoded repository
names. Only the deployment job receives Pages write and OIDC permissions.
`.nojekyll` keeps the `_astro` asset folder usable on static hosting.

For a custom domain, configure it in GitHub Pages (including DNS/HTTPS) before
re-running the workflow. No custom domain is configured. GitHub serves
`404.html` for missing URLs; it is noindexed
and contains a base-aware home link.

## Project map

```text
src/config.ts              editable identity
src/content.config.ts      Markdown validation
src/content/posts/         public posts and excluded draft template
src/lib/                   shared public-content query and URL helpers
src/layouts/Base.astro     semantic shell, SEO, early theme selection
src/pages/                 home, articles, tags, About, RSS, 404
src/styles/global.css      responsive light/dark design and prose styling
scripts/verify.mjs         repeatable root/project output audit
tests/site.spec.ts         real-browser regression checks
.github/workflows/         opt-in GitHub Pages deployment
```
