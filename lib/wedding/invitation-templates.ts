import type { InvitationTemplateKey } from "@/lib/wedding/db-types";

export type InvitationTemplateMeta = {
  key: InvitationTemplateKey;
  name: string;
  description: string;
  /** Tailwind classes used by the gallery preview swatch. */
  swatch: string;
};

export const INVITATION_TEMPLATES: InvitationTemplateMeta[] = [
  {
    key: "elegant",
    name: "Minimalist & Elegant",
    description:
      "Ivory hangat, tipografi serif, dan ruang kosong yang lapang. Paling tenang dan abadi.",
    swatch: "bg-gradient-to-br from-[#fdfbf5] via-[#f6f7f1] to-[#eaeedd]",
  },
  {
    key: "garden",
    name: "Garden Wedding",
    description:
      "Hijau sage lembut, bingkai foto, dan sentuhan botani. Cocok untuk acara outdoor.",
    swatch: "bg-gradient-to-br from-[#eef4e6] via-[#dfead2] to-[#b9c69f]",
  },
  {
    key: "luxury",
    name: "Luxury Gold",
    description:
      "Latar gelap dengan aksen emas dan garis tipis. Dramatis dan mewah.",
    swatch: "bg-gradient-to-br from-[#17150f] via-[#241f16] to-[#4a3d26]",
  },
];

export function templateMeta(key: string | null | undefined) {
  return (
    INVITATION_TEMPLATES.find((item) => item.key === key) ??
    INVITATION_TEMPLATES[0]
  );
}
