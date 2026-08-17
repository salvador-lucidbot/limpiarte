import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "../../../lib/api/client";
import { BlogPostView, Paginated } from "../../../lib/api/types";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage(): Promise<React.ReactNode> {
  let posts: Paginated<BlogPostView> = { data: [], meta: { page: 1, perPage: 20, total: 0, totalPages: 1 } };
  try {
    posts = await apiFetch<Paginated<BlogPostView>>("/content/blog", { revalidate: 300 });
  } catch {
    void 0;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900">Blog de limpieza</h1>
      <p className="mt-2 text-stone-600">Consejos, guías y novedades sobre el cuidado de tus espacios.</p>

      {posts.data.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-stone-300 p-16 text-center text-stone-500">
          Pronto publicaremos contenido. ¡Vuelve pronto!
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.data.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-md"
            >
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt={post.title} className="h-44 w-full object-cover transition group-hover:scale-105" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-brand-50 text-4xl">🧽</div>
              )}
              <div className="p-5">
                <h2 className="font-bold text-navy-900 group-hover:text-brand-700">{post.title}</h2>
                {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-stone-600">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
