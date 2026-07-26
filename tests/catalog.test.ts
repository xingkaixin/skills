import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSkillMarkdown,
  renderSkillBody,
} from "../scripts/catalog/markdown.ts";

test("parses CRLF and standard YAML frontmatter", () => {
  const parsed = parseSkillMarkdown(
    [
      "---",
      'name: "example-skill"',
      "description: >-",
      "  A folded",
      "  description.",
      "---",
      "# Example",
    ].join("\r\n"),
    "example-skill",
  );

  assert.equal(parsed.name, "example-skill");
  assert.equal(parsed.description, "A folded description.");
  assert.equal(parsed.body, "# Example");
});

test("sanitizes active HTML and dangerous URL schemes", () => {
  const html = renderSkillBody(
    [
      "# Example",
      "<img src=x onerror='alert(1)'>",
      "<svg onload=alert(1)></svg>",
      "<a href=\"jav&#x61;script:alert(1)\">unsafe</a>",
      "<script>alert(1)</script>",
    ].join("\n"),
    "workflow",
    "example-skill",
  );

  assert.doesNotMatch(html, /onerror|onload|javascript|<script|<svg/i);
});

test("adds heading anchors and rewrites local references", () => {
  const html = renderSkillBody(
    [
      "# Example title",
      "## Details",
      "[Reference](references/guide.md#usage)",
      "![Preview](assets/preview.png)",
      "- [ ] Pending",
    ].join("\n"),
    "workflow",
    "example-skill",
  );

  assert.match(html, /<h2 id="example-title">/);
  assert.match(html, /<h3 id="details">/);
  assert.match(
    html,
    /github\.com\/xingkaixin\/skills\/blob\/main\/skills\/workflow\/example-skill\/references\/guide\.md#usage/,
  );
  assert.match(
    html,
    /raw\.githubusercontent\.com\/xingkaixin\/skills\/main\/skills\/workflow\/example-skill\/assets\/preview\.png/,
  );
  assert.doesNotMatch(html, /<input/);
});
