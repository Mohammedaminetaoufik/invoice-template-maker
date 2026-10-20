export interface PrivacyPreferences {
  version: 1;
  analytics: boolean;
  advertising: boolean;
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = { version: 1, analytics: false, advertising: false };
export const PRIVACY_PREFERENCES_KEY = "itm-privacy-preferences";

export function readPrivacyPreferences(storage: Pick<Storage, "getItem">): PrivacyPreferences {
  try {
    const json = storage.getItem(PRIVACY_PREFERENCES_KEY);
    if (!json) return { ...DEFAULT_PRIVACY_PREFERENCES };
    const value: unknown = JSON.parse(json);
    if (value && typeof value === "object" && "version" in value && value.version === 1 && "analytics" in value && typeof value.analytics === "boolean" && "advertising" in value && typeof value.advertising === "boolean") {
      return { version: 1, analytics: value.analytics, advertising: value.advertising };
    }
  } catch { /* Fail closed when consent storage is blocked or malformed. */ }
  return { ...DEFAULT_PRIVACY_PREFERENCES };
}

export function hasStoredPrivacyPreferences(storage: Pick<Storage, "getItem">) {
  try {
    const json = storage.getItem(PRIVACY_PREFERENCES_KEY);
    if (!json) return false;
    const value: unknown = JSON.parse(json);
    return Boolean(value && typeof value === "object" && "version" in value && value.version === 1 && "analytics" in value && typeof value.analytics === "boolean" && "advertising" in value && typeof value.advertising === "boolean");
  }
  catch { return false; }
}

export function writePrivacyPreferences(storage: Pick<Storage, "setItem">, preferences: PrivacyPreferences) {
  try { storage.setItem(PRIVACY_PREFERENCES_KEY, JSON.stringify(preferences)); return true; }
  catch { return false; }
}
