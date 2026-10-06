"use client";

import { useMemo, useState } from "react";
import {
  IconBookOpen,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconHelpCircle,
  IconSearch,
  IconX
} from "../../../../components/icons";
import {
  MANUAL_ENTRY_COUNT,
  MANUAL_GROUPS,
  MANUAL_SECTIONS,
  ManualEntry,
  ManualGroup,
  ManualSection
} from "../../../../lib/manual/manual-content";

/** Minúsculas y sin tildes, manteniendo la longitud para poder resaltar sobre el texto original. */
function fold(value: string): string {
  return Array.from(value)
    .map((char) => {
      const stripped = char.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      return stripped.length === 1 ? stripped : char.toLowerCase();
    })
    .join("");
}

function tokenize(value: string): string[] {
  return fold(value)
    .split(/[^a-z0-9ñ]+/)
    .filter((token) => token.length > 1);
}

interface ScoredEntry {
  entry: ManualEntry;
  section: ManualSection;
  score: number;
}

/**
 * Puntúa qué tan directo es el resultado: primero lo que coincide en la pregunta,
 * luego las formas alternativas de preguntarlo y de último el cuerpo de la respuesta.
 * Exige que TODOS los términos escritos aparezcan en algún lado de la entrada.
 */
function scoreEntry(entry: ManualEntry, tokens: string[]): number {
  const question = fold(entry.question);
  const aliases = (entry.aliases ?? []).map(fold);
  const answer = fold(entry.answer.join(" "));
  let total = 0;

  for (const token of tokens) {
    let best = 0;
    if (question.startsWith(token)) best = 5;
    else if (question.split(/[^a-z0-9ñ]+/).some((word) => word.startsWith(token))) best = 4;
    else if (question.includes(token)) best = 3;
    else if (aliases.some((alias) => alias.includes(token))) best = 2;
    else if (answer.includes(token)) best = 1;

    if (best === 0) return 0; // falta un término: la entrada no aplica
    total += best;
  }

  return total;
}

