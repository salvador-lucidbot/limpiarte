import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Limpiarte — Tienda de productos de aseo",
    template: "%s | Limpiarte"
  },
  description: "Compra en línea productos de aseo profesional para tu hogar y tu empresa. Envíos en Colombia."
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
