// scripts/find-endpoints.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();

  // Search for endpoints that fetch a product by id or slug
  const regex = /["']([^"']*products?\/[^"']*)["']/g;
  let m;
  const list = new Set();
  while ((m = regex.exec(text)) !== null) {
    list.add(m[1]);
  }
  console.log("Matching product paths:", [...list]);

  // Let's test a couple of product detail candidates for product 11772
  const testUrls = [
    "https://bbazar.com.bd/api/products/11772",
    "https://bbazar.com.bd/api/product/11772",
    "https://bbazar.com.bd/api/product-details/11772",
    "https://bbazar.com.bd/api/private/products/11772"
  ];

  for (const url of testUrls) {
    try {
      const r = await fetch(url);
      console.log(url, "Status:", r.status);
      if (r.status === 200) {
        const data = await r.json();
        console.log("SUCCESS for", url, "Keys:", Object.keys(data));
        console.log("Sample detail:", JSON.stringify(data).slice(0, 300));
      }
    } catch (e) {
      console.log(url, "Error:", e.message);
    }
  }
}
run();
