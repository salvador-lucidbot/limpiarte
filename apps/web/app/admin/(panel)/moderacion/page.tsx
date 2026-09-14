"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, inputClass, Table } from "../../../../components/admin/ui";
import { IconCheck, IconStarFilled, IconX } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatDate } from "../../../../lib/format";
import { Loader } from "../../../../components/loader";

interface ReviewRow {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  product: { name: string; slug: string };
}

interface QuestionRow {
  id: string;
  authorName: string;
  email: string;
  question: string;
  answer: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  product: { name: string; slug: string };
}

const STATUS_LABELS: Record<string, string> = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada" };

function statusToneOf(status: string): "warning" | "success" | "danger" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

export default function ModerationPage(): React.ReactNode {
  const [tab, setTab] = useState<"resenas" | "preguntas">("resenas");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Reseñas y preguntas</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200">
        <div className="flex gap-2">
          {(
            [
              ["resenas", "Reseñas"],
              ["preguntas", "Preguntas"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium ${tab === key ? "border-b-2 border-brand-500 text-brand-700" : "text-stone-500 hover:text-stone-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${inputClass} mb-2 max-w-44`}>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {tab === "resenas" ? <ReviewsTab statusFilter={statusFilter} /> : <QuestionsTab statusFilter={statusFilter} />}
    </div>
  );
}

function ReviewsTab({ statusFilter }: { statusFilter: string }): React.ReactNode {
  const query = statusFilter ? `?status=${statusFilter}` : "";
  const { data, loading, reload } = useAdminGet<Paginated<ReviewRow>>(`/admin/moderation/reviews${query}`);
  const request = useAdminRequest();

  async function moderate(id: string, status: "APPROVED" | "REJECTED"): Promise<void> {
    await request(`/admin/moderation/reviews/${id}`, "PUT", { status });
    await reload();
  }

  if (loading) return <Loader />;
  if (!data || data.data.length === 0) return <Card><EmptyState message="No hay reseñas en este estado" /></Card>;

  return (
    <Card>
      <Table headers={["Producto", "Reseña", "Cliente", "Estado", "Acciones"]}>
        {data.data.map((review) => (
          <tr key={review.id} className="border-b border-stone-50 align-top">
            <td className="px-3 py-2 font-medium text-navy-900">{review.product.name}</td>
            <td className="max-w-md px-3 py-2">
              <span className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: review.rating }, (_, index) => (
                  <IconStarFilled key={index} size={12} />
                ))}
              </span>
              {review.title && <p className="mt-1 font-semibold text-stone-800">{review.title}</p>}
              <p className="mt-0.5 text-stone-600">{review.body}</p>
            </td>
            <td className="px-3 py-2">
              <p>{review.authorName}</p>
              {review.isVerifiedPurchase && <Badge tone="success">Compra verificada</Badge>}
              <p className="mt-1 text-xs text-stone-400">{formatDate(review.createdAt)}</p>
            </td>
            <td className="px-3 py-2">
              <Badge tone={statusToneOf(review.status)}>{STATUS_LABELS[review.status]}</Badge>
            </td>
            <td className="px-3 py-2">
              <div className="flex gap-1">
                {review.status !== "APPROVED" && (
                  <Button variant="ghost" title="Aprobar" onClick={() => void moderate(review.id, "APPROVED")}>
                    <IconCheck size={15} className="text-emerald-600" />
                  </Button>
                )}
                {review.status !== "REJECTED" && (
                  <Button variant="ghost" title="Rechazar" onClick={() => void moderate(review.id, "REJECTED")}>
                    <IconX size={15} className="text-red-500" />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function QuestionsTab({ statusFilter }: { statusFilter: string }): React.ReactNode {
  const query = statusFilter ? `?status=${statusFilter}` : "";
  const { data, loading, reload } = useAdminGet<Paginated<QuestionRow>>(`/admin/moderation/questions${query}`);
  const request = useAdminRequest();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function respond(id: string, status: "APPROVED" | "REJECTED"): Promise<void> {
    await request(`/admin/moderation/questions/${id}`, "PUT", { status, answer: answers[id] || undefined });
    await reload();
  }

  if (loading) return <Loader />;
  if (!data || data.data.length === 0) return <Card><EmptyState message="No hay preguntas en este estado" /></Card>;

  return (
    <div className="space-y-3">
      {data.data.map((question) => (
        <Card key={question.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-navy-900">{question.product.name}</p>
              <p className="mt-1 text-stone-700">{question.question}</p>
              <p className="mt-1 text-xs text-stone-400">
                {question.authorName} · {question.email} · {formatDate(question.createdAt)}
              </p>
            </div>
            <Badge tone={statusToneOf(question.status)}>{STATUS_LABELS[question.status]}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              placeholder="Escribe la respuesta pública…"
              value={answers[question.id] ?? question.answer ?? ""}
              onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
              className={`${inputClass} max-w-xl`}
            />
            <Button onClick={() => void respond(question.id, "APPROVED")}>Responder y publicar</Button>
            {question.status !== "REJECTED" && (
              <Button variant="secondary" onClick={() => void respond(question.id, "REJECTED")}>
                Rechazar
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
