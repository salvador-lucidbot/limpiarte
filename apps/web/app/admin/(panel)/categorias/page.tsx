"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { slugify } from "../../../../components/admin/product-form";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
  isActive: boolean;
  bannerUrl: string | null;
  _count: { products: number };
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
}

const EMPTY_FORM = { name: "", slug: "", parentId: "", bannerUrl: "", position: "0" };

export default function CategoriesAdminPage(): React.ReactNode {
  const { data: categories, reload } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");
  const { data: brands, reload: reloadBrands } = useAdminGet<BrandRow[]>("/admin/catalog/brands");
  const request = useAdminRequest();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      parentId: form.parentId || undefined,
      bannerUrl: form.bannerUrl || undefined,
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

  async function remove(id: string): Promise<void> {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    try {
      await request(`/admin/catalog/categories/${id}`, "DELETE");
      await reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar");
    }
  }

  async function toggleActive(category: CategoryRow): Promise<void> {
    await request(`/admin/catalog/categories/${category.id}`, "PUT", { isActive: !category.isActive });
    await reload();
  }

  async function addBrand(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!brandName.trim()) return;
    await request("/admin/catalog/brands", "POST", { name: brandName.trim(), slug: slugify(brandName) });
    setBrandName("");
    await reloadBrands();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Categorías y marcas</h1>

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
                  <td className="px-3 py-2">{category.isActive ? "✅" : "⏸"}</td>
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
                            position: String(category.position)
                          });
                        }}
                      >
                        ✏️
                      </Button>
                      <Button variant="ghost" onClick={() => void toggleActive(category)}>
                        {category.isActive ? "⏸" : "▶"}
                      </Button>
                      <Button variant="ghost" onClick={() => void remove(category.id)}>
                        🗑
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
            <form onSubmit={(event) => void submit(event)} className="space-y-3">
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
              <Field label="Banner (URL)">
                <input value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Orden">
                <input type="number" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className={inputClass} />
              </Field>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Guardar" : "Crear"}</Button>
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
            <ul className="mb-3 space-y-1 text-sm">
              {(brands ?? []).map((brand) => (
                <li key={brand.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-stone-50">
                  {brand.name}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void request(`/admin/catalog/brands/${brand.id}`, "DELETE")
                        .then(reloadBrands)
                        .catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Error"));
                    }}
                  >
                    🗑
                  </Button>
                </li>
              ))}
            </ul>
            <form onSubmit={(event) => void addBrand(event)} className="flex gap-2">
              <input placeholder="Nueva marca" value={brandName} onChange={(event) => setBrandName(event.target.value)} className={inputClass} />
              <Button type="submit" variant="secondary">
                +
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
