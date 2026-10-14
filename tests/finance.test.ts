import { describe, expect, it } from "vitest";
import { calculateLineAmount, calculateTotals, currencyDigits } from "@/lib/finance";
import { createDefaultDraft, formatUnitPrice, type InvoiceDraft } from "@/lib/invoice";

function draft(values: Partial<InvoiceDraft> = {}) {
  return { ...createDefaultDraft("en"), ...values };
}

describe("exact financial calculations", () => {
  it("adds decimal line amounts exactly", () => {
    const result = calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 1, rate: .1 }, { id: "2", description: "b", quantity: 1, rate: .2 }] }));
    expect(result.subtotal).toBe(.3);
    expect(result.minor.subtotal).toBe(30n);
  });
  it("rounds each decimal-quantity line half up to minor units", () => {
    expect(calculateLineAmount({ id: "1", description: "a", quantity: .5, rate: 2.01 }, "USD")).toBe(1.01);
    expect(calculateLineAmount({ id: "1", description: "a", quantity: 1.005, rate: 1 }, "USD")).toBe(1.01);
  });
  it("computes percent discounts, taxable shipping, tax, deposit, paid and balance", () => {
    const result = calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 2.5, rate: 40 }], discountType: "percent", discountValue: 10, shipping: 5, taxRate: 20, deposit: 20, amountPaid: 4 }));
    expect(result).toMatchObject({ subtotal: 100, discount: 10, shipping: 5, tax: 19, total: 114, deposit: 20, amountPaid: 4, balance: 90, credit: 0 });
  });
  it("caps fixed discounts at the subtotal", () => {
    const result = calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 1, rate: 50 }], discountValue: 100, shipping: 10, taxRate: 10 }));
    expect(result).toMatchObject({ discount: 50, tax: 1, total: 11 });
  });
  it("rounds percentage tax on the discounted, rounded base", () => {
    expect(calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 1, rate: .05 }], taxRate: 10 })).tax).toBe(.01);
  });
  it("supports zero totals and reports overpayments separately", () => {
    expect(calculateTotals(draft())).toMatchObject({ total: 0, balance: 0 });
    expect(calculateTotals(draft({ deposit: 5, amountPaid: 10 }))).toMatchObject({ total: 0, balance: 0, credit: 15 });
  });
  it("respects zero, two and three currency fraction digits", () => {
    expect(currencyDigits("JPY")).toBe(0);
    expect(currencyDigits("EUR")).toBe(2);
    expect(currencyDigits("KWD")).toBe(3);
    const item = { id: "1", description: "a", quantity: 1, rate: 1.2345 };
    expect(calculateLineAmount(item, "JPY")).toBe(1);
    expect(calculateLineAmount(item, "EUR")).toBe(1.23);
    expect(calculateLineAmount(item, "KWD")).toBe(1.235);
  });
  it.each([NaN, Infinity, -1])("rejects invalid numeric input %s", (invalid) => {
    expect(() => calculateTotals(draft({ taxRate: invalid }))).toThrow(RangeError);
    expect(() => calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: invalid, rate: 1 }] }))).toThrow(RangeError);
    expect(() => calculateTotals(draft({ shipping: invalid }))).toThrow(RangeError);
  });
  it("rejects percentages outside 0–100", () => {
    expect(() => calculateTotals(draft({ taxRate: 101 }))).toThrow();
    expect(() => calculateTotals(draft({ discountType: "percent", discountValue: 101 }))).toThrow();
  });
  it("supports large amounts, exponent notation, and rejects unsafe totals", () => {
    expect(calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 1e3, rate: 1e6 }] })).total).toBe(1e9);
    expect(calculateLineAmount({ id: "1", description: "a", quantity: 1e-3, rate: 1e3 }, "USD")).toBe(1);
    expect(() => calculateTotals(draft({ items: [{ id: "1", description: "a", quantity: 1e12, rate: 1e12 }] }))).toThrow();
  });
  it("subtotal is the sum of displayed rounded lines, not unrounded products", () => {
    const result = calculateTotals(draft({ items: [1, 2, 3].map((n) => ({ id: String(n), description: "a", quantity: 1, rate: .335 })) }));
    expect(result.lineAmounts).toEqual([.34, .34, .34]);
    expect(result.subtotal).toBe(1.02);
  });
  it("keeps unit-price precision visible while rounding the line amount", () => {
    expect(formatUnitPrice(.3333, "USD", "en")).toBe("$0.3333");
    expect(calculateLineAmount({ id: "1", description: "a", quantity: 3, rate: .3333 }, "USD")).toBe(1);
  });
  it("formats near-limit amounts without dropping a minor unit", () => {
    const result = calculateTotals(draft({ currency: "KWD", items: [{ id: "1", description: "a", quantity: 1, rate: 999999999999.999 }] }));
    expect(result.minor.subtotal).toBe(999999999999999n);
    expect(result.subtotal).toBe(999999999999.999);
  });
});
