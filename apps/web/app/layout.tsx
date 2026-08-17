import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Limpiarte — Tienda de productos de aseo",
    template: "%s | Limpiarte"
  },
  description: "Compra en línea productos de aseo profesional para tu hogar y tu empresa. Envíos en Colombia."
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
