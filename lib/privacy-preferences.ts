export interface PrivacyPreferences {
  version: 1;
  analytics: boolean;
  advertising: boolean;
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = { version: 1, analytics: false, advertising: false };

// Future optional integrations must read explicit consent before starting.
// No integration currently imports this module or transmits analytics events.
export function readPrivacyPreferences(storage: Pick<Storage, "getItem">): PrivacyPreferences {
  try {
    const json = storage.getItem("itm-privacy-preferences");
    if (!json) return { ...DEFAULT_PRIVACY_PREFERENCES };
    const value: unknown = JSON.parse(json);
    if (value && typeof value === "object" && "version" in value && value.version === 1 && "analytics" in value && typeof value.analytics === "boolean" && "advertising" in value && typeof value.advertising === "boolean") {
      return { version: 1, analytics: value.analytics, advertising: value.advertising };
    }
  } catch { /* Fail closed when consent storage is blocked or malformed. */ }
  return { ...DEFAULT_PRIVACY_PREFERENCES };
}
