import type { CurrencyCode, InvoiceDraft, LineItem } from "./invoice";

type Decimal = { numerator: bigint; denominator: bigint };

// Accept the decimal representation of the entered number, including exponent
// notation. All arithmetic and rounding then happen with integer ratios.
function decimal(value: number, name: string): Decimal {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Invalid ${name}`);
  if (value > 1e12) throw new RangeError(`${name} exceeds the supported limit`);
  const [significand, exponentText = "0"] = String(value).toLowerCase().split("e");
  const [whole, fraction = ""] = significand.split(".");
  const exponent = Number(exponentText) - fraction.length;
  const integer = BigInt(whole + fraction);
  return exponent >= 0
    ? { numerator: integer * 10n ** BigInt(exponent), denominator: 1n }
    : { numerator: integer, denominator: 10n ** BigInt(-exponent) };
}

function roundHalfUp(numerator: bigint, denominator: bigint) {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

export function currencyDigits(currency: CurrencyCode) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

function monetaryMinor(value: number, digits: number, name: string) {
  const ratio = decimal(value, name);
  return roundHalfUp(ratio.numerator * 10n ** BigInt(digits), ratio.denominator);
}

function percentMinor(amount: bigint, percent: number, name: string) {
  if (percent > 100) throw new RangeError(`${name} must be between 0 and 100`);
  const ratio = decimal(percent, name);
  return roundHalfUp(amount * ratio.numerator, ratio.denominator * 100n);
}

function toMoney(minor: bigint, digits: number) {
  // Leave enough decimal headroom for Intl formatting at the number boundary.
  if (minor > 1_000_000_000_000_000n) throw new RangeError("Invoice total exceeds the supported limit");
  return Number(minor) / 10 ** digits;
}

export function calculateLineMinor(item: LineItem, currency: CurrencyCode) {
  const quantity = decimal(item.quantity, "quantity");
  const rate = decimal(item.rate, "unit price");
  return roundHalfUp(quantity.numerator * rate.numerator * 10n ** BigInt(currencyDigits(currency)), quantity.denominator * rate.denominator);
}

export function calculateLineAmount(item: LineItem, currency: CurrencyCode) {
  return toMoney(calculateLineMinor(item, currency), currencyDigits(currency));
}

export function calculateTotals(draft: InvoiceDraft) {
  const digits = currencyDigits(draft.currency);
  const lineMinor = draft.items.map((item) => calculateLineMinor(item, draft.currency));
  const subtotalMinor = lineMinor.reduce((sum, value) => sum + value, 0n);
  const requestedDiscount = draft.discountType === "percent"
    ? percentMinor(subtotalMinor, draft.discountValue ?? 0, "discount")
    : monetaryMinor(draft.discountValue ?? 0, digits, "discount");
  const discountMinor = requestedDiscount > subtotalMinor ? subtotalMinor : requestedDiscount;
  const shippingMinor = monetaryMinor(draft.shipping ?? 0, digits, "shipping");
  const taxableMinor = subtotalMinor - discountMinor + shippingMinor;
  const taxMinor = percentMinor(taxableMinor, draft.taxRate, "tax rate");
  const totalMinor = taxableMinor + taxMinor;
  const depositMinor = monetaryMinor(draft.deposit ?? 0, digits, "deposit");
  const paidMinor = monetaryMinor(draft.amountPaid ?? 0, digits, "amount paid");
  const balanceMinor = totalMinor > depositMinor + paidMinor ? totalMinor - depositMinor - paidMinor : 0n;
  const creditMinor = depositMinor + paidMinor > totalMinor ? depositMinor + paidMinor - totalMinor : 0n;
  const money = (value: bigint) => toMoney(value, digits);
  return {
    lineAmounts: lineMinor.map(money),
    subtotal: money(subtotalMinor),
    discount: money(discountMinor),
    shipping: money(shippingMinor),
    tax: money(taxMinor),
    total: money(totalMinor),
    deposit: money(depositMinor),
    amountPaid: money(paidMinor),
    balance: money(balanceMinor),
    credit: money(creditMinor),
    // Exact values for downstream integrations; do not persist BigInt in JSON.
    minor: { subtotal: subtotalMinor, discount: discountMinor, shipping: shippingMinor, tax: taxMinor, total: totalMinor, balance: balanceMinor, credit: creditMinor },
  };
}
