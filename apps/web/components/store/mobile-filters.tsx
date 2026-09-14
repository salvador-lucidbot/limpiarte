"use client";

import { useEffect, useState } from "react";
import { CatalogFacets } from "../../lib/api/types";
import { IconFilter, IconX } from "../icons";
import { CatalogFilters } from "./catalog-filters";

interface MobileFiltersProps {
  facets: CatalogFacets;
  listingTitle: string;
  total: number;
}

export function MobileFilters({ facets, listingTitle, total }: MobileFiltersProps): React.ReactNode {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          <IconFilter size={16} />
          Filtrar
        </button>
        <p className="text-sm text-slate-400">{total} resultado{total === 1 ? "" : "s"}</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button type="button" aria-label="Cerrar filtros" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy-900/40" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <p className="font-bold text-navy-900">Filtrar resultados</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <IconX size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <CatalogFilters facets={facets} listingTitle={listingTitle} total={total} />
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
              >
                Ver {total} resultado{total === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
