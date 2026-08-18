import Link from "next/link";
import { IconCreditCard, IconExternalLink, IconMail, IconMapPin, IconShieldCheck, IconTruck, IconWhatsApp } from "../icons";
import { Logo } from "../logo";

export function StoreFooter({ storeName }: { storeName: string }): React.ReactNode {
  return (
    <footer className="mt-16">
      <div className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-500">
              <IconTruck size={26} />
            </span>
            <div>
              <p className="font-semibold text-navy-900">Envío a domicilio</p>
              <p className="mt-0.5 text-sm text-slate-500">Cobertura por zonas y envío gratis desde el monto mínimo de tu ciudad.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-500">
              <IconCreditCard size={26} />
            </span>
            <div>
              <p className="font-semibold text-navy-900">Paga como prefieras</p>
              <p className="mt-0.5 text-sm text-slate-500">Tarjetas de crédito y débito con pasarela de pagos certificada.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-500">
              <IconShieldCheck size={26} />
            </span>
            <div>
              <p className="font-semibold text-navy-900">Compra protegida</p>
              <p className="mt-0.5 text-sm text-slate-500">Tus datos viajan cifrados y tus pedidos quedan respaldados.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-navy-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo variant="white" height={30} />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Productos de aseo profesional para tu hogar y tu empresa. La misma línea que usamos en nuestros servicios, ahora con
              entrega a domicilio.
            </p>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Tienda</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/tienda" className="transition hover:text-white">Catálogo completo</Link></li>
              <li><Link href="/tienda?onPromo=true" className="transition hover:text-white">Ofertas</Link></li>
              <li><Link href="/carrito" className="transition hover:text-white">Mi carrito</Link></li>
              <li><Link href="/cuenta" className="transition hover:text-white">Mi cuenta</Link></li>
              <li><Link href="/blog" className="transition hover:text-white">Blog</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Servicios de aseo</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/servicios" className="transition hover:text-white">Aseo por horas</Link></li>
              <li><Link href="/servicios" className="transition hover:text-white">Planes mensuales</Link></li>
              <li>
                <a
                  href="https://limpiarteenhoras.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  limpiarteenhoras.com
                  <IconExternalLink size={13} />
                </a>
              </li>
            </ul>
            <p className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-white">Legal</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/paginas/terminos-y-condiciones" className="transition hover:text-white">Términos y condiciones</Link></li>
              <li><Link href="/paginas/politica-de-privacidad" className="transition hover:text-white">Tratamiento de datos</Link></li>
              <li><Link href="/paginas/politica-pqrs" className="transition hover:text-white">Política de PQRS</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contacto</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <IconMapPin size={17} className="mt-0.5 shrink-0 text-brand-400" />
                Colombia
              </li>
              <li className="flex items-start gap-2.5">
                <IconWhatsApp size={17} className="mt-0.5 shrink-0 text-brand-400" />
                Escríbenos por WhatsApp
              </li>
              <li className="flex items-start gap-2.5">
                <IconMail size={17} className="mt-0.5 shrink-0 text-brand-400" />
                <Link href="/contacto" className="transition hover:text-white">
                  Formulario de contacto
                </Link>
              </li>
            </ul>
            <p className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wider text-white">Nosotros</p>
            <Link href="/paginas/quienes-somos" className="text-sm transition hover:text-white">
              Quiénes somos
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {storeName} SAS · Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}
