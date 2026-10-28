"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { Loader } from "../../../components/loader";
import { Logo } from "../../../components/logo";
import { AdminBreadcrumbs, AdminTopbar } from "../../../components/admin/shell/admin-topbar";
import { SectionPanel } from "../../../components/admin/shell/section-panel";
import { SectionRail } from "../../../components/admin/shell/section-rail";
import { AdminDialogProvider } from "../../../lib/admin/dialog-context";
import { findOptionByPath, findSectionByPath, visibleSections } from "../../../lib/admin/navigation";
import { useAdminAuth } from "../../../lib/auth/admin-auth-context";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const { user, ready, hasPermission, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = useMemo(() => visibleSections(hasPermission), [hasPermission]);
  const currentSection = useMemo(() => findSectionByPath(sections, pathname), [sections, pathname]);
  const currentOption = useMemo(() => findOptionByPath(sections, pathname), [sections, pathname]);

  useEffect(() => {
    if (ready && !user) router.push("/admin/login");
  }, [ready, router, user]);

  useEffect(() => {
    if (currentSection) setSelectedKey(currentSection.key);
  }, [currentSection]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!ready || !user) return <Loader fullScreen className="min-h-dvh" size="lg" />;

  const activeKey = selectedKey ?? currentSection?.key ?? sections[0]?.key ?? "";
  const activeSection = sections.find((section) => section.key === activeKey) ?? sections[0] ?? null;

  function selectSection(key: string): void {
    setSelectedKey(key);
    const section = sections.find((item) => item.key === key);
    if (!section) return;
    if (section.options.length === 1) router.push(section.options[0].href);
  }

  return (
    <AdminDialogProvider>
      <div className="flex min-h-dvh bg-surface-subtle">
        <aside className="hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:h-dvh">
          <div className="flex w-22 flex-col bg-brand-800 py-5 text-white">
            <div className="mb-5 flex justify-center px-2">
              <Logo variant="white" height={22} />
            </div>
            <SectionRail sections={sections} selectedKey={activeKey} currentKey={currentSection?.key ?? null} onSelect={selectSection} />
          </div>
          <SectionPanel section={activeSection} pathname={pathname} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar user={user} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onLogout={logout} />

          {menuOpen && (
            <div className="border-b border-ink-200 bg-white lg:hidden">
              {sections.map((section) => (
                <details key={section.key} open={section.key === currentSection?.key} className="border-b border-ink-100 last:border-0">
                  <summary className="flex cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-bold text-brand-900">
                    <section.icon size={17} aria-hidden="true" className="shrink-0 text-brand-700" />
                    {section.label}
                  </summary>
                  <div className="pb-2">
                    <SectionPanel section={section} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
                  </div>
                </details>
              ))}
            </div>
          )}

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 has-[[data-page-width=full]]:max-w-none sm:px-6 lg:px-8">
            <AdminBreadcrumbs section={currentSection} option={currentOption} />
            {children}
          </main>
        </div>
      </div>

      <Toaster position="top-right" richColors closeButton duration={5000} />
    </AdminDialogProvider>
  );
}
