# Vinayak Dental Care — Website-only package

**Website package version:** 1.1  
**Designed for clinic application:** Vinayak Dental Care v3.2.0

This folder is the customer-facing website only. It is separate from the Windows clinic application and does not contain the clinic database, patient records, internal staff interface, Google credentials, or the clinic application source code.

## What is included

- `index.html` — public clinic homepage and appointment request form
- `site/site.css` — website styling
- `site/site.js` — website interactions and appointment form
- `logo.png` — clinic logo
- `_worker.js` — Cloudflare Pages Worker that proxies only the public booking API endpoints to the clinic server
- `_headers` — security and browser-cache headers
- `deployment/windows-api-gateway/` — example Caddy and Cloudflare Tunnel configuration for securely exposing only the public booking API

## Important: website hosting and appointment processing are separate

You can host the files in this package independently on Cloudflare Pages. The public page can stay online even if the clinic computer is switched off. However, live clinic details, available appointment slots, review data, and appointment submission depend on the clinic application server being online and reachable through its restricted API tunnel.

The worker forwards only these paths:

- `GET /public-api/clinic`
- `GET /public-api/availability`
- `GET /public-api/reviews`
- `POST /public-api/book`

It does not forward `/api/`, staff pages, patient records, database files, backups, or other application routes.

## Deployment domain

This package is prepared for `vinayakdentalcare.org` and `api.vinayakdentalcare.org`. See `DEPLOY_VINAYAKDENTALCARE_ORG.md` for the beginner-friendly deployment steps. Domain registration is paid; Cloudflare Pages hosting can use the Free plan.

## Before publishing

1. Keep the clinic application at v3.2.0 or a compatible later version, running in Server mode on the clinic computer (normally port `8765`).
2. Create a Cloudflare Pages project and publish the contents of this folder. Keep `_worker.js` at the root of the Pages build output directory.
3. Set the Pages **runtime** environment variable `VDC_API_ORIGIN` to your API hostname, for example `https://api.vinayakdentalcare.org`. Use the domain `vinayakdentalcare.org`, not this example.
4. On the clinic computer, install Caddy and `cloudflared`, then follow `deployment/windows-api-gateway/SETUP_WINDOWS_API.md`.
5. Test the homepage and each API route before sharing the URL with patients.

Do not expose port `8765` directly to the internet. Do not put Google OAuth credentials, passwords, patient exports, or the clinic database in this website folder or GitHub repository.

## Cloudflare Pages build settings

When your GitHub repository contains these website files at its root:

- Framework preset: **None**
- Build command: `exit 0`
- Build output directory: `.`
- Production branch: `main`

The `_worker.js` file must be in the build output directory. Cloudflare Pages Advanced Mode uses that file to run the API proxy and serve static files through `env.ASSETS.fetch()`.

## Public booking behaviour

A request submitted on the website is saved by the clinic application with status **Requested**. It is not automatically confirmed. Staff must review and confirm it in the clinic application. The website does not send SMS, WhatsApp, or email notifications by itself.

## Support links

- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare Pages Advanced Mode: https://developers.cloudflare.com/pages/functions/advanced-mode/
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
