// scripts/find-category-call.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  
  const idx = text.indexOf('categories/:catID');
  console.log("Context around categories/:catID:", text.substring(idx - 60, idx + 200));

  // Let's see what component M is
  const mIdx = text.lastIndexOf("M=", idx);
  console.log("M definition:", text.substring(mIdx, mIdx + 160));
}
run();
