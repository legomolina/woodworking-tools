# Host on Cloudflare Pages, deployed from GitHub Actions

The app is a fully client-side static site, and the workflow requires a preview deployment for every pull request plus a production deployment on every merge to `main`. We host it on Cloudflare Pages, deployed from GitHub Actions, because it provides per-PR preview URLs for free and serves static assets without lock-in beyond the deployment step. GitHub Pages was rejected because it has no native per-PR previews; Netlify and Vercel were viable but offered nothing this project needs over Cloudflare Pages.
