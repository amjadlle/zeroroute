import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { safeHref } from "@/lib/safeHref";
import { CodeBlock } from "./CodeBlock";

// `code` | **bold** | *italic* | [label](url), the URL may hold one level of (parens). Code first so its contents are never parsed further.
const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|\*(?!\s)([^*]+?)\*|\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))*)\)/g;
const FENCE = /^\s*```\s*([\w+#.-]*)/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function inline(text: string, key = ""): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}${m.index}`;
    if (m[1] !== undefined) {
      out.push(<code key={k} className="rounded-control bg-surface-sunken px-1 font-ui-mono">{m[1]}</code>);
    } else if (m[2] !== undefined) {
      out.push(<strong key={k} className="font-semibold">{inline(m[2], `${k}.`)}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={k}>{inline(m[3], `${k}.`)}</em>);
    } else {
      const href = safeHref(m[5]);
      const label = inline(m[4], `${k}.`);
      // Disallowed schemes (javascript:, data:, relative, ...) keep only their label, as plain text.
      out.push(
        href ? (
          <a
            key={k}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-control text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {label}
          </a>
        ) : (
          <Fragment key={k}>{label}</Fragment>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Renders the Markdown subset chat answers use, as React elements (never raw HTML): paragraphs, line
 * breaks, bold, italic, inline and fenced code, bullet and numbered lists, and http/https/mailto links.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  const lines = children.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fence) {
      const code: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
      i++; // closing fence (an unclosed fence runs to the end, as while a reply is still streaming)
      blocks.push(<CodeBlock key={blocks.length} code={code.join("\n")} language={fence[1] || undefined} />);
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const pattern = BULLET.test(line) ? BULLET : NUMBERED;
      const items: string[] = [];
      for (; i < lines.length && pattern.test(lines[i]); i++) items.push(lines[i].match(pattern)![1]);
      const List = pattern === BULLET ? "ul" : "ol";
      blocks.push(
        <List key={blocks.length} className={cn("space-y-1 pl-5", List === "ul" ? "list-disc" : "list-decimal")}>
          {items.map((item, n) => <li key={n}>{inline(item)}</li>)}
        </List>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      for (; i < lines.length && lines[i].trim() !== "" && !FENCE.test(lines[i]) && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i]); i++) {
        para.push(lines[i]);
      }
      blocks.push(
        <p key={blocks.length}>
          {para.map((l, n) => (
            <Fragment key={n}>
              {n > 0 && <br />}
              {inline(l)}
            </Fragment>
          ))}
        </p>,
      );
    }
  }

  return <div className={cn("min-w-0 space-y-3 font-ui text-body break-words text-text", className)}>{blocks}</div>;
}
