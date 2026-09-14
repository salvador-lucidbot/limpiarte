"use client";

import { useState } from "react";
import { ImageUrlField } from "../../../../components/admin/image-upload";
import { slugify } from "../../../../components/admin/product-form";
import { Badge, Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconFileText, IconImage, IconMail, IconMenu, IconPause, IconPencil, IconPlay, IconTrash } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";

type Tab = "banners" | "paginas" | "blog" | "menu" | "suscriptores";

interface SubscriberRow {
  id: string;
  email: string;
  source: string | null;
  createdAt: string;
}

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  buttonText: string | null;
  section: string;
  position: number;
  isActive: boolean;
}

interface PageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  status: string;
}

interface MenuRow {
  id: string;
  location: "HEADER" | "FOOTER";
  label: string;
  url: string;
  position: number;
  isActive: boolean;
}

export default function ContentAdminPage(): React.ReactNode {
  const [tab, setTab] = useState<Tab>("banners");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Contenido del sitio</h1>

      <div className="flex gap-2 border-b border-stone-200">
        {(
          [
            ["banners", "Banners", IconImage],
            ["paginas", "Páginas", IconFileText],
            ["blog", "Blog", IconPencil],
            ["menu", "Menú", IconMenu],
            ["suscriptores", "Suscriptores", IconMail]
          ] as [Tab, string, (props: { size?: number }) => React.ReactNode][]
        ).map(([key, label, TabIcon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${tab === key ? "border-b-2 border-brand-500 text-brand-700" : "text-stone-500 hover:text-stone-700"}`}
          >
            <TabIcon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "banners" && <BannersTab />}
      {tab === "paginas" && <PagesTab />}
      {tab === "blog" && <BlogTab />}
      {tab === "menu" && <MenuTab />}
      {tab === "suscriptores" && <SubscribersTab />}
    </div>
  );
}

function SubscribersTab(): React.ReactNode {
  const { data } = useAdminGet<{ total: number; subscribers: SubscriberRow[] }>("/admin/marketing/newsletter");

  return (
    <Card title={`Suscriptores del boletín${data ? ` (${data.total})` : ""}`}>
      {!data || data.subscribers.length === 0 ? (
        <EmptyState message="Aún no hay suscriptores. El popup de bienvenida los captura automáticamente." />
      ) : (
        <Table headers={["Correo", "Origen", "Fecha"]}>
          {data.subscribers.map((subscriber) => (
            <tr key={subscriber.id} className="border-b border-stone-50">
              <td className="px-3 py-2 font-medium text-navy-900">{subscriber.email}</td>
              <td className="px-3 py-2 text-stone-500">{subscriber.source ?? "—"}</td>
              <td className="px-3 py-2 text-stone-500">{new Date(subscriber.createdAt).toLocaleDateString("es-CO")}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function BannersTab(): React.ReactNode {
  const { data, reload } = useAdminGet<BannerRow[]>("/admin/marketing/banners");
  const request = useAdminRequest();
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "", buttonText: "", section: "HOME_HERO", position: "0" });

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await request("/admin/marketing/banners", "POST", {
      title: form.title,
      subtitle: form.subtitle || undefined,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || undefined,
      buttonText: form.buttonText || undefined,
      section: form.section,
      position: Number(form.position)
    });
    setForm({ title: "", subtitle: "", imageUrl: "", linkUrl: "", buttonText: "", section: "HOME_HERO", position: "0" });
    await reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card title="Banners">
        {!data || data.length === 0 ? (
          <EmptyState message="Sin banners" />
        ) : (
          <Table headers={["Imagen", "Título", "Sección", "Estado", "Acciones"]}>
            {data.map((banner) => (
              <tr key={banner.id} className="border-b border-stone-50">
                <td className="px-3 py-2">
                  <img src={banner.imageUrl} alt="" className="h-10 w-20 rounded-lg object-cover" />
                </td>
                <td className="px-3 py-2 font-medium">{banner.title}</td>
                <td className="px-3 py-2 text-stone-500">{banner.section}</td>
                <td className="px-3 py-2">{banner.isActive ? <Badge tone="success">Activo</Badge> : <Badge tone="danger">Inactivo</Badge>}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void request(`/admin/marketing/banners/${banner.id}`, "PUT", { ...banner, isActive: !banner.isActive }).then(reload);
                      }}
                    >
                      {banner.isActive ? <IconPause size={15} /> : <IconPlay size={15} />}
                    </Button>
                    <Button variant="ghost" onClick={() => void request(`/admin/marketing/banners/${banner.id}`, "DELETE").then(reload)}><IconTrash size={15} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Nuevo banner">
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label="Título *">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Subtítulo">
            <input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className={inputClass} />
          </Field>
          <ImageUrlField
            label="Imagen"
            required
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            hint="Hero: 2400×1000 px. Promoción: 1600×640 px. JPG, PNG, WebP o AVIF hasta 5 MB."
          />
          <Field label="Enlace">
            <input value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Texto del botón">
            <input value={form.buttonText} onChange={(event) => setForm({ ...form, buttonText: event.target.value })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sección">
              <select value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} className={inputClass}>
                <option value="HOME_HERO">Portada principal</option>
                <option value="HOME_PROMO">Promocional</option>
                <option value="CATEGORY">Categoría</option>
              </select>
            </Field>
            <Field label="Orden">
              <input type="number" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className={inputClass} />
            </Field>
          </div>
          <Button type="submit">Crear banner</Button>
        </form>
      </Card>
    </div>
  );
}

function PagesTab(): React.ReactNode {
  const { data, reload } = useAdminGet<PageRow[]>("/admin/marketing/pages");
  const request = useAdminRequest();
  const [form, setForm] = useState({ slug: "", title: "", content: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const payload = { slug: form.slug || slugify(form.title), title: form.title, content: form.content };
    if (editingId) await request(`/admin/marketing/pages/${editingId}`, "PUT", payload);
    if (!editingId) await request("/admin/marketing/pages", "POST", payload);
    setForm({ slug: "", title: "", content: "" });
    setEditingId(null);
    await reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Páginas institucionales y legales">
        {!data || data.length === 0 ? (
          <EmptyState message="Sin páginas. Crea: quienes-somos, terminos-y-condiciones, politica-de-privacidad, politica-pqrs" />
        ) : (
          <ul className="space-y-2 text-sm">
            {data.map((page) => (
              <li key={page.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-stone-50">
                <div>
                  <p className="font-medium text-navy-900">{page.title}</p>
                  <p className="text-xs text-stone-400">/paginas/{page.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(page.id);
                      setForm({ slug: page.slug, title: page.title, content: page.content });
                    }}
                  ><IconPencil size={15} /></Button>
                  <Button variant="ghost" onClick={() => void request(`/admin/marketing/pages/${page.id}`, "DELETE").then(reload)}><IconTrash size={15} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={editingId ? "Editar página" : "Nueva página"}>
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label="Título *">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} className={inputClass} />
          </Field>
          <Field label="Contenido (HTML) *">
            <textarea required rows={10} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className={`${inputClass} font-mono text-xs`} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Guardar" : "Crear"}</Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ slug: "", title: "", content: "" });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function BlogTab(): React.ReactNode {
  const { data, reload } = useAdminGet<PostRow[]>("/admin/marketing/blog");
  const request = useAdminRequest();
  const [form, setForm] = useState({ slug: "", title: "", excerpt: "", content: "", coverImageUrl: "", status: "DRAFT" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const payload = {
      slug: form.slug || slugify(form.title),
      title: form.title,
      excerpt: form.excerpt || undefined,
      content: form.content,
      coverImageUrl: form.coverImageUrl || undefined,
      status: form.status
    };
    if (editingId) await request(`/admin/marketing/blog/${editingId}`, "PUT", payload);
    if (!editingId) await request("/admin/marketing/blog", "POST", payload);
    setForm({ slug: "", title: "", excerpt: "", content: "", coverImageUrl: "", status: "DRAFT" });
    setEditingId(null);
    await reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Entradas del blog">
        {!data || data.length === 0 ? (
          <EmptyState message="Sin entradas" />
        ) : (
          <ul className="space-y-2 text-sm">
            {data.map((post) => (
              <li key={post.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-stone-50">
                <div>
                  <p className="font-medium text-navy-900">{post.title}</p>
                  <p className="text-xs text-stone-400">{post.status === "PUBLISHED" ? "Publicada" : post.status === "SCHEDULED" ? "Programada" : "Borrador"}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(post.id);
                      setForm({
                        slug: post.slug,
                        title: post.title,
                        excerpt: post.excerpt ?? "",
                        content: post.content,
                        coverImageUrl: post.coverImageUrl ?? "",
                        status: post.status
                      });
                    }}
                  ><IconPencil size={15} /></Button>
                  <Button variant="ghost" onClick={() => void request(`/admin/marketing/blog/${post.id}`, "DELETE").then(reload)}><IconTrash size={15} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={editingId ? "Editar entrada" : "Nueva entrada"}>
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label="Título *">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Extracto">
            <input value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className={inputClass} />
          </Field>
          <ImageUrlField
            label="Imagen de portada"
            value={form.coverImageUrl}
            onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            hint="1200×675 px (16:9)."
          />
          <Field label="Contenido (HTML) *">
            <textarea required rows={8} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className={`${inputClass} font-mono text-xs`} />
          </Field>
          <Field label="Estado">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicar ahora</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Guardar" : "Crear"}</Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ slug: "", title: "", excerpt: "", content: "", coverImageUrl: "", status: "DRAFT" });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function MenuTab(): React.ReactNode {
  const { data, reload } = useAdminGet<MenuRow[]>("/admin/marketing/menu");
  const request = useAdminRequest();
  const [form, setForm] = useState({ location: "HEADER" as "HEADER" | "FOOTER", label: "", url: "", position: "0" });

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await request("/admin/marketing/menu", "POST", { ...form, position: Number(form.position) });
    setForm({ location: "HEADER", label: "", url: "", position: "0" });
    await reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card title="Ítems de menú">
        {!data || data.length === 0 ? (
          <EmptyState message="Sin ítems" />
        ) : (
          <Table headers={["Ubicación", "Etiqueta", "URL", "Orden", "Acciones"]}>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-stone-50">
                <td className="px-3 py-2">{item.location === "HEADER" ? "Cabecera" : "Pie de página"}</td>
                <td className="px-3 py-2 font-medium">{item.label}</td>
                <td className="px-3 py-2 text-stone-500">{item.url}</td>
                <td className="px-3 py-2">{item.position}</td>
                <td className="px-3 py-2">
                  <Button variant="ghost" onClick={() => void request(`/admin/marketing/menu/${item.id}`, "DELETE").then(reload)}><IconTrash size={15} /></Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Nuevo ítem">
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label="Ubicación">
            <select
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value as "HEADER" | "FOOTER" })}
              className={inputClass}
            >
              <option value="HEADER">Cabecera</option>
              <option value="FOOTER">Pie de página</option>
            </select>
          </Field>
          <Field label="Etiqueta *">
            <input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className={inputClass} />
          </Field>
          <Field label="URL *">
            <input required value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Orden">
            <input type="number" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className={inputClass} />
          </Field>
          <Button type="submit">Agregar</Button>
        </form>
      </Card>
    </div>
  );
}
