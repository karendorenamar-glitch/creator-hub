import { ELEMENT_SVGS } from "./elements";
import type { StudioBackground, StudioLayer, StudioTemplate } from "./types";

function text(
  value: string,
  left: number,
  top: number,
  width: number,
  fontFamily: string,
  fontSize: number,
  fill: string,
  extra: Partial<Extract<StudioLayer, { kind: "text" }>> = {},
): StudioLayer {
  return {
    kind: "text",
    text: value,
    left,
    top,
    width,
    fill,
    fontFamily,
    fontSize,
    textAlign: "center",
    ...extra,
  };
}

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  extra: Partial<Extract<StudioLayer, { kind: "rect" }>> = {},
): StudioLayer {
  return { kind: "rect", left, top, width, height, fill, ...extra };
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth = 1,
): StudioLayer {
  return { kind: "line", x1, y1, x2, y2, stroke, strokeWidth };
}

function svg(
  source: string,
  left: number,
  top: number,
  width: number,
  color: string,
  opacity = 1,
): StudioLayer {
  return { kind: "svg", svg: source, left, top, width, color, opacity };
}

const solid = (color: string): StudioBackground => ({ type: "solid", color });
const gradient = (a: string, b: string, angle = 135): StudioBackground => ({
  type: "gradient",
  colors: [a, b],
  angle,
});

