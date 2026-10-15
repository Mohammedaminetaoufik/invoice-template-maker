import { describe, expect, it } from "vitest";
import { readPrivacyPreferences } from "@/lib/privacy-preferences";

describe("future privacy preferences", () => {
  it("defaults to no analytics and no advertising", () => {
    expect(readPrivacyPreferences({ getItem: () => null })).toEqual({ version: 1, analytics: false, advertising: false });
  });
  it("fails closed for blocked or malformed storage", () => {
    expect(readPrivacyPreferences({ getItem: () => { throw new Error(); } }).analytics).toBe(false);
    expect(readPrivacyPreferences({ getItem: () => '{"analytics":"yes"}' }).advertising).toBe(false);
  });
});
