import { summarizeSeserahan } from '../lib/wedding/seserahan-summary.ts';

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log('FAIL', name, 'got', got, 'want', want); }
};

const item = (party, price, quantity, status = 'not_purchased') => ({ party, price, quantity, status });

// 1. add item -> plan only
let rows = [item('groom', 1000000, 2)];
check('add item plan', summarizeSeserahan(rows).all.plan, 2000000);
check('add item actual', summarizeSeserahan(rows).all.actual, 0);

// 2. status purchased -> actual moves
rows = [item('groom', 1000000, 2, 'purchased')];
check('purchased actual', summarizeSeserahan(rows).all.actual, 2000000);
check('purchased remaining', summarizeSeserahan(rows).all.remaining, 0);
check('purchased progress', summarizeSeserahan(rows).all.progress, 100);

// 3. back to not purchased
rows = [item('groom', 1000000, 2, 'not_purchased')];
check('revert actual', summarizeSeserahan(rows).all.actual, 0);

// 4. price change
rows = [item('groom', 1500000, 2, 'purchased')];
check('price change', summarizeSeserahan(rows).all.plan, 3000000);

// 5. quantity change
rows = [item('groom', 1500000, 3, 'purchased')];
check('qty change', summarizeSeserahan(rows).all.plan, 4500000);

// 6. delete item
rows = [];
check('delete item', summarizeSeserahan(rows).all.plan, 0);
check('delete progress safe', summarizeSeserahan(rows).all.progress, 0);

// 7. both parties + example numbers
rows = [
  item('groom', 5000000, 1, 'purchased'),
  item('groom', 3200000, 1, 'purchased'),
  item('groom', 1100000, 1),
  item('bride', 1100000, 1, 'purchased'),
  item('bride', 3300000, 1),
  item('bride', 2050000, 1),
];
const s = summarizeSeserahan(rows);
check('combined plan', s.all.plan, 15750000);
check('combined actual', s.all.actual, 9300000);
check('combined remaining', s.all.remaining, 6450000);
check('combined progress', s.all.progress, 59);
check('groom plan', s.groom.plan, 9300000);
check('bride plan', s.bride.plan, 6450000);
check('counts', s.all.purchasedItems + s.all.pendingItems, s.all.items);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
