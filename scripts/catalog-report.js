/* Prints what the seven legacy product catalogues disagree about.
   Run: node scripts/catalog-report.js

   Read-only. Resolve what it reports in the LEGACY source files, then re-run
   until it is empty — that is the gate for moving callers onto
   src/catalog/productCatalog.js. */
import { allProducts, conflicts, orphans } from '../src/catalog/productCatalog.js';

const pad = (s, n) => String(s).padEnd(n);
const inr = (v) => (typeof v === 'number' ? '₹' + v : String(v));

const products = allProducts();
const clashes = conflicts();
const lone = orphans();

console.log('\nDRUCKA — PRODUCT CATALOGUE PARITY REPORT');
console.log('='.repeat(72));
console.log(`${products.length} product ids across 7 legacy sources\n`);

console.log('DEFINED IN');
console.log('  ' + pad('id', 14) + pad('sources', 9) + pad('fulfilment', 12) + 'where');
products.forEach((p) => {
  console.log('  ' + pad(p.id, 14) + pad(p.definedIn.length, 9) +
    pad(p.fulfilment, 12) + p.definedIn.join(', '));
});

console.log(`\nCONFLICTS  (${clashes.length})`);
if (!clashes.length) {
  console.log('  none — every source agrees on every joined field.');
} else {
  clashes.forEach((c) => {
    const val = c.field === 'price' ? inr(c.winner.value) : c.winner.value;
    console.log(`\n  ${c.id} · ${c.field}`);
    console.log(`    winner : ${val}   (${c.winner.from})`);
    c.others.forEach((o) => {
      const ov = c.field === 'price' ? inr(o.value) : o.value;
      console.log(`    also   : ${ov}   (${o.src})`);
    });
  });
}

console.log(`\nSINGLE-SOURCE PRODUCTS  (${lone.length})`);
if (!lone.length) {
  console.log('  none.');
} else {
  lone.forEach((o) => console.log(`  ${pad(o.id, 14)} only in ${o.only}`));
}

console.log('\n' + '='.repeat(72));
console.log(clashes.length
  ? `${clashes.length} conflict(s) to resolve before callers can migrate.`
  : 'Parity reached — callers may migrate to productById().');
console.log('');
