const INLINE_PATTERN = /(\*\*[\s\S]+?\*\*|~~[\s\S]+?~~|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\n]+\*|_[^_\n]+_)/;

const SAFE_LINK = /^https?:\/\//i;

type Alignment = "left" | "center" | "right";

interface TableBlock {
  kind: "table";
  headers: string[];
  rows: string[][];
  alignments: Alignment[];
}

interface ListBlock {
  kind: "list";
  ordered: boolean;
  items: string[];
}

interface TextBlock {
  kind: "heading" | "paragraph" | "quote";
  level: number;
  text: string;
}

interface CodeBlock {
  kind: "code";
  code: string;
}

interface RuleBlock {
  kind: "rule";
}

type Block = TableBlock | ListBlock | TextBlock | CodeBlock | RuleBlock;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(INLINE_PATTERN).filter((part) => part !== "" && part !== undefined);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-bold text-navy-900">
          {renderInline(part.slice(2, -2), key)}
        </strong>
      );
    }

    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      return (
        <s key={key} className="text-stone-400">
          {renderInline(part.slice(2, -2), key)}
        </s>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-[0.85em] text-navy-900">
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link && SAFE_LINK.test(link[2])) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
          {link[1]}
        </a>
      );
    }
    if (link) return <span key={key}>{link[1]}</span>;

    const emphasis = (part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"));
    if (emphasis && part.length > 2) {
      return (
        <em key={key} className="italic">
          {renderInline(part.slice(1, -1), key)}
        </em>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function readAlignments(line: string): Alignment[] {
  return splitRow(line).map((cell) => {
    if (cell.startsWith(":") && cell.endsWith(":")) return "center";
    if (cell.endsWith(":")) return "right";
    return "left";
  });
}

function isSeparator(line: string): boolean {
  if (!line.includes("|")) return false;
  return splitRow(line).every((cell) => /^:?-{2,}:?$/.test(cell));
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ kind: "code", code: code.join("\n") });
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isSeparator(lines[index + 1])) {
      const headers = splitRow(line);
      const alignments = readAlignments(lines[index + 1]);
      index += 2;

      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim() !== "") {
        rows.push(splitRow(lines[index]));
        index += 1;
      }

      blocks.push({ kind: "table", headers, rows, alignments });
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ kind: "quote", level: 0, text: quote.join(" ") });
      continue;
    }

    const bullet = /^\s*(?:[-*·]|\d+[.)])\s+/;
    if (bullet.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length && bullet.test(lines[index])) {
        items.push(lines[index].replace(bullet, ""));
        index += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() !== "" && !bullet.test(lines[index]) && !lines[index].includes("|")) {
      paragraph.push(lines[index]);
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ kind: "paragraph", level: 0, text: paragraph.join(" ") });
  }

  return blocks;
}

const ALIGN_CLASS: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const HEADING_CLASS: Record<number, string> = {
  1: "text-base font-bold text-navy-900",
  2: "text-[0.95rem] font-bold text-navy-900",
  3: "text-sm font-bold text-navy-900",
  4: "text-sm font-semibold text-navy-900"
};

export function Markdown({ content }: { content: string }): React.ReactNode {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.kind === "table") {
          return (
            <div key={key} className="relative -mx-1 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[0.8rem]">
                <thead>
                  <tr className="border-b border-stone-300">
                    {block.headers.map((header, cell) => (
                      <th key={`${key}-h-${cell}`} className={`px-2 py-1.5 font-semibold text-navy-900 ${ALIGN_CLASS[block.alignments[cell] ?? "left"]}`}>
                        {renderInline(header, `${key}-h-${cell}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${key}-r-${rowIndex}`} className="border-b border-stone-200 last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${key}-r-${rowIndex}-${cellIndex}`}
                          className={`px-2 py-1.5 align-top wrap-anywhere ${ALIGN_CLASS[block.alignments[cellIndex] ?? "left"]}`}
                        >
                          {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={key} className={`ml-4 space-y-1 ${block.ordered ? "list-decimal" : "list-disc"}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-i-${itemIndex}`} className="wrap-break-word">
                  {renderInline(item, `${key}-i-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.kind === "code") {
          return (
            <pre key={key} className="relative overflow-x-auto rounded-lg bg-navy-900 px-3 py-2.5 text-[0.78rem] text-white">
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.kind === "rule") return <hr key={key} className="border-stone-200" />;

        if (block.kind === "heading") {
          return (
            <p key={key} className={HEADING_CLASS[block.level] ?? HEADING_CLASS[4]}>
              {renderInline(block.text, key)}
            </p>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote key={key} className="border-l-2 border-brand-300 pl-3 text-stone-600 wrap-break-word">
              {renderInline(block.text, key)}
            </blockquote>
          );
        }

        return (
          <p key={key} className="wrap-break-word">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}
