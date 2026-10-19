// scripts/inspect-product-fields.js
async function run() {
  const homeRes = await fetch("https://bbazar.com.bd/api/app-data/home-screen");
  const homeData = await homeRes.json();
  console.log("Section 0:", JSON.stringify(homeData.data[0], null, 2).slice(0, 500));
  console.log("Section 1:", JSON.stringify(homeData.data[1], null, 2).slice(0, 500));
  
  // Look in chunk 1042 for how product details are retrieved (e.g. Redux action or fetch)
  const chunkRes = await fetch("https://bbazar.com.bd/static/js/1042.c545451e.chunk.js");
  const chunkText = await chunkRes.text();
  const words = chunkText.match(/dispatch\([a-zA-Z0-9_$]+\(([^\)]+)\)\)/g) || [];
  console.log("Dispatched actions in chunk 1042:", words);

  // Look for any url or template string in chunk 1042
  const templates = chunkText.match(/`[^`]+`/g) || [];
  console.log("Template strings in chunk 1042:", templates.slice(0, 10));

  // Also check if there's any mention of product endpoint
  const strings = chunkText.match(/["']([^"']*(?:product|detail|item|gallery|image)[^"']*)["']/gi) || [];
  console.log("Strings with product in chunk 1042:", [...new Set(strings)].slice(0, 25));
}
run();
