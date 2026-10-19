// scripts/inspect-bbazar-details.js
import fs from 'fs';

async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  
  // Search for any .json or firebase or firestore or rest endpoints
  const firebaseMatches = text.match(/https:\/\/[a-zA-Z0-9_\-.]+(?:firebaseio|googleapis|cloudfunctions|herokuapp|bbazar)[a-zA-Z0-9_\-\/.]*/g) || [];
  console.log("Firebase/Cloud matches:", [...new Set(firebaseMatches)]);

  // Check for string keywords like "product", "category", "price", "reseller"
  const strings = text.match(/["']([a-zA-Z0-9_\-\/]+(?:product|category|order|cart|item|deal)[a-zA-Z0-9_\-\/]*)["']/gi) || [];
  console.log("Product-related strings:", [...new Set(strings)].slice(0, 30));

  // Check if there are other JS files or manifest in index.html
  const homeRes = await fetch("https://bbazar.com.bd/");
  const homeHtml = await homeRes.text();
  console.log("Home HTML length:", homeHtml.length);
  const scripts = homeHtml.match(/src="([^"]+)"/g) || [];
  console.log("Home scripts:", scripts);
}
run();
