# Financial calculation rules

The preview and PDF use `lib/finance.ts`. Calculations operate on integer ratios using BigInt; JavaScript floating-point addition and multiplication do not determine monetary totals.

## Order and rounding

1. Parse each quantity and unit price from its decimal number representation, including scientific notation.
2. Multiply quantity by unit price exactly; round each line to the currency's minor unit using half-up rounding.
3. Add the rounded lines to obtain the subtotal.
4. Apply the fixed discount, or calculate the percentage discount on the subtotal and round half up. Cap a fixed discount at the subtotal.
5. Add rounded shipping to the discounted subtotal. Shipping is included in the taxable base.
6. Calculate tax on that base and round half up once.
7. Add the taxable base and tax to obtain the invoice total.
8. Subtract the deposit received and other amount already paid. These are distinct received payments; do not enter the same payment twice.
9. Clamp the remaining balance to zero and show excess received payments separately as overpayment.

No country-specific tax rate is assumed. This calculation order is the tool's explicit policy, not a claim that it meets every jurisdiction's tax rules.

## Currency precision

Precision comes from `Intl.NumberFormat` currency data. USD, EUR, MAD, CAD, GBP and CHF currently have two decimal places, JPY has zero, and KWD has three. Formatting follows the independently selected invoice document language.

## Validation and limits

Reject NaN, infinity and negative numeric inputs. Tax and percentage discounts must be between 0 and 100 inclusive. Each numerical input must not exceed 1,000,000,000,000. Monetary results exceeding 1,000,000,000,000,000 minor units are rejected rather than silently approximated; this leaves headroom below the safe integer limit when converting for currency formatting. The editor displays a localized error, and PDF generation is blocked.

Inputs are numbers at the existing editor/storage boundary. The engine preserves their decimal string representations. It cannot recover decimal digits that were already lost before receiving a JavaScript number; a future string-based numeric input model could expand this boundary.

Optional financial fields missing from legacy drafts default to zero. PDFs and previews use the same rounded line amounts, total, payments and remaining balance.
