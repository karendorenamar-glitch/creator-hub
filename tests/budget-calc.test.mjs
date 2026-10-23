import { calculateBudget } from '../lib/wedding/budget-calc.ts';

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++; else { fail++; console.log('   got :', JSON.stringify(got), '\n   want:', JSON.stringify(want)); }
}

// Kasus 1: tanpa pembayaran sama sekali
let r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: 12_000_000, selection_status: 'terpilih' }],
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
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' }],
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
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' }],
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
  vendors: [{ id: 'v1', agreed_price: 8_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [], target: 50_000_000,
});
t('diskusi terpilih: committedCost', r.committedCost, 8_000_000);
t('diskusi terpilih: statusTotals.diskusi', r.statusTotals.diskusi, 8_000_000);
t('diskusi: paidPercent', r.paidPercent, 0);

// Kasus 5: vendor alternatif tidak dipilih -> tidak dihitung
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [
    { id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' },
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
    { id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' },
    { id: 'v2', agreed_price: 20_000_000, quoted_price: null },
  ],
  payments: [{ vendor_id: 'v2', amount: 5_000_000 }], target: 50_000_000,
});
t('bayar di alternatif: committedPaid', r.committedPaid, 0);
t('bayar di alternatif: committedCost', r.committedCost, 10_000_000);

// Kasus 7: kelebihan bayar -> outstanding negatif & terlihat
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' }],
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
t('fallback quoted tanpa bayar: committedCost', r.committedCost, 15_000_000);

// fallback quoted dengan pembayaran -> masuk
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: null, quoted_price: 15_000_000 }],
  payments: [{ vendor_id: 'v1', amount: 3_000_000 }], target: 50_000_000,
});
t('fallback quoted dengan bayar: committedCost', r.committedCost, 15_000_000);

// Kasus 9: target terlampaui
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 60_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [{ vendor_id: 'v1', amount: 60_000_000 }], target: 50_000_000,
});
t('target terlampaui: remainingBudget', r.remainingBudget, -10_000_000);
t('target terlampaui: overBudget', r.overBudget, true);


// Kasus 10: kategori Diskusi (belum ada pembayaran) TIDAK masuk anggaran
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: 8_000_000, quoted_price: null, selection_status: 'alternatif' }],
  payments: [], target: 50_000_000,
});
t('alternatif tidak masuk: committedCost', r.committedCost, 0);
t('alternatif tidak masuk: committedPaid', r.committedPaid, 0);
t('alternatif tidak masuk: outstandingBill', r.outstandingBill, 0);
t('alternatif tidak masuk: remainingBudget utuh', r.remainingBudget, 50_000_000);
t('alternatif tidak masuk: statusTotals.diskusi', r.statusTotals.diskusi, 0);
t('alternatif tidak masuk: statusVendors tetap 1', r.statusVendors.diskusi, 1);

// Kasus 11: kategori tanpa vendor terpilih TIDAK masuk anggaran
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: null, status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: 9_000_000, quoted_price: null }],
  payments: [{ vendor_id: 'v1', amount: 3_000_000 }], target: 50_000_000,
});
t('tanpa vendor terpilih: committedCost', r.committedCost, 0);
t('tanpa vendor terpilih: committedPaid', r.committedPaid, 0);
t('tanpa vendor terpilih: remainingBudget utuh', r.remainingBudget, 50_000_000);

// Kasus 12: sudah DP -> masuk anggaran
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: 10_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [{ vendor_id: 'v1', amount: 4_000_000 }], target: 50_000_000,
});
t('sudah DP: committedCost', r.committedCost, 10_000_000);
t('sudah DP: committedPaid', r.committedPaid, 4_000_000);
t('sudah DP: remainingBudget', r.remainingBudget, 40_000_000);

