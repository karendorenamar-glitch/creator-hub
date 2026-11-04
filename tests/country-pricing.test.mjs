import {
  COUNTRY_CODES,
  INTERNATIONAL_PRICE_USD,
  INDONESIA_PRICE_IDR,
  countryName,
  isCountryCode,
  isIndonesian,
  priceForCountry,
} from "../lib/wedding/countries.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

t("country list", COUNTRY_CODES, ["ID", "MY", "SG", "US", "GB", "AU", "OTHER"]);
t("indonesia price", INDONESIA_PRICE_IDR, 30_000);
t("international price", INTERNATIONAL_PRICE_USD, 3);

t("ID is indonesia", isIndonesian("ID"), true);
t("MY is international", isIndonesian("MY"), false);
t("missing country is international", isIndonesian(null), false);

t("indonesian pricing", priceForCountry("ID"), {
  currency: "IDR",
  amountIdr: 30_000,
  amountUsd: 0,
  method: "bank_transfer",
});

for (const code of ["MY", "SG", "US", "GB", "AU", "OTHER", null]) {
  t(`international pricing ${code ?? "null"}`, priceForCountry(code), {
    currency: "USD",
    amountIdr: 0,
    amountUsd: 3,
    method: "paypal",
  });
}

t("valid country", isCountryCode("SG"), true);
t("invalid country", isCountryCode("FR"), false);
t("country label", countryName("US"), "United States");
t("unknown country label", countryName("FR"), null);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
