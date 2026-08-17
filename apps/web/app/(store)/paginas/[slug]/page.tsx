import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import { StaticPageView } from "../../../../lib/api/types";
import { demoStaticPage } from "../../../../lib/demo/demo-catalog";
import { isDemoMode } from "../../../../lib/demo/demo-mode";

type Params = Promise<{ slug: string }>;

async function loadPage(slug: string): Promise<StaticPageView | null> {
  try {
    return await apiFetch<StaticPageView>(`/content/pages/${slug}`, { revalidate: 300 });
  } catch (error) {
    if (isDemoMode()) return demoStaticPage(slug);
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Página no encontrada" };
  return { title: page.seoTitle ?? page.title, description: page.seoDescription ?? undefined };
}

export default async function StaticPageRoute({ params }: { params: Params }): Promise<React.ReactNode> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-navy-900">{page.title}</h1>
      <div
        className="prose prose-stone max-w-none leading-relaxed [&_a]:text-brand-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
