import { IconChevronDown } from "../../icons";

interface ShowMoreToggleProps {
  expanded: boolean;
  controls: string;
  onToggle: () => void;
  moreLabel?: string;
  lessLabel?: string;
}

export function ShowMoreToggle({
  expanded,
  controls,
  onToggle,
  moreLabel = "Ver más",
  lessLabel = "Ver menos"
}: ShowMoreToggleProps): React.ReactNode {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className="mt-1.5 inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-800 underline-offset-2 hover:underline"
    >
      <IconChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      {expanded ? lessLabel : moreLabel}
    </button>
  );
}
