"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, inputClass, Table } from "../../../../components/admin/ui";
import { IconPause, IconPencil, IconPlay, IconPlus, IconSearch, IconTrash } from "../../../../components/icons";
import { Loader } from "../../../../components/loader";
import { useAdminDialog } from "../../../../lib/admin/dialog-context";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { useSaving } from "../../../../lib/admin/use-saving";
import type { AdminBrand } from "../../../../lib/api/types";

function normalized(text: string): string {
  return text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function BrandLogo({ brand }: { brand: AdminBrand }): React.ReactNode {
  if (brand.logoUrl) {
    return <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-lg border border-stone-200 bg-white object-contain p-0.5" />;
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700" aria-hidden>
      {brand.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function BrandsAdminPage(): React.ReactNode {
  const { data: brands, loading, error, reload } = useAdminGet<AdminBrand[]>("/admin/catalog/brands");
  const request = useAdminRequest();
  const { pending, run } = useSaving();
  const { confirm, notify } = useAdminDialog();
  const [search, setSearch] = useState("");

  const query = normalized(search.trim());
  const visibleBrands = (brands ?? []).filter((brand) => query === "" || normalized(`${brand.name} ${brand.slug} ${brand.tagline ?? ""}`).includes(query));

  async function toggleActive(brand: AdminBrand): Promise<void> {
    try {
      await request(`/admin/catalog/brands/${brand.id}`, "PUT", { isActive: !brand.isActive });
      await reload();
    } catch (toggleError) {
      notify({
        title: `No se pudo actualizar «${brand.name}»`,
        description: toggleError instanceof Error ? toggleError.message : "Inténtalo de nuevo.",
        tone: "error"
      });
    }
  }

  function remove(brand: AdminBrand): void {
    if (brand._count.products > 0) {
      notify({
        title: `No se puede eliminar «${brand.name}»`,
        description: `Tiene ${brand._count.products} producto(s) asignados. Cámbiales la marca o desactívala para ocultarla de la tienda.`,
        tone: "info"
      });
      return;
    }
    confirm({
      title: `¿Eliminar la marca «${brand.name}»?`,
      description: "Se borran también sus bloques de contenido. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar marca",
      tone: "danger",
      successMessage: "La marca se eliminó correctamente.",
      action: async () => {
        await request(`/admin/catalog/brands/${brand.id}`, "DELETE");
        await reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Marcas</h1>
          <p className="text-sm text-stone-500">Logo, lema, banner, descripción y contenido visual que acompaña a los productos de cada marca.</p>
        </div>
        <Link
          href="/admin/marcas/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <IconPlus size={15} />
          Nueva marca
        </Link>
      </div>

      <Card>
        <label className="relative mb-4 block max-w-sm">
          <span className="sr-only">Buscar marcas</span>
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o lema" className={`${inputClass} pl-9`} />
        </label>

        {loading && !brands && <Loader />}
        {error && !brands && <p className="text-sm text-red-600">No se pudieron cargar las marcas: {error}</p>}
        {brands && visibleBrands.length === 0 && (
          <EmptyState message={brands.length === 0 ? "Aún no hay marcas. Crea la primera con «Nueva marca»." : "Ninguna marca coincide con la búsqueda."} />
        )}
        {visibleBrands.length > 0 && (
          <Table headers={["Marca", "Lema", "Productos", "Orden", "Estado", "Acciones"]}>
            {visibleBrands.map((brand) => (
              <tr key={brand.id} className="border-b border-stone-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/marcas/${brand.id}`} className="flex items-center gap-3 hover:text-brand-700">
                    <BrandLogo brand={brand} />
                    <span>
                      <span className="block font-medium text-navy-900">{brand.name}</span>
                      <span className="block text-xs text-stone-400">{brand.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-stone-500">{brand.tagline ?? "—"}</td>
                <td className="px-3 py-2">{brand._count.products}</td>
                <td className="px-3 py-2">{brand.position}</td>
                <td className="px-3 py-2">
                  <Badge tone={brand.isActive ? "success" : "neutral"}>{brand.isActive ? "Activa" : "Inactiva"}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/marcas/${brand.id}`}
                      aria-label={`Editar ${brand.name}`}
                      title="Editar"
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-stone-500 transition hover:bg-stone-100"
                    >
                      <IconPencil size={15} />
                    </Link>
                    <Button
                      variant="ghost"
                      loading={pending === `toggle-${brand.id}`}
                      onClick={() => void run(`toggle-${brand.id}`, () => toggleActive(brand))}
                      aria-label={brand.isActive ? `Desactivar ${brand.name}` : `Activar ${brand.name}`}
                      title={brand.isActive ? "Desactivar" : "Activar"}
                    >
                      {brand.isActive ? <IconPause size={15} /> : <IconPlay size={15} />}
                    </Button>
                    <Button variant="ghost" onClick={() => remove(brand)} aria-label={`Eliminar ${brand.name}`} title="Eliminar">
                      <IconTrash size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
