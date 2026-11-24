# Beginner guide: upload this website and publish it for free

This website package is separate from the Vinayak Dental Care Windows app. It contains only public website files and a Cloudflare Pages Worker for the narrow public booking API. Do not add the clinic application ZIP, database, patient records, or credentials to GitHub.

## A. Upload the website to GitHub

1. Sign in to https://github.com/ using the account you control for the clinic.
2. Open https://github.com/new.
3. Enter repository name: `vinayak-dental-care-website`.
4. Choose **Public**. This repository contains public website source only. Do not upload any patient data or private credentials.
5. Do not tick the boxes to create a README, .gitignore, or licence; this folder already contains a README and `.gitignore`.
6. Create the repository.
7. Open the new empty repository and choose **Add file → Upload files**.
8. On your computer, extract this ZIP. Open the extracted folder and select all the files and folders *inside it*. Upload those files into the repository root. The top level must show `index.html`, `_worker.js`, `_headers`, `logo.png`, `site/`, and `deployment/`.
9. Scroll down, write the commit message `Initial Vinayak Dental Care website`, and choose **Commit changes**.

## B. Deploy to Cloudflare Pages (Free plan)

1. Sign in to https://dash.cloudflare.com/ or create a free account.
2. Open **Workers & Pages** and choose **Create application**.
3. Select **Pages** and **Connect to Git**.
4. Connect GitHub, approve Cloudflare's GitHub app, and select `vinayak-dental-care-website`.
5. Set:
   - Project name: `vinayak-dental-care`
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `.`
6. Click **Save and Deploy**.
7. When deployment completes, open the generated `*.pages.dev` address and confirm that the homepage appears.

## C. Add your domain

Only do this after confirming that you own `vinayakdentalcare.org` or have registered it. Domain registration is paid; the Pages Free plan is separate.

1. In Cloudflare, add `vinayakdentalcare.org` as a website/zone and choose the Free plan.
2. Review all DNS records Cloudflare detects. If the domain is used for email, preserve every MX, SPF, DKIM, and DMARC record before changing nameservers.
3. At the domain registrar, replace the nameservers with the exact two Cloudflare nameservers shown in your account.
4. Wait until Cloudflare says the zone is **Active**.
5. In **Workers & Pages → vinayak-dental-care → Custom domains**, choose **Set up a domain**, enter `vinayakdentalcare.org`, and follow the prompts.
6. Wait for the domain status and HTTPS certificate to become active.

## D. Set the clinic API origin (needed for live booking)

1. In Cloudflare Pages, open the project settings and find **Variables and Secrets**.
2. Add a production runtime variable:
   - Name: `VDC_API_ORIGIN`
   - Value: `https://api.vinayakdentalcare.org`
3. Save. If Cloudflare prompts you, redeploy the project.
4. Follow `deployment/windows-api-gateway/SETUP_WINDOWS_API.md` on the clinic Windows computer to connect the secure API tunnel.

The homepage can be hosted even while the clinic server is offline. However, checking appointment availability and submitting bookings will work only after the clinic computer, clinic application, Caddy gateway, and Cloudflare Tunnel are running.

## Security rules

- Do not upload the application ZIP, clinic database, patient files, exports, backups, Google OAuth credentials, passwords, or Cloudflare tunnel credential JSON to GitHub.
- Do not make router port-forward rules for ports `8765` or `8081`.
- The API gateway must return 404 for `/`, `/api/`, and `/website` on `api.vinayakdentalcare.org`.
- Test a dummy appointment using your own contact details before announcing the website, then remove/cancel it.
