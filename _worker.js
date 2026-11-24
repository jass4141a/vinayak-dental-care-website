/**
 * Cloudflare Pages Advanced Mode worker for Vinayak Dental Care.
 *
 * Static pages are served from Pages assets. Only the four public booking
 * endpoints are proxied to the clinic API tunnel. No staff application or
 * patient-record API paths are forwarded.
 *
 * Set the Pages runtime variable VDC_API_ORIGIN to:
 *   https://api.vinayakdentalcare.org
 */
const PUBLIC_API_METHODS = new Map([
  ["/public-api/clinic", "GET"],
  ["/public-api/availability", "GET"],
  ["/public-api/reviews", "GET"],
  ["/public-api/book", "POST"],
]);

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const pageUrl = new URL(request.url);

    // Preserve links used by earlier versions of the clinic application.
    if (pageUrl.pathname === "/website" || pageUrl.pathname === "/website/") {
      return Response.redirect(new URL("/#book", pageUrl), 302);
    }
    if (pageUrl.pathname === "/book" || pageUrl.pathname === "/book/") {
      return Response.redirect(new URL("/#book", pageUrl), 302);
    }

    if (pageUrl.pathname.startsWith("/public-api/")) {
      const expectedMethod = PUBLIC_API_METHODS.get(pageUrl.pathname);
      if (!expectedMethod) return textResponse("Not found", 404);
      if (request.method !== expectedMethod) {
        return new Response("Method not allowed", {
          status: 405,
          headers: { "Allow": expectedMethod, "Cache-Control": "no-store" },
        });
      }

      if (!env.VDC_API_ORIGIN) {
        return textResponse("The clinic booking API has not been configured yet.", 503);
      }

      let apiOrigin;
      try {
        apiOrigin = new URL(env.VDC_API_ORIGIN);
      } catch (_) {
        return textResponse("The clinic API address is invalid.", 500);
      }
      if (apiOrigin.protocol !== "https:" || apiOrigin.pathname !== "/" || apiOrigin.search || apiOrigin.hash) {
        return textResponse("VDC_API_ORIGIN must be an HTTPS origin, for example https://api.example.in.", 500);
      }

      const upstreamUrl = new URL(pageUrl.pathname + pageUrl.search, apiOrigin.origin);
      const initialProxyRequest = new Request(upstreamUrl.toString(), request);
      const upstreamHeaders = new Headers(initialProxyRequest.headers);

      // The clinic server's existing same-origin check expects the API host.
      // The browser still talks to this website origin; this rewrite happens
      // only inside the Cloudflare Worker-to-tunnel request.
      upstreamHeaders.set("Origin", apiOrigin.origin);
      upstreamHeaders.delete("Cookie");
      upstreamHeaders.delete("Authorization");

      const upstreamRequest = new Request(initialProxyRequest, {
        headers: upstreamHeaders,
        redirect: "manual",
      });

      try {
        const upstreamResponse = await fetch(upstreamRequest);
        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.set("Cache-Control", "no-store");
        responseHeaders.set("X-Content-Type-Options", "nosniff");
        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        });
      } catch (_) {
        return textResponse("The clinic server is not reachable right now. Please call the clinic or try again later.", 502);
      }
    }

    // All non-API requests are served as static files by Cloudflare Pages.
    return env.ASSETS.fetch(request);
  },
};
