import { describe, expect, it } from "vitest";
import { hasStoredPrivacyPreferences, readPrivacyPreferences, writePrivacyPreferences } from "@/lib/privacy-preferences";

describe("future privacy preferences", () => {
  it("defaults to no analytics and no advertising", () => {
    expect(readPrivacyPreferences({ getItem: () => null })).toEqual({ version: 1, analytics: false, advertising: false });
  });
  it("fails closed for blocked or malformed storage", () => {
    expect(readPrivacyPreferences({ getItem: () => { throw new Error(); } }).analytics).toBe(false);
    expect(readPrivacyPreferences({ getItem: () => '{"analytics":"yes"}' }).advertising).toBe(false);
  });
  it("distinguishes an unanswered choice from an explicit decline", () => {
    expect(hasStoredPrivacyPreferences({ getItem: () => null })).toBe(false);
    expect(hasStoredPrivacyPreferences({ getItem: () => "malformed" })).toBe(false);
    expect(hasStoredPrivacyPreferences({ getItem: () => '{"version":1,"analytics":false,"advertising":false}' })).toBe(true);
  });
  it("writes the selected preferences", () => {
    let saved = "";
    writePrivacyPreferences({ setItem: (_key, value) => { saved = value; } }, { version: 1, analytics: true, advertising: false });
    expect(JSON.parse(saved)).toEqual({ version: 1, analytics: true, advertising: false });
    expect(writePrivacyPreferences({ setItem: () => { throw new Error(); } }, { version: 1, analytics: true, advertising: false })).toBe(false);
  });
});
