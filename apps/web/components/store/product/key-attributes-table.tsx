"use client";

import { useId, useState } from "react";
import type { InformationRow } from "./product-information-data";
import { formatWeight } from "./product-format";
import { useProductSelection } from "./product-selection-context";
import { ShowMoreToggle } from "./show-more-toggle";

const COLLAPSED_ROWS = 6;

interface KeyAttributesTableProps {
  leadingRows: InformationRow[];
  trailingRows: InformationRow[];
}

function uniqueRows(rows: InformationRow[]): InformationRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.label.trim().toLocaleLowerCase("es-CO");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function KeyAttributesTable({ leadingRows, trailingRows }: KeyAttributesTableProps): React.ReactNode {
  const { product, selected, weightKg } = useProductSelection();
  const [expanded, setExpanded] = useState(false);
  const tableId = useId();
  const headingId = useId();

  const optionRows = product.options.flatMap((option) => {
    const value = option.values.find((candidate) => candidate.id === selected[option.id]);
    return value ? [{ label: option.name, value: value.value }] : [];
  });
  const weightRows = weightKg !== null && weightKg > 0 ? [{ label: "Peso del artículo", value: formatWeight(weightKg) }] : [];
  const rows = uniqueRows([...leadingRows, ...optionRows, ...weightRows, ...trailingRows]);
  if (rows.length === 0) return null;

  const collapsible = rows.length > COLLAPSED_ROWS + 1;
  const collapsed = collapsible && !expanded;

  return (
    <section aria-labelledby={headingId} className="border-t border-line pt-4">
      <h2 id={headingId} className="sr-only">
        Características principales
      </h2>
      <div className="relative">
        <table id={tableId} className="w-full text-sm wrap-anywhere">
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} hidden={collapsed && index >= COLLAPSED_ROWS}>
                <th scope="row" className="w-[42%] py-1.5 pr-4 text-left align-top font-bold text-ink">
                  {row.label}
                </th>
                <td className="whitespace-pre-line py-1.5 align-top text-slate-700">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {collapsed && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white to-transparent" />}
      </div>
      {collapsible && <ShowMoreToggle expanded={expanded} controls={tableId} onToggle={() => setExpanded((current) => !current)} />}
    </section>
  );
}
