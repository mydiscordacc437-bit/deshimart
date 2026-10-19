// scripts/inspect-product-route.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  const searchStr = "product/:slug/item-:ID";
  const idx = text.indexOf(searchStr);
  console.log("Surrounding code for route:");
  console.log(text.substring(idx - 300, idx + 100));

  // Find where B is defined
  const bDefIdx = text.lastIndexOf("B=", idx);
  console.log("B definition:", text.substring(bDefIdx, bDefIdx + 160));
}
run();
