"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { ReviewsResponse } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useToast } from "../../lib/ui/toast-context";
import { IconCheckCircle, IconStarFilled } from "../icons";
import { RatingStars } from "./rating-stars";

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
}

export function ReviewsSection({ productId, productSlug }: ReviewsSectionProps): React.ReactNode {
  const { token, customer } = useCustomerAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback((): void => {
    apiFetch<ReviewsResponse>(`/catalog/products/${productSlug}/reviews`, { revalidate: false })
      .then(setData)
      .catch(() => setData(null));
  }, [productSlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await apiFetch(`/catalog/products/${productId}/reviews`, {
        method: "POST",
        body: { rating, title: title || undefined, body },
        token,
        revalidate: false
      });
      setFormOpen(false);
      setTitle("");
      setBody("");
      showToast({ message: "¡Gracias! Tu reseña quedó pendiente de aprobación." });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar la reseña");
    } finally {
      setSubmitting(false);
    }
  }

  const summary = data?.summary;

  return (
    <section id="resenas" className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-900">Opiniones de clientes</h2>
        {customer ? (
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            {formOpen ? "Cancelar" : "Escribir reseña"}
          </button>
        ) : (
          <Link href="/cuenta/login" className="text-sm font-medium text-brand-600 hover:underline">
            Inicia sesión para dejar tu reseña
          </Link>
        )}
      </div>

      {formOpen && customer && (
        <form onSubmit={(event) => void submit(event)} className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-stone-700">Tu calificación</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} estrellas`}
                  className={value <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}
                >
                  <IconStarFilled size={26} />
                </button>
              ))}
            </div>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título (opcional)"
            maxLength={120}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Cuéntanos cómo te fue con el producto…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Publicar reseña"}
          </button>
        </form>
      )}

      {!data || summary === undefined || summary.count === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Este producto aún no tiene opiniones. ¡Sé la primera persona en contarnos tu experiencia!
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-4xl font-extrabold text-navy-900">{summary.average?.toFixed(1)}</p>
            <RatingStars rating={summary.average ?? 0} size={18} />
            <p className="mt-1 text-sm text-slate-500">
              {summary.count} opinión{summary.count === 1 ? "" : "es"}
            </p>
            <div className="mt-4 space-y-1.5">
              {summary.distribution.map((entry) => (
                <div key={entry.rating} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 font-semibold">{entry.rating}</span>
                  <IconStarFilled size={11} className="text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${summary.count > 0 ? (entry.count / summary.count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-5 text-right">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {data.data.map((review) => (
              <li key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <RatingStars rating={review.rating} />
                  {review.title && <p className="font-semibold text-navy-900">{review.title}</p>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.body}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  {review.authorName}
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <IconCheckCircle size={13} />
                      Compra verificada
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
