import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("renders safe links with hardened attributes and unsafe ones as plain text", () => {
    const { container } = render(
      <Markdown>{"See [the docs](https://example.com/docs) or [click me](javascript:alert(1)) or [x](JaVaScRiPt:alert(1))."}</Markdown>,
    );
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    const docs = screen.getByRole("link", { name: "the docs" });
    expect(docs).toHaveAttribute("href", "https://example.com/docs");
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(screen.getByText(/click me/)).toBeInTheDocument();
    expect(container).toHaveTextContent(/^See the docs or click me or x\.$/);
    expect(container.innerHTML).not.toMatch(/javascript:/i);
  });

  it("renders paragraphs, line breaks, emphasis, inline code and lists", () => {
    const { container } = render(
      <Markdown>{"Hello **bold** and *italic* with `code`\nnext line\n\n- one\n- two\n\n1. first\n2. second"}</Markdown>,
    );
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(container.querySelector("p br")).not.toBeNull();
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("renders fenced code in a CodeBlock without parsing its contents or raw HTML", () => {
    const { container } = render(
      <Markdown>{"Run this:\n```bash\nnpm i **not bold** <img src=x onerror=alert(1)>\n```\nDone <b>raw</b>"}</Markdown>,
    );
    expect(screen.getByText("bash")).toBeInTheDocument();
    expect(container.querySelector("pre code")).toHaveTextContent("npm i **not bold** <img src=x onerror=alert(1)>");
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(container.querySelector("img, b")).toBeNull();
  });
});
