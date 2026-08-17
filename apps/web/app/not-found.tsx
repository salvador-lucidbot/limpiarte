import Link from "next/link";

export default function NotFound(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-6xl">🧹</span>
      <h1 className="text-3xl font-bold text-navy-900">Página no encontrada</h1>
      <p className="max-w-md text-stone-600">
        Parece que esta página fue barrida. Vuelve a la tienda y sigue explorando nuestros productos de aseo.
      </p>
      <Link href="/" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
        Volver al inicio
      </Link>
    </main>
  );
}
