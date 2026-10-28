import { IconChevronDown } from "../../icons";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

interface ProductFaqSectionProps {
  faqs: { question: string; answer: string }[];
}

export function ProductFaqSection({ faqs }: ProductFaqSectionProps): React.ReactNode {
  if (faqs.length === 0) return null;

  return (
    <section id="preguntas-frecuentes" aria-labelledby="preguntas-frecuentes-titulo" className={PRODUCT_SECTION_CLASS}>
      <h2 id="preguntas-frecuentes-titulo" className={PRODUCT_SECTION_TITLE_CLASS}>
        Preguntas frecuentes
      </h2>
      <div className="mt-4 space-y-3">
        {faqs.map((faq) => (
          <details key={faq.question} className="group rounded-xl border border-line bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {faq.question}
              <IconChevronDown size={18} className="shrink-0 text-slate-600 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
