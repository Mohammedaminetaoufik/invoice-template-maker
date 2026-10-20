import { describe, expect, it } from "vitest";
import { generateReminder, parseReminderAmount, reminderDueStatus, saveReminderPrefill, takeReminderPrefill, type ReminderDetails } from "@/lib/reminder";

const base: ReminderDetails = {
  clientName: "Alex & Co.", businessName: "Élan Studio", invoiceNumber: "INV-102", outstandingBalance: 500,
  currency: "USD", dueDate: "2026-10-10", senderSignature: "Maya", paymentInstructions: "Use reference INV-102.", tone: "friendly",
};

describe("payment reminder generation", () => {
  it.each(["friendly", "professional", "firm"] as const)("generates a deterministic English %s reminder", (tone) => {
    const result = generateReminder({ ...base, tone }, "en", "2026-10-20");
    expect(result.canSend).toBe(true);
    expect(result.dueStatus).toBe("overdue");
    expect(result.full).toContain("INV-102");
    expect(result.body).toContain("$500.00");
    expect(result.body).toContain("Alex & Co.");
    expect(result.body).toContain("Use reference INV-102.");
  });

  it.each(["friendly", "professional", "firm"] as const)("generates natural French for the %s tone", (tone) => {
    const result = generateReminder({ ...base, currency: "EUR", tone }, "fr", "2026-10-20");
    expect(result.full).toMatch(/^Objet :/);
    expect(result.body).toContain("500,00");
    expect(result.body).toContain("facture INV-102");
    expect(result.body).toContain("Cordialement");
  });

  it("does not describe today or a future date as overdue", () => {
    const today = generateReminder({ ...base, dueDate: "2026-10-20" }, "en", "2026-10-20");
    const future = generateReminder({ ...base, dueDate: "2026-10-30", tone: "firm" }, "en", "2026-10-20");
    expect(today.dueStatus).toBe("today"); expect(today.body).toContain("due today"); expect(today.body).not.toContain("was due");
    expect(future.dueStatus).toBe("future"); expect(future.body).toContain("is due on"); expect(future.body).not.toContain("was due");
  });

  it("blocks a payment demand when the remaining balance is zero", () => {
    const result = generateReminder({ ...base, outstandingBalance: 0 }, "en", "2026-10-20");
    expect(result).toMatchObject({ canSend: false, dueStatus: "paid", subject: "" });
    expect(result.notice).toContain("no outstanding balance");
  });

  it("handles missing optional values, partial payments, special characters, and unknown dates", () => {
    const result = generateReminder({ ...base, clientName: "", businessName: "", senderSignature: "", invoiceNumber: "R&D\n2026", outstandingBalance: 125.25, currency: "KWD", dueDate: "" }, "en", "2026-10-20");
    expect(result.dueStatus).toBe("unknown");
    expect(result.subject).toContain("R&D 2026");
    expect(result.subject).not.toContain("\n");
    expect(result.body).toContain("Hello,");
    expect(result.body).toContain("KWD");
  });

  it("validates balances and due-state inputs", () => {
    expect(parseReminderAmount("")).toBeUndefined(); expect(parseReminderAmount("-1")).toBeUndefined(); expect(parseReminderAmount("nope")).toBeUndefined();
    expect(parseReminderAmount("0")).toBe(0); expect(parseReminderAmount("125.75")).toBe(125.75);
    expect(reminderDueStatus(1, "bad", "2026-10-20")).toBe("unknown");
  });

  it("uses a one-time, validated local handoff", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value), getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) };
    const prefill = { clientName: "Client", businessName: "Studio", invoiceNumber: "INV-8", outstandingBalance: 42, currency: "EUR" as const, dueDate: "2026-10-10", senderSignature: "Studio" };
    expect(saveReminderPrefill(storage, prefill)).toBe(true);
    expect(takeReminderPrefill(storage)).toEqual(prefill);
    expect(takeReminderPrefill(storage)).toBeUndefined();
    values.set("itm-payment-reminder-prefill-v1", JSON.stringify({ ...prefill, currency: "BTC" }));
    expect(takeReminderPrefill(storage)).toBeUndefined();
  });
});
