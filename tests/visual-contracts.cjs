const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const pages = [
  "work/index.html",
  "lab/index.html",
  "oss/index.html",
  "work/quackles/index.html",
  "lab/zer0/index.html",
  "oss/verified-loop/index.html",
];
for (const file of pages)
  test(`${file}: accessible editorial shell`, () => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /class="skip-link"[^>]*href="#main"/);
    assert.match(html, /<main[^>]*id="main"/);
    assert.match(html, /aria-current="page"/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.doesNotMatch(
      html,
      /<style>/,
      "shared presentation must not drift through inline styles",
    );
  });
test("feed surfaces label status accessibly", () => {
  for (const file of pages.slice(0, 3)) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /id="evidence-status"[^>]*role="status"/);
  }
  assert.match(
    fs.readFileSync(path.join(root, "oss/index.html"), "utf8"),
    /id="oss-status"[^>]*role="status"/,
  );
});
test("flagship uses real source visual with alternative text and explicit dimensions", () => {
  for (const file of ["work/index.html", "work/quackles/index.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(
      html,
      /<img[^>]*src="[^\"]*quackles-blue.webp"[^>]*alt="[^\"]+"[^>]*width="1024"[^>]*height="1536"/,
    );
  }
  assert.ok(
    fs.statSync(path.join(root, "shared/assets/quackles-blue.webp")).size <
      300000,
  );
  assert.match(
    fs.readFileSync(path.join(root, "shared/assets/SOURCES.md"), "utf8"),
    /2923a04b867aebcd5405fbd6d6bc48829a5be310/,
  );
});
test("shared CSS has explicit keyboard, reduced motion and narrow viewport contracts", () => {
  const css = fs.readFileSync(path.join(root, "shared/surfaces.css"), "utf8");
  for (const rule of [
    ":focus-visible",
    "prefers-reduced-motion",
    "scroll-behavior: auto",
    "overflow-wrap: anywhere",
    "max-width: 640px",
  ])
    assert.ok(css.includes(rule), rule);
});

test("preview entry routes to current Work and keeps legacy claims quarantined", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /http-equiv="refresh" content="0; url=\.\/work\/"/);
  assert.doesNotMatch(html, /84\.8%|54\+|2\.8.?4\.4/);
  const archive = fs.readFileSync(
    path.join(root, "work/earlier/index.html"),
    "utf8",
  );
  assert.match(archive, /historical claims have not been reverified/i);
});
