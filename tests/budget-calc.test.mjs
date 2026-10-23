import { calculateBudget } from './lib/wedding/budget-calc.ts';

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++; else { fail++; console.log('   got :', JSON.stringify(got), '\n   want:', JSON.stringify(want)); }
}

// Kasus 1: tanpa pembayaran sama sekali
let r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: 12_000_000 }],
  payments: [], target: 50_000_000,
});
t('tanpa bayar: committedCost', r.committedCost, 10_000_000);
t('tanpa bayar: committedPaid', r.committedPaid, 0);
t('tanpa bayar: outstandingBill', r.outstandingBill, 10_000_000);
t('tanpa bayar: paidPercent bukan 100', r.paidPercent, 0);
t('tanpa bayar: remainingBudget', r.remainingBudget, 40_000_000);

// Kasus 2: DP sebagian
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null }],
  payments: [{ vendor_id: 'v1', amount: 4_000_000 }], target: 50_000_000,
});
t('DP sebagian: committedCost', r.committedCost, 10_000_000);
t('DP sebagian: committedPaid', r.committedPaid, 4_000_000);
t('DP sebagian: outstandingBill', r.outstandingBill, 6_000_000);
t('DP sebagian: paidPercent', r.paidPercent, 40);
t('DP sebagian: statusTotals.dp', r.statusTotals.dp, 10_000_000);

// Kasus 3: pelunasan penuh
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null }],
  payments: [{ vendor_id: 'v1', amount: 4_000_000 }, { vendor_id: 'v1', amount: 6_000_000 }],
  target: 50_000_000,
});
t('lunas: committedPaid', r.committedPaid, 10_000_000);
t('lunas: outstandingBill', r.outstandingBill, 0);
t('lunas: paidPercent', r.paidPercent, 100);
t('lunas: statusTotals.lunas', r.statusTotals.lunas, 10_000_000);

// Kasus 4: vendor Diskusi (harga tetap dihitung, tapi tidak ada pembayaran)
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: 8_000_000, quoted_price: null }],
  payments: [], target: 50_000_000,
});
t('diskusi: committedCost', r.committedCost, 8_000_000);
t('diskusi: statusTotals.diskusi', r.statusTotals.diskusi, 8_000_000);
t('diskusi: paidPercent', r.paidPercent, 0);

// Kasus 5: vendor alternatif tidak dipilih -> tidak dihitung
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [
    { id: 'v1', agreed_price: 10_000_000, quoted_price: null },
    { id: 'v2', agreed_price: 20_000_000, quoted_price: null },
  ],
  payments: [{ vendor_id: 'v1', amount: 1_000_000 }], target: 50_000_000,
});
t('alternatif tidak dipilih: committedCost', r.committedCost, 10_000_000);
t('alternatif tidak dipilih: committedPaid', r.committedPaid, 1_000_000);

// Kasus 6: pembayaran di vendor yang TIDAK dipilih -> tidak dihitung
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [
    { id: 'v1', agreed_price: 10_000_000, quoted_price: null },
    { id: 'v2', agreed_price: 20_000_000, quoted_price: null },
  ],
  payments: [{ vendor_id: 'v2', amount: 5_000_000 }], target: 50_000_000,
});
t('bayar di alternatif: committedPaid', r.committedPaid, 0);
t('bayar di alternatif: committedCost', r.committedCost, 10_000_000);

// Kasus 7: kelebihan bayar -> outstanding negatif & terlihat
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null }],
  payments: [{ vendor_id: 'v1', amount: 12_000_000 }], target: 50_000_000,
});
t('kelebihan bayar: outstandingBill', r.outstandingBill, -2_000_000);
t('kelebihan bayar: overpaid', r.overpaid, true);
t('kelebihan bayar: paidPercent', r.paidPercent, 120);

// Kasus 8: fallback ke quoted_price
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: null, quoted_price: 15_000_000 }],
  payments: [], target: 50_000_000,
});
t('fallback quoted: committedCost', r.committedCost, 15_000_000);

// Kasus 9: target terlampaui
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 60_000_000, quoted_price: null }],
  payments: [{ vendor_id: 'v1', amount: 60_000_000 }], target: 50_000_000,
});
t('target terlampaui: remainingBudget', r.remainingBudget, -10_000_000);
t('target terlampaui: overBudget', r.overBudget, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
