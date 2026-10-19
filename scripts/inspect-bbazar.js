// scripts/inspect-bbazar.js
async function run() {
  try {
    console.log("Fetching B-Bazar JS bundle...");
    const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
    const text = await res.text();
    console.log("Bundle size:", text.length);

    // Look for API endpoints, domains, axios configurations
    const urls = text.match(/https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?(?:\/[a-zA-Z0-9_.\-\/]+)?/g) || [];
    const uniqueUrls = [...new Set(urls)].filter(u => !u.includes("w3.org") && !u.includes("facebook") && !u.includes("google"));
    console.log("Discovered backend URLs:");
    uniqueUrls.slice(0, 15).forEach(u => console.log(" - ", u));

    // Look for routes or API endpoints
    const apiEndpoints = text.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
    console.log("Discovered /api/ endpoints:");
    [...new Set(apiEndpoints)].slice(0, 15).forEach(e => console.log(" - ", e));

    // Look for product endpoints
    const prodMatches = text.match(/["'](\/(?:product|category|item)[a-zA-Z0-9_\-\/]*)["']/g) || [];
    console.log("Product routes:");
    [...new Set(prodMatches)].slice(0, 15).forEach(m => console.log(" - ", m));
  } catch (err) {
    console.error("Error inspecting B-Bazar:", err.message);
  }
}
run();
