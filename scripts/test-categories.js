// scripts/test-categories.js
async function run() {
  const catEndpoints = [
    "https://bbazar.com.bd/api/categories",
    "https://bbazar.com.bd/api/v2/categories",
    "https://bbazar.com.bd/api/all-categories",
    "https://bbazar.com.bd/api/category/1",
    "https://bbazar.com.bd/api/category/1/products",
    "https://bbazar.com.bd/api/products?category_id=1",
    "https://bbazar.com.bd/api/products/random?page=1",
    "https://bbazar.com.bd/api/products/random?page=2",
    "https://bbazar.com.bd/api/products/random?page=3"
  ];

  for (const u of catEndpoints) {
    try {
      const r = await fetch(u);
      console.log(u, "Status:", r.status);
      if (r.status === 200) {
        const d = await r.json();
        console.log("  Keys:", Object.keys(d));
      }
    } catch (e) {
      console.log(u, "Err:", e.message);
    }
  }
}
run();
