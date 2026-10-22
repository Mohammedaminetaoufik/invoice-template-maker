# Privacy-safe conversion measurement

Google Analytics 4 remains off until a visitor explicitly allows analytics. Cloudflare Web Analytics and GA4 should not be compared as if they count the same thing: edge requests can include crawlers, cached assets, and automated agents, while consent, content blockers, and JavaScript availability affect browser analytics.

The application sends no invoice content with its custom events. Event parameters are limited to non-sensitive interface context such as locale, template ID, reminder tone, due-state category, and copy target.

## GA4 events

| Event | Meaning |
|---|---|
| `invoice_template_selected` | A visitor deliberately selected an invoice design or followed a template CTA. |
| `invoice_customization_started` | The first invoice-data edit in the current page session. |
| `invoice_pdf_download` | PDF generation succeeded and the browser download was initiated. Failed generation is not counted. |
| `payment_reminder_generated` | The first valid, payable reminder preview in the current page session. A zero balance is not counted. |
| `payment_reminder_copy` | Clipboard copying succeeded; `copy_target` distinguishes full message, subject, or body. |
| `invoice_to_reminder` | A user deliberately moved from invoice review to the reminder tool. |

## Reporting

1. **Google impressions, clicks, position, and landing queries:** Google Search Console → Performance → Search results. Compare the same country/device/search-type filters and avoid drawing conclusions from a few days of data.
2. **Organic landing pages:** GA4 → Reports → Acquisition → Traffic acquisition, filter Session default channel group to Organic Search, then add Landing page + query string. Cross-check clicks in Search Console.
3. **X, Reddit, and other referrals:** GA4 Traffic acquisition by Session source / medium. Use honest campaign links such as `utm_source=x&utm_medium=social&utm_campaign=invoice_guide` only on outbound promotional posts—not canonical or internal site links.
4. **PDF completions and reminder usage:** GA4 → Reports → Engagement → Events. Review `invoice_pdf_download`, `payment_reminder_generated`, and `payment_reminder_copy`.
5. **Conversion rates:** divide the relevant completion event’s users or sessions by the matching landing-page/tool sessions. Keep the numerator and denominator on the same scope. Useful examples are PDF downloads per invoice-page session and successful reminder copies per reminder-tool session.
6. **Template engagement:** compare `invoice_template_selected` and `invoice_customization_started`; do not interpret repeated clicks as unique users.

Do not send client names, business names, emails, addresses, invoice numbers, payment instructions, banking details, line items, monetary amounts, uploaded logo data, or PDF content as event names, parameters, user properties, URLs, or UTM values.
