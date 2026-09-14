"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { Paginated, QuestionView } from "../../lib/api/types";
import { useToast } from "../../lib/ui/toast-context";
import { IconMessageCircle } from "../icons";

interface QuestionsSectionProps {
  productId: string;
  productSlug: string;
}

export function QuestionsSection({ productId, productSlug }: QuestionsSectionProps): React.ReactNode {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback((): void => {
    apiFetch<Paginated<QuestionView>>(`/catalog/products/${productSlug}/questions`, { revalidate: false })
      .then((response) => setQuestions(response.data))
      .catch(() => setQuestions([]));
  }, [productSlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await apiFetch(`/catalog/products/${productId}/questions`, {
        method: "POST",
        body: { authorName, email, question },
        revalidate: false
      });
      setFormOpen(false);
      setQuestion("");
      showToast({ message: "Pregunta enviada. Te responderemos muy pronto." });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar la pregunta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-900">Preguntas sobre el producto</h2>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
        >
          {formOpen ? "Cancelar" : "Hacer una pregunta"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={(event) => void submit(event)} className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              minLength={2}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Tu correo (para avisarte la respuesta)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <textarea
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="¿Qué quieres saber sobre este producto?"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Enviar pregunta"}
          </button>
        </form>
      )}

      {questions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          <IconMessageCircle size={20} className="shrink-0 text-brand-400" />
          Nadie ha preguntado todavía. Resuelve tus dudas antes de comprar: respondemos rápido.
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-navy-900">{entry.question}</p>
              <p className="mt-0.5 text-xs text-slate-400">{entry.authorName}</p>
              {entry.answer && (
                <div className="mt-3 rounded-xl bg-brand-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Respuesta de Limpiarte</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{entry.answer}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
