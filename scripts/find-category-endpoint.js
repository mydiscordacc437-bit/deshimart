// scripts/find-category-endpoint.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  
  const idx = text.indexOf("categories/:catID");
  console.log("Context around categories/:catID:", text.substring(idx - 200, idx + 100));

  // Search for any endpoint with category or categories
  const catMatches = text.match(/["'](?:https:\/\/bbazar\.com\.bd\/api\/|api\/)?[^"']*(?:category|categories)[^"']*["']/g) || [];
  console.log("Cat matches in bundle:", [...new Set(catMatches)]);
}
run();
