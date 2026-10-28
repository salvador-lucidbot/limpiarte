import { ProductAccordion } from "./product-accordion";
import type { AccordionItem } from "./product-accordion";
import type { InformationColumns, InformationGroup } from "./product-information-data";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

interface ProductInformationProps {
  columns: InformationColumns;
}

function GroupContent({ group }: { group: InformationGroup }): React.ReactNode {
  return (
    <div className="space-y-3 wrap-break-word">
      {group.note && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{group.note}</p>}
      {group.rows.length > 0 && (
        <table className="w-full table-fixed overflow-hidden rounded-lg text-sm">
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <th scope="row" className="w-[42%] bg-soft px-3 py-2.5 text-left align-top font-semibold text-slate-700">
                  {row.label}
                </th>
                <td className="whitespace-pre-line px-3 py-2.5 align-top text-ink">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function toItems(groups: InformationGroup[]): AccordionItem[] {
  return groups.map((group) => ({
    id: `informacion-${group.id.toLowerCase()}`,
    title: group.title,
    content: <GroupContent group={group} />
  }));
}

export function ProductInformation({ columns }: ProductInformationProps): React.ReactNode {
  if (columns.left.length === 0 && columns.right.length === 0) return null;

  return (
    <section id="informacion-del-producto" aria-labelledby="informacion-del-producto-titulo" className={PRODUCT_SECTION_CLASS}>
      <h2 id="informacion-del-producto-titulo" className={PRODUCT_SECTION_TITLE_CLASS}>
        Información del producto
      </h2>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        {columns.left.length > 0 && <ProductAccordion items={toItems(columns.left)} />}
        {columns.right.length > 0 && <ProductAccordion items={toItems(columns.right)} />}
      </div>
    </section>
  );
}
