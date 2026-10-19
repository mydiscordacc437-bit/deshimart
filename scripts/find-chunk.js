// scripts/find-chunk.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  
  // Find chunk 1042 filename
  const idx = text.indexOf('1042:');
  console.log("Chunk 1042 mapping:", text.substring(idx - 20, idx + 100));

  // Also check other products endpoints on B-Bazar
  // Let's test if there is /api/products or /api/product
  const endpoints = [
    "https://bbazar.com.bd/api/products/categories-and-subcategories",
    "https://bbazar.com.bd/api/app-data/home-screen",
    "https://bbazar.com.bd/api/slides",
    "https://bbazar.com.bd/api/brands"
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep);
      console.log(ep, "Status:", r.status);
      if (r.status === 200) {
        const d = await r.json();
        console.log("Keys:", Object.keys(d));
      }
    } catch(e) {
      console.log(ep, "Error:", e.message);
    }
  }
}
run();
