# Clinic computer API gateway setup (Windows)

This guide connects the independently hosted Cloudflare Pages website to the existing Vinayak Dental Care server. It publishes only the website's four public API routes. It does not publish the internal clinic application.

## Requirements

- Vinayak Dental Care v3.2.0 (or compatible later version) running in **Server** mode on the clinic computer, normally at `127.0.0.1:8765`.
- A domain managed in the same Cloudflare account as your Cloudflare Pages project.
- A Cloudflare Tunnel, `cloudflared` for Windows, and Caddy for Windows.
- The website Pages project must use `https://api.vinayakdentalcare.org` as `VDC_API_ORIGIN`.

## 1. Install Caddy

1. Download the Windows Caddy build from https://caddyserver.com/download.
2. Create `C:\Caddy`.
3. Copy the executable there and rename it `caddy.exe`.
4. Copy `Caddyfile.example` from this folder to `C:\Caddy\Caddyfile`.
5. Edit the line `header_up Host api.vinayakdentalcare.org` and replace the example with your actual API hostname, such as `api.vinayakdentalcare.org`.

The Caddy listener is bound only to `127.0.0.1:8081`, so it is not directly reachable from other computers on the network.

## 2. Install cloudflared

1. Download the Windows `cloudflared` executable from https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/.
2. Create `C:\Cloudflared` and save it there as `cloudflared.exe`.
3. Open PowerShell.
4. Run:

```powershell
cd C:\Cloudflared
.\cloudflared.exe tunnel login
```

A browser opens. Sign in to your Cloudflare account and authorize the domain.

5. Create the tunnel:

```powershell
.\cloudflared.exe tunnel create vdc-booking-api
```

Copy the tunnel UUID shown by this command.

6. Create the public DNS route:

```powershell
.\cloudflared.exe tunnel route dns vdc-booking-api api.vinayakdentalcare.org
```

Replace `api.vinayakdentalcare.org` with your own hostname.

## 3. Configure the tunnel

1. Copy `cloudflared-config.example.yml` to:

`%USERPROFILE%\.cloudflared\config.yml`

2. Replace `YOUR-TUNNEL-UUID` with the UUID from the create command.
3. Replace `YOUR-WINDOWS-USERNAME` with your Windows account folder name.
4. Replace the sample hostname `api.vinayakdentalcare.org` with your actual API hostname.
5. Save the file.

Do not share the generated tunnel JSON credentials file or put it in the website repository.

## 4. Start and test the services

Start the clinic application in Server mode first. Then open one Command Prompt window and run:

```bat
C:\Caddy\caddy.exe validate --config C:\Caddy\Caddyfile
C:\Caddy\caddy.exe run --config C:\Caddy\Caddyfile
```

Open a second Command Prompt window and run:

```bat
C:\Cloudflared\cloudflared.exe tunnel --config "%USERPROFILE%\.cloudflared\config.yml" run vdc-booking-api
```

Keep these windows running while testing.

## 5. Test the restricted API

Open these URLs in a browser, replacing the hostname:

- `https://api.vinayakdentalcare.org/public-api/clinic` — should return public clinic information as JSON.
- `https://api.vinayakdentalcare.org/public-api/reviews` — should return public review data as JSON.

The following should return **404 Not found**:

- `https://api.vinayakdentalcare.org/`
- `https://api.vinayakdentalcare.org/api/`
- `https://api.vinayakdentalcare.org/website`

The API hostname is intentionally not a public website. The website runs on the separate Pages hostname.

## 6. Set the Pages variable

In Cloudflare Dashboard:

1. Open **Workers & Pages**.
2. Select your Pages website project.
3. Open **Settings → Variables and Secrets** (runtime variables / bindings).
4. Add `VDC_API_ORIGIN` with value `https://api.vinayakdentalcare.org`.
5. Save and redeploy the Pages project if Cloudflare asks you to.

The value must be the API origin only. Do not add `/public-api` at the end.

## 7. Security checks

- Never create a router port-forward to port `8765` or `8081`.
- Do not add a public hostname directly to port `8765`; it must go through the Caddy allow-list in this folder.
- Do not change the `handle` fallback in Caddy to proxy all paths.
- Do not publish the internal clinic application, `/api/`, patient records, backups, or data folder.
- Keep Windows, the clinic app, Caddy, and `cloudflared` updated.
- Back up the clinic database separately. The website ZIP is not a backup of patient data.

## 8. Start automatically after successful testing

Only after manual tests succeed, you may configure Caddy and `cloudflared` to start with Windows. Cloudflare's official Windows service instructions are here:
https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/as-a-service/windows/

Keep the clinic application server running as well. If the clinic computer, power, or internet connection is down, appointment availability and submission will be temporarily unavailable even though the static website itself remains hosted.
