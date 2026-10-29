interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// Run before assets so HTTP documents cannot become a competing canonical.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const target = new URL(url);
    const productionHost = url.hostname === "invoicetemplatemaker.com" || url.hostname === "www.invoicetemplatemaker.com";
    if (productionHost) {
      target.protocol = "https:";
      target.hostname = "invoicetemplatemaker.com";
      target.port = "";
    }
    if (target.pathname === "/" || target.pathname === "/index.html") target.pathname = "/en/";
    if (target.href !== url.href) return Response.redirect(target.href, 308);
    return env.ASSETS.fetch(request);
  },
};
