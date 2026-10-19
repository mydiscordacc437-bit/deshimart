// scripts/find-component-b.js
async function run() {
  const res = await fetch("https://bbazar.com.bd/static/js/main.6fd0d9d3.js");
  const text = await res.text();

  // Find definition of B right before routing table
  const idx = text.indexOf('product/:slug/item-:ID');
  // Look backwards for function B or B =
  const prior = text.substring(idx - 6000, idx);
  
  // Look for useParams and fetch / axios calls
  const matches = prior.match(/useParams|axios|fetch|product/g);
  console.log("Matches:", matches?.length);

  // Let's find all occurrences of ID in prior
  const idMatches = prior.match(/[a-zA-Z0-9_$]+\.ID/g) || [];
  console.log("ID property accesses:", [...new Set(idMatches)]);

  // Let's look for any strings with API routes in prior
  const stringLiterals = prior.match(/["'][a-zA-Z0-9_\-\/]+["']/g) || [];
  console.log("String literals in prior 6000 chars:", [...new Set(stringLiterals)].filter(s => s.length > 3).slice(0, 40));
}
run();