// Kasus 13: dua kategori, satu Diskusi satu DP -> hanya DP yang dihitung
r = calculateBudget({
  groups: [
    { id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' },
    { id: 'g2', selected_vendor_id: 'v2', status: 'dp' },
  ],
  vendors: [
    { id: 'v1', agreed_price: 8_000_000, quoted_price: null, selection_status: 'alternatif' },
    { id: 'v2', agreed_price: 12_000_000, quoted_price: null, selection_status: 'terpilih' },
  ],
  payments: [{ vendor_id: 'v2', amount: 5_000_000 }],
  target: 50_000_000,
});
t('campuran: committedCost hanya DP', r.committedCost, 12_000_000);
t('campuran: committedPaid hanya DP', r.committedPaid, 5_000_000);
t('campuran: sisa tagihan', r.outstandingBill, 7_000_000);

// ============ SKENARIO A-H (spesifikasi produk) ============
console.log('\n--- Skenario A-H ---');
function budgetMessage(target, committed) {
  const diff = target - committed;
  if (diff > 0) return `Kamu menghemat biaya sebesar Rp${diff.toLocaleString('id-ID')}.`;
  if (diff === 0) return 'Budget sesuai.';
  return `Budget melebihi anggaran sebesar Rp${Math.abs(diff).toLocaleString('id-ID')}.`;
}

// A: belum ada vendor terpilih (semua Masih Dipikirkan)
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: 30_000_000, quoted_price: null, selection_status: 'alternatif' }],
  payments: [], target: 100_000_000,
});
t('A committedCost 0', r.committedCost, 0);
t('A committedPaid 0', r.committedPaid, 0);
t('A outstandingBill 0', r.outstandingBill, 0);
t('A paidPercent 0', r.paidPercent, 0);
t('A pesan budget', budgetMessage(100_000_000, r.committedCost), 'Kamu menghemat biaya sebesar Rp100.000.000.');

// B: vendor terpilih tanpa pembayaran
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'diskusi' }],
  vendors: [{ id: 'v1', agreed_price: 30_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [], target: 100_000_000,
});
t('B committedCost', r.committedCost, 30_000_000);
t('B committedPaid', r.committedPaid, 0);
t('B outstandingBill', r.outstandingBill, 30_000_000);
t('B paidPercent 0', r.paidPercent, 0);
t('B pesan budget', budgetMessage(100_000_000, r.committedCost), 'Kamu menghemat biaya sebesar Rp70.000.000.');

// C: DP sebagian 5jt dari harga 30jt
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'dp' }],
  vendors: [{ id: 'v1', agreed_price: 30_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [{ vendor_id: 'v1', amount: 5_000_000 }], target: 100_000_000,
});
t('C committedCost', r.committedCost, 30_000_000);
t('C committedPaid', r.committedPaid, 5_000_000);
t('C outstandingBill', r.outstandingBill, 25_000_000);
t('C paidPercent 16.67', r.paidPercent, 16.67);
t('C pesan budget', budgetMessage(100_000_000, r.committedCost), 'Kamu menghemat biaya sebesar Rp70.000.000.');

// D: beberapa transaksi (DP + lanjutan + pelunasan)
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'v1', status: 'lunas' }],
  vendors: [{ id: 'v1', agreed_price: 30_000_000, quoted_price: null, selection_status: 'terpilih' }],
  payments: [
    { vendor_id: 'v1', amount: 5_000_000 },
    { vendor_id: 'v1', amount: 10_000_000 },
    { vendor_id: 'v1', amount: 15_000_000 },
  ],
  target: 100_000_000,
});
t('D committedCost', r.committedCost, 30_000_000);
t('D committedPaid', r.committedPaid, 30_000_000);
t('D outstandingBill', r.outstandingBill, 0);
t('D paidPercent 100', r.paidPercent, 100);

// E: vendor alternatif (A dan C tidak dipilih)
r = calculateBudget({
  groups: [{ id: 'g1', selected_vendor_id: 'vB', status: 'dp' }],
  vendors: [
    { id: 'vA', agreed_price: 20_000_000, quoted_price: null, selection_status: 'alternatif' },
    { id: 'vB', agreed_price: 30_000_000, quoted_price: null, selection_status: 'terpilih' },
    { id: 'vC', agreed_price: 40_000_000, quoted_price: null, selection_status: 'alternatif' },
  ],
  payments: [{ vendor_id: 'vB', amount: 10_000_000 }],
  target: 100_000_000,
});
t('E committedCost hanya B', r.committedCost, 30_000_000);
t('E committedPaid', r.committedPaid, 10_000_000);
t('E outstandingBill', r.outstandingBill, 20_000_000);

// F: budget sesuai
t('F pesan budget sesuai', budgetMessage(50_000_000, 50_000_000), 'Budget sesuai.');

// G: melebihi budget
t('G pesan melebihi', budgetMessage(100_000_000, 120_000_000), 'Budget melebihi anggaran sebesar Rp20.000.000.');

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
