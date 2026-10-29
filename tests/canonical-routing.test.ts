import { describe, expect, it, vi } from "vitest";
import worker from "../worker";

describe("canonical edge routing", () => {
  it.each([
    ["http://invoicetemplatemaker.com/en/?template=corporate", "https://invoicetemplatemaker.com/en/?template=corporate"],
    ["http://invoicetemplatemaker.com/?template=corporate&utm_source=test", "https://invoicetemplatemaker.com/en/?template=corporate&utm_source=test"],
    ["https://invoicetemplatemaker.com/", "https://invoicetemplatemaker.com/en/"],
    ["https://invoicetemplatemaker.com/index.html", "https://invoicetemplatemaker.com/en/"],
    ["http://www.invoicetemplatemaker.com/fr/facture-freelance/", "https://invoicetemplatemaker.com/fr/facture-freelance/"],
    ["https://preview.workers.dev/?template=modern", "https://preview.workers.dev/en/?template=modern"],
  ])("redirects %s directly to %s", async (source, destination) => {
    const fetch = vi.fn();
    const response = await worker.fetch(new Request(source), { ASSETS: { fetch } });
    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe(destination);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["/en/?template=corporate", "/fr/", "/fr/facture-freelance/", "/sitemap.xml", "/sw.js", "/missing-page/"])("serves %s without redirect loops or replacing asset status", async (path) => {
    const request = new Request(`https://invoicetemplatemaker.com${path}`);
    const result = new Response("asset", { status: path === "/missing-page/" ? 404 : 200 });
    const fetch = vi.fn().mockResolvedValue(result);
    expect(await worker.fetch(request, { ASSETS: { fetch } })).toBe(result);
    expect(fetch).toHaveBeenCalledWith(request);
  });
});
