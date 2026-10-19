// scripts/find-product-view.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();

  const idx = text.indexOf("item-:ID");
  console.log("Context around item-:ID:");
  console.log(text.substring(idx - 400, idx + 400));

  // Search for API calls inside that component or function
  const match = text.match(/https:\/\/bbazar\.com\.bd\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log("All explicit api URLs:", [...new Set(match)]);
}
run();
