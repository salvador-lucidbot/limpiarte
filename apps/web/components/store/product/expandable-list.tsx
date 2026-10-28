"use client";

import { useId, useState } from "react";
import { ShowMoreToggle } from "./show-more-toggle";

interface ExpandableListProps {
  items: React.ReactNode[];
  collapsedCount: number;
  listClassName?: string;
  itemClassName?: string;
}

export function ExpandableList({ items, collapsedCount, listClassName = "", itemClassName = "" }: ExpandableListProps): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const collapsible = items.length > collapsedCount + 1;
  const collapsed = collapsible && !expanded;

  return (
    <div>
      <div className="relative">
        <ul id={listId} className={listClassName}>
          {items.map((item, index) => (
            <li key={index} hidden={collapsed && index >= collapsedCount} className={itemClassName}>
              {item}
            </li>
          ))}
        </ul>
        {collapsed && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white to-transparent" />}
      </div>
      {collapsible && <ShowMoreToggle expanded={expanded} controls={listId} onToggle={() => setExpanded((current) => !current)} />}
    </div>
  );
}
