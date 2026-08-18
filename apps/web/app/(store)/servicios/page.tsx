import type { Metadata } from "next";
import { IconBuilding, IconCalendar, IconExternalLink, IconHomeHeart } from "../../../components/icons";

export const metadata: Metadata = {
  title: "Servicios de aseo por horas",
  description: "Conoce los servicios de aseo por horas y planes mensuales de Limpiarte. Agenda en limpiarteenhoras.com."
};

const SERVICES = [
  {
    icon: IconHomeHeart,
    title: "Aseo por horas para hogares",
    text: "Profesionales de confianza para el aseo general o profundo de tu casa o apartamento, por el tiempo que necesites."
  },
  {
    icon: IconBuilding,
    title: "Aseo para empresas y oficinas",
    text: "Rutinas de limpieza para oficinas, locales y espacios comerciales con personal capacitado y suministros incluidos."
  },
  {
    icon: IconCalendar,
    title: "Planes mensuales",
    text: "Frecuencias semanales o quincenales con tarifas preferenciales y la misma profesional asignada a tu servicio."
  }
];

export default function ServicesPage(): React.ReactNode {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <section className="rounded-3xl bg-gradient-to-br from-navy-900 to-brand-800 px-8 py-16 text-center text-white">
        <h1 className="text-4xl font-bold">Servicios de aseo por horas</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          En esta tienda encuentras nuestros productos. Los servicios de aseo por horas y los planes mensuales se agendan en nuestro
          portal especializado.
        </p>
        <a
          href="https://limpiarteenhoras.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-bold text-brand-700 transition hover:bg-brand-50"
        >
          Agendar en limpiarteenhoras.com
          <IconExternalLink size={19} />
        </a>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {SERVICES.map((service) => (
          <div key={service.title} className="rounded-2xl border border-stone-200 bg-white p-8">
            <span className="flex h-13 w-13 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <service.icon size={26} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy-900">{service.title}</h2>
            <p className="mt-2 leading-relaxed text-stone-600">{service.text}</p>
            <a
              href="https://limpiarteenhoras.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-semibold text-brand-600 hover:text-brand-700"
            >
              Cotizar este servicio →
            </a>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl bg-brand-50 p-8 text-center">
        <p className="text-stone-700">
          ¿Buscas los productos que usamos en nuestros servicios?{" "}
          <a href="/tienda" className="font-semibold text-brand-700 underline">
            Cómpralos aquí en la tienda en línea
          </a>
          .
        </p>
      </section>
    </div>
  );
}
