// scripts/inspect-product-chunk.js
async function run() {
  console.log("Fetching home-screen data...");
  const homeRes = await fetch("https://bbazar.com.bd/api/app-data/home-screen");
  const homeData = await homeRes.json();
  console.log("Home-screen data keys:", Object.keys(homeData.data));
  for (const k of Object.keys(homeData.data)) {
    const val = homeData.data[k];
    console.log(`Key [${k}]:`, Array.isArray(val) ? `Array length ${val.length}` : typeof val);
    if (Array.isArray(val) && val.length > 0) {
      console.log(`  Sample [${k}][0]:`, Object.keys(val[0]));
    }
  }

  console.log("\nFetching chunk 1042...");
  const chunkRes = await fetch("https://bbazar.com.bd/static/js/1042.c545451e.chunk.js");
  const chunkText = await chunkRes.text();
  console.log("Chunk 1042 length:", chunkText.length);
  // Search for API calls in chunk 1042
  const apiCalls = chunkText.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log("API calls in product detail chunk:", [...new Set(apiCalls)]);
}
run();
