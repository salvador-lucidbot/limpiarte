import { PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

interface SectionHeadingProps {
  id: string;
  title: string | null;
  fallbackTitle: string;
  subtitle?: string | null;
  fallbackSubtitle?: string;
}

export function SectionHeading({ id, title, fallbackTitle, subtitle, fallbackSubtitle }: SectionHeadingProps): React.ReactNode {
  const resolvedTitle = title?.trim() || fallbackTitle;
  const resolvedSubtitle = subtitle?.trim() || fallbackSubtitle;

  return (
    <>
      <h2 id={id} className={PRODUCT_SECTION_TITLE_CLASS}>
        {resolvedTitle}
      </h2>
      {resolvedSubtitle && <p className="mt-0.5 text-sm text-slate-600 wrap-break-word">{resolvedSubtitle}</p>}
    </>
  );
}

export function resolveSectionTitle(title: string | null | undefined, fallback: string): string {
  return title?.trim() || fallback;
}
