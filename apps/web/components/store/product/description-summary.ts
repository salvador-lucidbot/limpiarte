const SUMMARY_MAX_LENGTH = 320;

export interface DescriptionSummary {
  text: string;
  truncated: boolean;
  hasMore: boolean;
}

export interface DescriptionLayout {
  summary: DescriptionSummary | null;
  bodyParagraphs: string[];
}

function descriptionParagraphs(description: string | null): string[] {
  return (description ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function summarize(paragraphs: string[]): DescriptionSummary | null {
  const [first] = paragraphs;
  if (!first) return null;
  const flat = first.replace(/\s+/g, " ");
  if (flat.length <= SUMMARY_MAX_LENGTH) return { text: flat, truncated: false, hasMore: paragraphs.length > 1 };
  const cut = flat.slice(0, SUMMARY_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return { text: `${cut.slice(0, lastSpace > 0 ? lastSpace : SUMMARY_MAX_LENGTH).trim()}…`, truncated: true, hasMore: true };
}

export function layoutDescription(highlights: string[], description: string | null): DescriptionLayout {
  const paragraphs = descriptionParagraphs(description);
  const hasHighlights = highlights.some((highlight) => highlight.trim().length > 0);
  const summary = hasHighlights ? null : summarize(paragraphs);
  if (!summary || summary.truncated) return { summary, bodyParagraphs: paragraphs };
  return { summary, bodyParagraphs: paragraphs.slice(1) };
}
