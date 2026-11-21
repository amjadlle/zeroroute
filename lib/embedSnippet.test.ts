// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildEmbedSnippet, escapeAttr, parsePrompts } from "./embedSnippet";

/** Parse the snippet like a browser would and read back the attributes. */
function attrs(snippet: string) {
  const doc = new DOMParser().parseFromString(snippet, "text/html");
  const script = doc.querySelector("script")!;
  return Object.fromEntries([...script.attributes].map((a) => [a.name, a.value]));
}

describe("escapeAttr", () => {
  it("escapes characters that end or break an attribute", () => {
    expect(escapeAttr(`a"b'c<d>&e`)).toBe("a&quot;b&#39;c&lt;d&gt;&amp;e");
  });
});

describe("buildEmbedSnippet", () => {
  it("keeps quotes inside values instead of adding attributes", () => {
    const snippet = buildEmbedSnippet({
      botId: "bot_1",
      title: `Joe's "Best" Bot`,
      greeting: `Hi" onload="alert(1)`,
      prompts: ["What's new?", `Say "hi"`],
      origin: "https://example.test",
    });
    expect(attrs(snippet)).toEqual({
      src: "https://example.test/widget.js",
      "data-bot-id": "bot_1",
      "data-title": `Joe's "Best" Bot`,
      "data-greeting": `Hi" onload="alert(1)`,
      "data-prompts": `What's new?, Say "hi"`,
      defer: "",
    });
  });

  it("includes colour and an http(s) logo, and drops other logo schemes", () => {
    const ok = attrs(buildEmbedSnippet({ botId: "b", color: "#123456", logo: "https://x.test/l.png", origin: "o" }));
    expect(ok["data-color"]).toBe("#123456");
    expect(ok["data-logo"]).toBe("https://x.test/l.png");
    const bad = attrs(buildEmbedSnippet({ botId: "b", logo: "javascript:alert(1)", origin: "o" }));
    expect(bad["data-logo"]).toBeUndefined();
  });

  it("strips commas inside a question so the widget's comma split keeps it whole", () => {
    expect(attrs(buildEmbedSnippet({ botId: "b", prompts: ["Hours, please", " "], origin: "o" }))["data-prompts"]).toBe("Hours please");
  });
});

describe("parsePrompts", () => {
  it("reads the stored JSON array and ignores junk", () => {
    expect(parsePrompts('["a","b",3]')).toEqual(["a", "b"]);
    expect(parsePrompts("not json")).toEqual([]);
    expect(parsePrompts(undefined)).toEqual([]);
  });
});
