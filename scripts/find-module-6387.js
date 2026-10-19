// scripts/find-module-6387.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();
  
  const idx = text.indexOf("6387:function");
  if (idx !== -1) {
    console.log("Module 6387:");
    console.log(text.substring(idx, idx + 1200));
  } else {
    console.log("Searching for 6387: in bundle...");
    const idx2 = text.indexOf("6387:");
    console.log(text.substring(idx2 - 50, idx2 + 800));
  }
}
run();
