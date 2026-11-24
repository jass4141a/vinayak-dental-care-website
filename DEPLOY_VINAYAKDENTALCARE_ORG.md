# Publish Vinayak Dental Care at vinayakdentalcare.org

This package is preconfigured for the requested website domain. Hosting and DNS can use free Cloudflare plans. The domain registration itself is not free unless you already own it.

## What will be online

- Public clinic website: `https://vinayakdentalcare.org`
- Restricted booking API hostname: `https://api.vinayakdentalcare.org`
- Clinic application and patient database: remain on the clinic Windows computer.

The clinic computer, Vinayak Dental Care v3.2.0 (or compatible version), Caddy, and cloudflared must be running for live availability and booking submissions. The static homepage can remain online when the clinic computer is offline.

## Step 0 — Check or register the domain

1. Open a registrar's domain search (for example, Cloudflare Registrar or another reputable registrar).
2. Search for the exact name `vinayakdentalcare.org`.
3. If you already own it, do not buy it again. Use the account that manages it.
4. If it is available and you want it, register it in your own name or clinic business details and keep access to the registrar email.
5. Domain registration and renewal are paid. Cloudflare Pages hosting can be free. Check the current checkout price, renewal price, taxes, and availability before purchasing.

## Step 1 — Create accounts

Create or sign in to: 

- Cloudflare: https://dash.cloudflare.com/
- GitHub: https://github.com/

Use accounts controlled by the clinic. Turn on two-factor authentication. Never send passwords, recovery codes, API tokens, or tunnel credential files to anyone.

## Step 2 — Add your domain to Cloudflare

1. In Cloudflare, choose **Add a domain** and enter `vinayakdentalcare.org`.
2. Choose the Free plan if offered.
3. Review the DNS records Cloudflare imports.
4. If the domain already has email, carefully preserve all MX, SPF, DKIM, DMARC and other required DNS records. Do not change nameservers until you know the existing email records are present.
5. Cloudflare will show two authoritative nameservers.
6. Open your domain registrar and replace the old nameservers with the exact two nameservers Cloudflare shows. Do not copy sample nameservers from a guide.
7. Wait for Cloudflare to confirm the domain is Active.

## Step 3 — Create a GitHub repository

1. Open https://github.com/new.
2. Repository name: `vinayak-dental-care-website`.
3. Select **Public** (this package contains public website code only; it must not contain patient records or secrets).
4. Do not add a README, .gitignore, or licence because this package already has its own README.
5. Create the repository.
6. Upload the *contents* of this package folder to the repository root, not the containing folder itself. `index.html` and `_worker.js` must be at the repository root.
7. Commit the upload to the `main` branch.

## Step 4 — Deploy with Cloudflare Pages (free plan)

1. In Cloudflare Dashboard open **Workers & Pages**.
2. Choose **Create application** → **Pages** → **Connect to Git** (wording may vary slightly).
3. Connect GitHub and authorize the website repository.
4. Select `vinayak-dental-care-website`.
5. Build settings:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `.`
6. Deploy. Keep `_worker.js` in the build output root; it is the Pages Advanced Mode worker that proxies only the public booking API routes.
7. Cloudflare will provide a temporary `*.pages.dev` URL. Open it and confirm the page, fonts, CSS, logo and sections load.

## Step 5 — Add the custom domain

1. In the Pages project open **Custom domains** → **Set up a domain**.
2. Enter `vinayakdentalcare.org`.
3. Follow Cloudflare's checks. The apex/root domain requires the zone to be active on this Cloudflare account.
4. Wait until Cloudflare reports the custom domain as Active and HTTPS is working.
5. Optional: add `www.vinayakdentalcare.org` as a second custom domain and configure a redirect to the root domain if desired.

## Step 6 — Set the website's API origin

The website is separate from the clinic application. For booking availability and submissions, the Cloudflare Pages Worker needs this runtime environment variable:

- Name: `VDC_API_ORIGIN`
- Value: `https://api.vinayakdentalcare.org`

In the Pages project, open **Settings** → **Variables and Secrets** (runtime variables) and add the variable for the Production environment. Redeploy after saving if required. Do not add `/public-api` to the value.

Until the clinic API tunnel is configured and online, the site itself may load, but live clinic details, available slots, reviews and appointment submission will not work.

## Step 7 — Connect the clinic computer to the restricted API

Follow `deployment/windows-api-gateway/SETUP_WINDOWS_API.md`. It is already customized for `api.vinayakdentalcare.org`. This uses Caddy bound to localhost and Cloudflare Tunnel. It exposes only these four paths:

- `GET /public-api/clinic`
- `GET /public-api/availability`
- `GET /public-api/reviews`
- `POST /public-api/book`

All other paths must return 404. Do not expose port 8765 or the staff app directly. Never create a router port-forward to ports 8765 or 8081.

## Step 8 — Test before sharing the address

1. Open `https://vinayakdentalcare.org` using mobile data.
2. Check logo, fonts, address, phone number, map and Google profile link.
3. Open `https://api.vinayakdentalcare.org/public-api/clinic`; it should return public clinic JSON only after the API gateway is running.
4. Test `https://api.vinayakdentalcare.org/` and `https://api.vinayakdentalcare.org/api/`; both must return 404.
5. Submit a test appointment with your own test details. Confirm it reaches the clinic application as **Requested**. It is not automatically confirmed. Cancel/delete the test request afterward.
6. Only share the site after all security tests pass.

## Ongoing maintenance

- Keep GitHub and Cloudflare accounts protected with two-factor authentication.
- Keep Windows, the clinic app, Caddy and cloudflared updated.
- Back up the clinic database and patient files separately; this website repository is not a patient-data backup.
- Do not commit patient records, clinic database files, OAuth credentials, tunnel JSON credentials, passwords, API tokens or backups to GitHub.
- Test a booking monthly and verify that a restore from backup is possible.
- Keep the clinic computer on, awake, and connected for live booking functionality.

## If you get stuck

Stop before changing DNS if your domain is already used for email or an existing website. Keep a screenshot of the Cloudflare error message (hide account identifiers and tokens) and ask for help. Never paste passwords or private credentials into chat.
