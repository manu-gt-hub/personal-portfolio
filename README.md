# personal-portfolio

Personal portfolio of Manuel Gutiérrez Torrero: projects, milestones, achievements and personal info.

A static site (HTML + CSS + vanilla JS, no build step) served from `public/` with Cloudflare Workers static assets.

## Structure

```
public/
  index.html     # all content (English, with Spanish in data-es attributes)
  styles.css     # light/dark theme tokens + layout
  main.js        # theme/lang toggles, scroll reveal, hero graph animation
  assets/        # optimised images (webp/jpg)
  _headers       # security + cache headers for Cloudflare
  404.html
resources/       # source material (CV, slides, photos), not deployed
wrangler.jsonc   # Cloudflare config
```

## Local preview

```bash
npm install
npm run dev        # http://localhost:8787
```

Or just open `public/index.html` with any static server (`npx serve public`).

## Deploy to Cloudflare

**Option A — CLI**

```bash
npx wrangler login
npm run deploy
```

**Option B — Git integration (auto deploy on push)**

1. Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo.
2. Build command: *(empty)* · Deploy command: `npx wrangler deploy`.
3. Add a custom domain under the Worker's *Settings → Domains & Routes*.

If you prefer classic Cloudflare Pages instead, set the build output directory to `public` and leave the build command empty; `_headers` works the same.

## Editing content

- Text lives in `public/index.html`. To translate an element, put the Spanish version in its `data-es` attribute.
- Photos: drop the originals in `resources/` and export web versions to `public/assets/` (e.g. `ffmpeg -i in.png -vf scale=640:-1 -quality 78 out.webp`).
