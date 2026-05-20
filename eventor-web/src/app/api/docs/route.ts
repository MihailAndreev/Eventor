import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const docsPath = path.join(process.cwd(), "public", "api-docs.html");
  const html = await readFile(docsPath, "utf8");

  return new Response(html, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
