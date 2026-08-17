import Link from "next/link";

export function StoreFooter({ storeName }: { storeName: string }): React.ReactNode {
  return (
    <footer className="mt-16 bg-navy-900 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-3 text-lg font-bold text-white">✨ {storeName}</p>
          <p className="text-sm leading-relaxed">
            Productos de aseo profesional para tu hogar y tu empresa, con entrega a domicilio y pago 100% en línea.
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Tienda</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tienda" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/tienda?onPromo=true" className="hover:text-white">Promociones</Link></li>
            <li><Link href="/carrito" className="hover:text-white">Mi carrito</Link></li>
            <li><Link href="/cuenta" className="hover:text-white">Mi cuenta</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Servicios</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/servicios" className="hover:text-white">Aseo por horas</Link></li>
            <li><Link href="/servicios" className="hover:text-white">Planes mensuales</Link></li>
            <li>
              <a href="https://limpiarteenhoras.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                limpiarteenhoras.com ↗
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Legal</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/paginas/quienes-somos" className="hover:text-white">Quiénes somos</Link></li>
            <li><Link href="/paginas/terminos-y-condiciones" className="hover:text-white">Términos y condiciones</Link></li>
            <li><Link href="/paginas/politica-de-privacidad" className="hover:text-white">Política de privacidad</Link></li>
            <li><Link href="/paginas/politica-pqrs" className="hover:text-white">Política de PQRS</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} {storeName} · Todos los derechos reservados
      </div>
    </footer>
  );
}
