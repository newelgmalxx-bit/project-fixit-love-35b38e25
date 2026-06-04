// Post-build script: prepares dist/client as a static SPA ready for
// any plain static host (Hostinger, Netlify, GitHub Pages, ...).
//
// TanStack Start in SPA mode emits `_shell.html`. We copy it to
// `index.html` so Apache/Nginx serve it as the entry point, and we
// also drop a 404.html fallback for hosts that use it for SPA routing.

import { promises as fs } from "node:fs";
import path from "node:path";

const clientDir = path.resolve("dist", "client");
const shell = path.join(clientDir, "_shell.html");
const indexHtml = path.join(clientDir, "index.html");
const notFoundHtml = path.join(clientDir, "404.html");

try {
  const html = await fs.readFile(shell, "utf8");
  await fs.writeFile(indexHtml, html, "utf8");
  await fs.writeFile(notFoundHtml, html, "utf8");
  console.log("[postbuild] Wrote dist/client/index.html and 404.html from _shell.html");
} catch (err) {
  console.error("[postbuild] Failed to prepare static SPA output:", err);
  process.exit(1);
}
