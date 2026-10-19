// scripts/inspect-chunk-492.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/492.f7abbfe3.chunk.js");
  const text = await res.text();
  console.log("Chunk 492 length:", text.length);

  // Search for any string with http, api, or url
  const urls = text.match(/["']([a-zA-Z0-9_\-\/:\.]*(?:api|category|products|item)[a-zA-Z0-9_\-\/:\.]*)["']/gi) || [];
  console.log("URLs / Endpoints in chunk 492:", [...new Set(urls)].slice(0, 30));
}
run();
