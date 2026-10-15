export const templateIds = ["modern", "minimal", "classic", "corporate", "elegant", "creative", "freelance", "retail"] as const;
export type TemplateId = (typeof templateIds)[number];

export interface TemplateStyle {
  titleSize: number;
  titlePosition: "left" | "center" | "right";
  header: "strip" | "plain" | "rule" | "panel" | "frame";
  table: "accent" | "pale" | "dark" | "outline";
  striped: boolean;
  padding: number;
  summaryPosition: "left" | "right";
  compact: boolean;
}

export const templateStyles: Record<TemplateId, TemplateStyle> = {
  modern: { titleSize: 28, titlePosition: "left", header: "strip", table: "accent", striped: true, padding: 8, summaryPosition: "right", compact: false },
  minimal: { titleSize: 22, titlePosition: "left", header: "plain", table: "pale", striped: false, padding: 7, summaryPosition: "right", compact: false },
  classic: { titleSize: 28, titlePosition: "left", header: "rule", table: "dark", striped: true, padding: 8, summaryPosition: "right", compact: false },
  corporate: { titleSize: 24, titlePosition: "left", header: "panel", table: "accent", striped: true, padding: 10, summaryPosition: "right", compact: false },
  elegant: { titleSize: 26, titlePosition: "center", header: "frame", table: "outline", striped: false, padding: 11, summaryPosition: "right", compact: false },
  creative: { titleSize: 36, titlePosition: "right", header: "strip", table: "accent", striped: false, padding: 12, summaryPosition: "left", compact: false },
  freelance: { titleSize: 20, titlePosition: "left", header: "rule", table: "outline", striped: false, padding: 6, summaryPosition: "left", compact: true },
  retail: { titleSize: 24, titlePosition: "center", header: "panel", table: "pale", striped: true, padding: 6, summaryPosition: "right", compact: true },
};

export function isTemplate(value: unknown): value is TemplateId {
  return typeof value === "string" && templateIds.includes(value as TemplateId);
}

export function templateAccent(template: TemplateId, selected: string) {
  return template === "corporate" && selected === "#ec6d3f" ? "#245b8e" : selected;
}
