"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconArrowRight, IconCheckCircle, IconPause, IconPencil, IconPlay, IconTrash } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { useSaving } from "../../../../lib/admin/use-saving";
import { slugify } from "../../../../components/admin/slugify";
import { useAdminDialog } from "../../../../lib/admin/dialog-context";
import { ImageUrlField } from "../../../../components/admin/image-upload";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
  isActive: boolean;
  bannerUrl: string | null;
  description: string | null;
  _count: { products: number };
}

const EMPTY_FORM = { name: "", slug: "", parentId: "", bannerUrl: "", position: "0", description: "" };

export default function CategoriesAdminPage(): React.ReactNode {
  const { data: categories, reload } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");
  const { data: brands } = useAdminGet<{ id: string }[]>("/admin/catalog/brands");
  const request = useAdminRequest();
  const { pending, run } = useSaving();
  const { confirm } = useAdminDialog();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      parentId: form.parentId || undefined,
      bannerUrl: form.bannerUrl || undefined,
      description: form.description || undefined,
      position: Number(form.position || 0)
    };
    try {
      if (editingId) await request(`/admin/catalog/categories/${editingId}`, "PUT", payload);
      if (!editingId) await request("/admin/catalog/categories", "POST", payload);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  function remove(id: string, name: string): void {
    confirm({
      title: `¿Eliminar la categoría «${name}»?`,
      description: "Los productos asociados quedarán sin categoría. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar categoría",
      tone: "danger",
      successMessage: "La categoría se eliminó correctamente.",
      action: async () => {
        await request(`/admin/catalog/categories/${id}`, "DELETE");
        await reload();
      }
    });
  }

  async function toggleActive(category: CategoryRow): Promise<void> {
    await request(`/admin/catalog/categories/${category.id}`, "PUT", { isActive: !category.isActive });
    await reload();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Categorías</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Categorías">
          {!categories || categories.length === 0 ? (
            <EmptyState message="Sin categorías" />
          ) : (
            <Table headers={["Nombre", "Slug", "Productos", "Estado", "Acciones"]}>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-stone-50">
                  <td className="px-3 py-2 font-medium text-navy-900">
                    {category.parentId && <span className="text-stone-300">└ </span>}
                    {category.name}
                  </td>
                  <td className="px-3 py-2 text-stone-500">{category.slug}</td>
                  <td className="px-3 py-2">{category._count.products}</td>
                  <td className="px-3 py-2">
                    {category.isActive ? (
                      <IconCheckCircle size={16} className="text-emerald-500" />
                    ) : (
                      <IconPause size={16} className="text-stone-400" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(category.id);
                          setForm({
                            name: category.name,
                            slug: category.slug,
                            parentId: category.parentId ?? "",
                            bannerUrl: category.bannerUrl ?? "",
                            position: String(category.position),
                            description: category.description ?? ""
                          });
                        }}
                      >
                        <IconPencil size={15} />
                      </Button>
                      <Button variant="ghost" onClick={() => void toggleActive(category)}>
                        {category.isActive ? <IconPause size={15} /> : <IconPlay size={15} />}
                      </Button>
                      <Button variant="ghost" onClick={() => remove(category.id, category.name)}>
                        <IconTrash size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title={editingId ? "Editar categoría" : "Nueva categoría"}>
            <form onSubmit={(event) => { event.preventDefault(); void run("form", () => submit(event)); }} className="space-y-3">
              <Field label="Nombre *">
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.slug || slugify(event.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Slug">
                <input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} className={inputClass} />
              </Field>
              <Field label="Categoría padre">
                <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} className={inputClass}>
                  <option value="">Ninguna (raíz)</option>
                  {(categories ?? [])
                    .filter((category) => !category.parentId && category.id !== editingId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </Field>
              <ImageUrlField
                label="Imagen de la categoría"
                value={form.bannerUrl}
                onChange={(url) => setForm({ ...form, bannerUrl: url })}
                hint="Se usa como fondo de la tarjeta en la portada. PNG sin fondo, cuadrada, 800×800 px."
              />
              <Field label="Descripción (texto SEO de la página de categoría)">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="200–400 palabras sobre la categoría: qué incluye, para qué sirve, marcas…"
                  className={inputClass}
                />
              </Field>
              <Field label="Orden">
                <input type="number" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className={inputClass} />
              </Field>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              <div className="flex gap-2">
                <Button type="submit" loading={pending === "form"}>{editingId ? "Guardar" : "Crear"}</Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Marcas">
            <p className="text-sm text-stone-500">
              {brands ? `${brands.length} marca(s) registradas. ` : ""}El logo, el lema, el banner, la descripción y el contenido visual de cada marca se
              editan en su propia sección.
            </p>
            <Link
              href="/admin/marcas"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              Administrar marcas
              <IconArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