const basicTemplates: StudioTemplate[] = [
  {
    id: "luxury",
    name: "Luxury",
    category: "basic",
    description: "Burgundy, emerald, navy, champagne, dan emas.",
    palette: ["#430d1b", "#0d2c27", "#111827", "#c6a15b", "#f4e8cf"],
    background: gradient("#260710", "#520f22"),
    layers: [
      rect(34, 34, 532, 732, "", { stroke: "#c6a15b", strokeWidth: 1 }),
      rect(46, 46, 508, 708, "", { stroke: "#c6a15b", strokeWidth: 1 }),
      svg(ELEMENT_SVGS.floralCorner, 22, 22, 120, "#c6a15b", 0.8),
      svg(ELEMENT_SVGS.floralCorner, 458, 658, 120, "#c6a15b", 0.8),
      text("THE WEDDING OF", 150, 96, 300, "Cinzel", 13, "#c6a15b", { charSpacing: 400 }),
      text("Amara", 90, 170, 420, "Playfair Display", 68, "#f4e8cf", { fontStyle: "italic" }),
      text("&", 260, 260, 80, "Cormorant Garamond", 38, "#c6a15b"),
      text("Raka", 90, 310, 420, "Playfair Display", 68, "#f4e8cf", { fontStyle: "italic" }),
      line(170, 410, 430, 410, "#c6a15b"),
      text("Sabtu, 21 November 2026", 120, 436, 360, "Montserrat", 14, "#e8d7b5", { charSpacing: 120 }),
      text("Grand Ballroom · Jakarta", 120, 468, 360, "Libre Baskerville", 13, "#d5c29c"),
      svg(ELEMENT_SVGS.rings, 250, 520, 100, "#c6a15b"),
      text("Dengan penuh cinta,\nkami mengundang Anda untuk berbagi kebahagiaan", 100, 650, 400, "Cormorant Garamond", 17, "#f4e8cf", { fontStyle: "italic", lineHeight: 1.3 }),
    ],
  },
  {
    id: "pastel-romance",
    name: "Pastel Romance",
    category: "basic",
    description: "Blush, lavender, powder blue, butter yellow, dan mint.",
    palette: ["#f8dfe5", "#d9c7ea", "#c8dceb", "#f4e6ae", "#c7e4d4"],
    background: solid("#fceef0"),
    layers: [
      { kind: "ellipse", left: 370, top: -90, rx: 230, ry: 180, fill: "#e6d9f1", opacity: 0.7 },
      { kind: "ellipse", left: -100, top: 570, rx: 210, ry: 180, fill: "#c7e4d4", opacity: 0.55 },
      { kind: "ellipse", left: 380, top: 610, rx: 130, ry: 120, fill: "#f4e6ae", opacity: 0.65 },
      text("together forever", 100, 110, 400, "Great Vibes", 39, "#b6788d"),
      text("Maya", 70, 188, 460, "Playfair Display", 62, "#7d5b73", { fontStyle: "italic" }),
      text("and", 260, 272, 80, "Parisienne", 30, "#b6788d"),
      text("Arka", 70, 304, 460, "Playfair Display", 62, "#7d5b73", { fontStyle: "italic" }),
      svg(ELEMENT_SVGS.floralCorner, 44, 420, 140, "#91ab99"),
      svg(ELEMENT_SVGS.leaves, 414, 440, 150, "#91ab99"),
      text("Save the date", 160, 455, 280, "Montserrat", 14, "#8f7081", { charSpacing: 300 }),
      text("12 · 12 · 2026", 150, 494, 300, "Cormorant Garamond", 26, "#8f7081"),
      text("The Garden House, Bandung", 120, 544, 360, "Lato", 14, "#8f7081"),
      line(220, 588, 380, 588, "#c99eaa"),
      text("Kami menantikan kehadiran Anda", 150, 620, 300, "Cormorant Garamond", 17, "#8f7081", { fontStyle: "italic" }),
    ],
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    category: "basic",
    description: "Bersih, lapang, dan modern.",
    palette: ["#f4f1ea", "#1e2522", "#9c8c73", "#ffffff", "#c7b9a5"],
    background: solid("#f4f1ea"),
    layers: [
      rect(90, 90, 420, 620, "", { stroke: "#1e2522", strokeWidth: 1 }),
      text("WEDDING INVITATION", 120, 130, 360, "Montserrat", 11, "#1e2522", { charSpacing: 500 }),
      text("DINDA", 90, 205, 420, "Bodoni Moda", 60, "#1e2522"),
      text("+", 280, 292, 40, "DM Sans", 24, "#9c8c73"),
      text("BAGAS", 90, 340, 420, "Bodoni Moda", 60, "#1e2522"),
      line(120, 430, 480, 430, "#9c8c73"),
      text("06.06.2026", 170, 457, 260, "DM Sans", 16, "#1e2522", { charSpacing: 150 }),
      text("A private celebration", 150, 502, 300, "Lato", 13, "#9c8c73", { fontStyle: "italic" }),
      text("Jakarta · 16.00 WIB", 150, 620, 300, "DM Sans", 13, "#1e2522"),
    ],
  },
  {
    id: "botanical-garden",
    name: "Botanical Garden",
    category: "basic",
    description: "Sage, cream, dan ilustrasi botani.",
    palette: ["#e8efe3", "#f8f1df", "#6f7c5a", "#a78b62", "#32503c"],
    background: gradient("#f7f0df", "#e4ecdd"),
    layers: [
      svg(ELEMENT_SVGS.branch, 26, 48, 190, "#6f7c5a"),
      svg(ELEMENT_SVGS.branch, 384, 570, 190, "#6f7c5a", 0.9),
      svg(ELEMENT_SVGS.rose, 54, 614, 106, "#a86572"),
      svg(ELEMENT_SVGS.leaves, 450, 98, 130, "#6f7c5a"),
      text("IN THE GARDEN", 120, 125, 360, "Montserrat", 12, "#32503c", { charSpacing: 350 }),
      text("Nadia", 70, 210, 460, "Cormorant Garamond", 64, "#32503c", { fontStyle: "italic" }),
      text("&", 260, 292, 80, "Great Vibes", 38, "#a78b62"),
      text("Bima", 70, 332, 460, "Cormorant Garamond", 64, "#32503c", { fontStyle: "italic" }),
      line(180, 430, 420, 430, "#a78b62"),
      text("Sunday, 18 October 2026", 110, 465, 380, "Lato", 14, "#32503c", { charSpacing: 100 }),
      text("The Secret Garden · Bogor", 110, 500, 380, "Libre Baskerville", 13, "#6f7c5a"),
      text("Dinner under the stars", 140, 665, 320, "Cormorant Garamond", 20, "#32503c", { fontStyle: "italic" }),
    ],
  },
  {
    id: "classic-elegant",
    name: "Classic Elegant",
    category: "basic",
    description: "Ivory, champagne, serif, dan garis tipis.",
    palette: ["#fbf7ef", "#c5a46d", "#5d4438", "#ffffff", "#e8dcc4"],
    background: solid("#fbf7ef"),
    layers: [
      rect(28, 28, 544, 744, "", { stroke: "#c5a46d", strokeWidth: 1 }),
      rect(42, 42, 516, 716, "", { stroke: "#e8dcc4", strokeWidth: 1 }),
      text("TOGETHER WITH THEIR FAMILIES", 90, 92, 420, "Cinzel", 10, "#5d4438", { charSpacing: 300 }),
      text("Anindya", 70, 185, 460, "Playfair Display", 61, "#5d4438", { fontStyle: "italic" }),
      text("&", 260, 264, 80, "Cormorant Garamond", 34, "#c5a46d"),
      text("Pradipta", 70, 306, 460, "Playfair Display", 61, "#5d4438", { fontStyle: "italic" }),
      line(160, 405, 440, 405, "#c5a46d"),
      text("Saturday, 14 February 2026", 110, 438, 380, "Cormorant Garamond", 21, "#5d4438"),
      text("The Grand Chapel · Yogyakarta", 110, 480, 380, "Lato", 13, "#5d4438"),
      svg(ELEMENT_SVGS.frame, 238, 545, 124, "#c5a46d"),
      text("Your presence is our greatest gift", 120, 700, 360, "Cormorant Garamond", 16, "#5d4438", { fontStyle: "italic" }),
    ],
  },

];
const movieTemplates: StudioTemplate[] = [
  {
    id: "movie-premiere",
    name: "Movie Premiere",
    category: "movie",
    description: "Red carpet, cinematic black, burgundy, gold, dan marquee.",
    palette: ["#0b0b0d", "#4a0e18", "#d4af69", "#f4ead6", "#8e1d2c"],
    background: gradient("#08080a", "#28070d"),
    layers: [
      svg(ELEMENT_SVGS.spotlight, 130, -20, 340, "#f0d58a", 0.5),
      svg(ELEMENT_SVGS.marquee, 28, 70, 544, "#d4af69"),
      text("A KEFOO PICTURE", 150, 104, 300, "Cinzel", 11, "#f4ead6", { charSpacing: 350 }),
      text("A LOVE STORY", 90, 190, 420, "Cinzel", 22, "#d4af69", { charSpacing: 250 }),
      text("Premiere", 70, 240, 460, "Bodoni Moda", 76, "#f4ead6"),
      text("NIGHT", 170, 332, 260, "Cinzel", 24, "#d4af69", { charSpacing: 400 }),
      line(160, 390, 440, 390, "#d4af69"),
      text("Rania & Dirga", 100, 425, 400, "Playfair Display", 34, "#f4ead6", { fontStyle: "italic" }),
      text("Saturday, 07 March 2026", 120, 495, 360, "Montserrat", 13, "#d4af69", { charSpacing: 100 }),
      text("The Ritz Cinema · Jakarta", 120, 530, 360, "Lato", 13, "#f4ead6"),
      svg(ELEMENT_SVGS.filmStrip, 38, 620, 220, "#d4af69", 0.8),
      svg(ELEMENT_SVGS.star, 470, 620, 70, "#f4ead6"),
      text("A night to remember", 180, 690, 240, "Cormorant Garamond", 18, "#f4ead6", { fontStyle: "italic" }),
    ],
  },
  {
    id: "cinderella",
    name: "Cinderella",
    category: "movie",
    description: "Midnight blue, silver, bintang, dan fairytale elegance.",
    palette: ["#101a3a", "#25355f", "#c9d4ec", "#e9e1c8", "#8d9dc7"],
    background: gradient("#0b1028", "#24345e"),
    layers: [
      svg(ELEMENT_SVGS.moon, 410, 70, 130, "#e9e1c8", 0.8),
      svg(ELEMENT_SVGS.star, 80, 110, 38, "#c9d4ec", 0.8),
      svg(ELEMENT_SVGS.star, 500, 220, 24, "#e9e1c8", 0.7),
      svg(ELEMENT_SVGS.sparkle, 100, 520, 50, "#c9d4ec", 0.8),
      svg(ELEMENT_SVGS.castle, 220, 560, 170, "#c9d4ec", 0.55),
      text("A FAIRYTALE WEDDING", 120, 150, 360, "Cinzel", 11, "#c9d4ec", { charSpacing: 320 }),
      text("Cinderella", 60, 225, 480, "Parisienne", 82, "#e9e1c8"),
      text("&", 260, 350, 80, "Cormorant Garamond", 34, "#c9d4ec"),
      text("the glass slipper", 130, 400, 340, "Great Vibes", 30, "#c9d4ec"),
      line(180, 470, 420, 470, "#c9d4ec"),
      text("Ayu & Danu", 150, 500, 300, "Playfair Display", 32, "#e9e1c8", { fontStyle: "italic" }),
      text("12.12.2026 · Bali", 180, 550, 240, "Montserrat", 13, "#c9d4ec", { charSpacing: 150 }),
    ],
  },
  {
    id: "la-la-land",
    name: "La La Land",
    category: "movie",
    description: "Midnight sky, stars, gold, dan city lights.",
    palette: ["#0d1b33", "#1c3152", "#e0bf73", "#f6e9c7", "#8aa0c0"],
    background: gradient("#08142b", "#244267"),
    layers: [
      { kind: "circle", left: 420, top: 110, radius: 58, fill: "#f6e9c7", opacity: 0.9 },
      svg(ELEMENT_SVGS.star, 70, 100, 34, "#e0bf73"),
      svg(ELEMENT_SVGS.star, 495, 210, 26, "#e0bf73"),
      svg(ELEMENT_SVGS.sparkle, 110, 480, 45, "#f6e9c7", 0.9),
      text("HERE'S TO THE FOOLS", 120, 190, 360, "Montserrat", 11, "#e0bf73", { charSpacing: 280 }),
      text("La La", 80, 245, 440, "Great Vibes", 86, "#f6e9c7"),
      text("Land", 170, 360, 260, "Great Vibes", 86, "#f6e9c7"),
      line(180, 460, 420, 460, "#e0bf73"),
      text("Sekar & Langit", 140, 500, 320, "Cormorant Garamond", 34, "#f6e9c7", { fontStyle: "italic" }),
      text("A CITY OF STARS · 20.06.2026", 120, 560, 360, "Montserrat", 11, "#e0bf73", { charSpacing: 160 }),
      svg(ELEMENT_SVGS.spotlight, 150, 620, 300, "#e0bf73", 0.25),
      text("Jakarta, after sunset", 160, 710, 280, "Lato", 13, "#f6e9c7"),
    ],
  },
  {
    id: "vintage-cinema",
    name: "Vintage Cinema",
    category: "movie",
    description: "Retro poster, film-strip, dan nostalgic colors.",
    palette: ["#efe4cb", "#7a2e21", "#c9a36a", "#3a2b23", "#d7ba82"],
    background: solid("#efe4cb"),
    layers: [
      rect(26, 26, 548, 748, "", { stroke: "#7a2e21", strokeWidth: 2 }),
      svg(ELEMENT_SVGS.filmStrip, 40, 58, 520, "#7a2e21", 0.75),
      text("NOW SHOWING", 150, 125, 300, "Cinzel", 12, "#7a2e21", { charSpacing: 350 }),
      text("A TIMELESS", 120, 185, 360, "Bodoni Moda", 28, "#3a2b23", { charSpacing: 200 }),
      text("LOVE", 90, 225, 420, "Bodoni Moda", 80, "#7a2e21"),
      text("STORY", 170, 320, 260, "Bodoni Moda", 42, "#3a2b23", { charSpacing: 300 }),
      line(140, 400, 460, 400, "#7a2e21", 2),
      text("Laras & Sena", 150, 430, 300, "Cormorant Garamond", 30, "#3a2b23", { fontStyle: "italic" }),
      text("SATURDAY · 01.08.2026", 120, 490, 360, "Montserrat", 12, "#7a2e21", { charSpacing: 150 }),
      text("Taman Budaya · Surabaya", 120, 525, 360, "Libre Baskerville", 13, "#3a2b23"),
      svg(ELEMENT_SVGS.ticket, 140, 600, 320, "#7a2e21", 0.85),
      text("ADMIT TWO · DINNER & DANCE", 120, 650, 360, "Cinzel", 10, "#7a2e21", { charSpacing: 100 }),
    ],
  },
  {
    id: "enchanted-fairytale",
    name: "Enchanted Fairytale",
    category: "movie",
    description: "Magical garden, moonlight, florals, dan fantasy ornaments.",
    palette: ["#14251e", "#47634d", "#d8cfb0", "#f5eed8", "#9c805b"],
    background: gradient("#0e1b16", "#3e5b48"),
    layers: [
      svg(ELEMENT_SVGS.moon, 400, 60, 120, "#f5eed8", 0.85),
      svg(ELEMENT_SVGS.star, 90, 90, 36, "#d8cfb0"),
      svg(ELEMENT_SVGS.star, 505, 190, 22, "#d8cfb0"),
      svg(ELEMENT_SVGS.floralCorner, 18, 20, 130, "#9c805b", 0.7),
      svg(ELEMENT_SVGS.floralCorner, 452, 650, 130, "#9c805b", 0.7),
      svg(ELEMENT_SVGS.sparkle, 110, 470, 44, "#f5eed8", 0.85),
      text("AN ENCHANTED EVENING", 120, 180, 360, "Cinzel", 11, "#d8cfb0", { charSpacing: 280 }),
      text("Fairytale", 50, 250, 500, "Great Vibes", 86, "#f5eed8"),
      text("Nirmala", 80, 390, 440, "Cormorant Garamond", 53, "#f5eed8", { fontStyle: "italic" }),
      text("&", 260, 460, 80, "Cinzel", 30, "#d8cfb0"),
      text("Wisnu", 80, 500, 440, "Cormorant Garamond", 53, "#f5eed8", { fontStyle: "italic" }),
      text("MOONLIGHT · MIDNIGHT · MAGIC", 110, 615, 380, "Montserrat", 10, "#d8cfb0", { charSpacing: 220 }),
      text("The Enchanted Garden · Ubud", 120, 675, 360, "Lato", 13, "#f5eed8"),
    ],
  },

];



export const STUDIO_TEMPLATES: StudioTemplate[] = [
  ...basicTemplates,
  ...movieTemplates,
];

export const STUDIO_TEMPLATE_CATEGORIES = [
  { id: "basic", label: "Basic" },
  { id: "movie", label: "Movie Inspired" },
] as const;

export function templateById(id: string): StudioTemplate | undefined {
  return STUDIO_TEMPLATES.find((template) => template.id === id);
}