/** Resalta el primer tramo que coincide con alguno de los términos buscados. */
function Highlight({ text, tokens }: { text: string; tokens: string[] }): React.ReactNode {
  if (tokens.length === 0) return <>{text}</>;

  const folded = fold(text);
  if (folded.length !== text.length) return <>{text}</>;

  const ranges: { start: number; end: number }[] = [];
  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const at = folded.indexOf(token, from);
      if (at < 0) break;
      ranges.push({ start: at, end: at + token.length });
      from = at + token.length;
    }
  }
  if (ranges.length === 0) return <>{text}</>;

  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((range, index) => {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(
      <mark key={index} className="rounded bg-amber-200/70 px-0.5 font-semibold text-navy-900">
        {text.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

function CopyButton({ entry }: { entry: ManualEntry }): React.ReactNode {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(entry.answer.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Navegador sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copiar la respuesta"
      className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
        copied ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-300 text-stone-600 hover:bg-stone-100"
      }`}
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      {copied ? "Copiada" : "Copiar"}
    </button>
  );
}

function EntryCard({
  entry,
  section,
  tokens,
  showSection,
  defaultOpen
}: {
  entry: ManualEntry;
  section: ManualSection;
  tokens: string[];
  showSection: boolean;
  defaultOpen: boolean;
}): React.ReactNode {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50"
      >
        <span className="min-w-0 flex-1">
          {showSection && (
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-brand-600">{section.title}</span>
          )}
          <span className="block text-sm font-semibold text-navy-900">
            <Highlight text={entry.question} tokens={tokens} />
          </span>
        </span>
        <IconChevronDown
          size={17}
          className={`mt-0.5 flex-shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-4">
          <div className="space-y-2.5 text-sm leading-relaxed text-stone-700">
            {entry.answer.map((paragraph, index) => (
              <p key={index}>
                <Highlight text={paragraph} tokens={tokens} />
              </p>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <CopyButton entry={entry} />
          </div>
        </div>
      )}
    </article>
  );
}

export default function ManualPage(): React.ReactNode {
  const [term, setTerm] = useState("");
  const [group, setGroup] = useState<ManualGroup | "todos">("todos");
  const [sectionId, setSectionId] = useState<string | null>(null);

  const tokens = useMemo(() => tokenize(term), [term]);
  const searching = tokens.length > 0;

  const scopedSections = useMemo(
    () => MANUAL_SECTIONS.filter((section) => group === "todos" || section.group === group),
    [group]
  );

  const results = useMemo<ScoredEntry[]>(() => {
    if (!searching) return [];
    const scored: ScoredEntry[] = [];
    for (const section of scopedSections) {
      for (const entry of section.entries) {
        const score = scoreEntry(entry, tokens);
        if (score > 0) scored.push({ entry, section, score });
      }
    }
    return scored.sort((a, b) => b.score - a.score || a.entry.question.localeCompare(b.entry.question, "es"));
  }, [scopedSections, searching, tokens]);

  const visibleSections = useMemo(
    () => (sectionId ? scopedSections.filter((section) => section.id === sectionId) : scopedSections),
    [scopedSections, sectionId]
  );

  function resetFilters(): void {
    setTerm("");
    setSectionId(null);
    setGroup("todos");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
            <IconHelpCircle size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Manual de funciones</h1>
            <p className="mt-0.5 text-sm text-stone-500">
              {MANUAL_ENTRY_COUNT} respuestas documentadas sobre la operación del servicio y el uso de la plataforma.
            </p>
          </div>
        </div>
      </header>

      {/* ── Buscador ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="relative">
          <IconSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Escribe la duda del cliente: planchado, cancelar, cocinar, productos…"
            aria-label="Buscar en el manual"
            className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3 pl-12 pr-11 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/25"
          />
          {term.length > 0 && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition hover:bg-stone-200 hover:text-navy-900"
            >
              <IconX size={15} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(["todos", ...MANUAL_GROUPS.map((item) => item.id)] as const).map((id) => {
            const label = id === "todos" ? "Todo el manual" : MANUAL_GROUPS.find((item) => item.id === id)?.title;
            const active = group === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setGroup(id);
                  setSectionId(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  active ? "bg-brand-600 text-white" : "border border-stone-300 text-stone-600 hover:border-brand-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {!searching && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => setSectionId(null)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                sectionId === null ? "bg-stone-200 text-navy-900" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              Todos los temas
            </button>
            {scopedSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSectionId(section.id === sectionId ? null : section.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  sectionId === section.id ? "bg-stone-200 text-navy-900" : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                {section.title}
                <span className="ml-1 text-stone-400">({section.entries.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Resultados de búsqueda ────────────────────────────── */}
      {searching ? (
        <section className="space-y-3">
          <p className="text-sm text-stone-500">
            {results.length === 0 ? (
              "Sin coincidencias"
            ) : (
              <>
                <span className="font-bold text-brand-600">{results.length}</span>{" "}
                {results.length === 1 ? "respuesta encontrada" : "respuestas encontradas"} para «{term.trim()}»
              </>
            )}
          </p>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
              <p className="font-semibold text-navy-900">No encontramos nada con esos términos</p>
              <ul className="mx-auto mt-3 max-w-md space-y-1 text-left text-sm text-stone-500">
                <li>· Prueba con menos palabras o con una sola palabra clave.</li>
                <li>· Usa el término del cliente: «cocinar», «cancelar», «vidrios», «factura».</li>
                <li>· Revisa si tienes un grupo filtrado arriba.</li>
              </ul>
              <button type="button" onClick={resetFilters} className="mt-4 text-sm font-bold text-brand-600 hover:underline">
                Limpiar búsqueda y filtros
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.map(({ entry, section }, index) => (
                <EntryCard
                  key={`${section.id}-${entry.id}`}
                  entry={entry}
                  section={section}
                  tokens={tokens}
                  showSection
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ── Navegación por temas ────────────────────────────── */
        <div className="space-y-7">
          {visibleSections.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex items-start gap-2.5">
                <IconBookOpen size={18} className="mt-0.5 flex-shrink-0 text-stone-400" />
                <div>
                  <h2 className="font-bold text-navy-900">{section.title}</h2>
                  <p className="text-sm text-stone-500">{section.summary}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {section.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    section={section}
                    tokens={tokens}
                    showSection={false}
                    defaultOpen={false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
