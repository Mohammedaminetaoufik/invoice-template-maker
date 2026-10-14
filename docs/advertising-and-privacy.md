# Future advertising and analytics integration

Advertising is inactive. `AdvertisingSlot` declares two hidden placements after the generator and after content. These do not load scripts, display advertisements, reserve layout space or send events. Do not put advertisements or product branding inside generated invoices.

No analytics is active. `lib/privacy-preferences.ts` provides a fail-closed reader for future consent preferences. This is preparation, not an active consent manager or a statement that approval has been obtained from Google AdSense.

Before activating an integration:

1. Obtain the owner's approval and choose an actual provider.
2. Update the English and French privacy policies with the provider, purpose, data, controls and retention.
3. Provide visible, equally accessible accept, decline and withdrawal controls where required. Keep analytics and advertising disabled until explicit preferences allow them.
4. Start scripts only after consent; respect later withdrawal and applicable browser privacy signals.
5. Never send invoice names, customer details, addresses, invoice numbers, line items, bank details, amounts, uploaded logos, backups or draft contents. Do not use session replay or form capture on the generator.
6. Restrict any approved measurement to coarse website events such as page categories and generic action names; avoid full query strings, draft identifiers and user-entered text.
7. Place ads below the primary workflow, reserve stable sizes only when ads are enabled, and measure layout shifts. Keep downloads free and unrestricted.

About, Contact, Privacy and Terms pages are linked from the footer in both languages. The Contact page links to the existing public repository for issues and to Ternyxa. No business address or private email address has been invented.
