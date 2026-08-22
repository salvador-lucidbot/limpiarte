import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import { BlogPostView } from "../../../../lib/api/types";

type Params = Promise<{ slug: string }>;

async function loadPost(slug: string): Promise<BlogPostView | null> {
  try {
    return await apiFetch<BlogPostView>(`/content/blog/${slug}`, { revalidate: 300 });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Entrada no encontrada" };
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: { params: Params }): Promise<React.ReactNode> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="mb-8 w-full rounded-2xl object-cover" />}
      <h1 className="text-3xl font-bold text-navy-900">{post.title}</h1>
      {post.publishedAt && (
        <p className="mt-2 text-sm text-stone-400">
          {new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(post.publishedAt))}
        </p>
      )}
      <div
        className="mt-8 leading-relaxed text-stone-700 [&_a]:text-brand-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
