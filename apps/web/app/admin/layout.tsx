import type { Metadata } from "next";
import { AdminAuthProvider } from "../../lib/auth/admin-auth-context";

export const metadata: Metadata = {
  title: { default: "Superadmin | Limpiarte", template: "%s | Superadmin Limpiarte" },
  robots: { index: false, follow: false }
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
