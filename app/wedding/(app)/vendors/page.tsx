import { redirect } from "next/navigation";

/** Vendor management now lives inside the Budget tab. */
export default function VendorsPage() {
  redirect("/wedding/budget");
}
