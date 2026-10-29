import type { StudioFont } from "./types";

export const STUDIO_FONTS: StudioFont[] = [
  { name: "Playfair Display", category: "Serif" },
  { name: "Cormorant Garamond", category: "Serif" },
  { name: "Bodoni Moda", category: "Serif" },
  { name: "DM Serif Display", category: "Serif" },
  { name: "Libre Baskerville", category: "Serif" },
  { name: "Cinzel", category: "Serif" },
  { name: "Prata", category: "Serif" },
  { name: "Great Vibes", category: "Script" },
  { name: "Allura", category: "Script" },
  { name: "Alex Brush", category: "Script" },
  { name: "Parisienne", category: "Script" },
  { name: "Pinyon Script", category: "Script" },
  { name: "Montserrat", category: "Sans" },
  { name: "Poppins", category: "Sans" },
  { name: "Lato", category: "Sans" },
  { name: "Raleway", category: "Sans" },
  { name: "Josefin Sans", category: "Sans" },
  { name: "DM Sans", category: "Sans" },
  { name: "Playfair Display SC", category: "Display" },
  { name: "Tenor Sans", category: "Sans" },
];

const families = [
  "Playfair+Display:wght@400;600;700",
  "Cormorant+Garamond:wght@400;600;700",
  "Bodoni+Moda:wght@400;600;700",
  "DM+Serif+Display",
  "Libre+Baskerville:wght@400;700",
  "Cinzel:wght@400;600;700",
  "Prata",
  "Great+Vibes",
  "Allura",
  "Alex+Brush",
  "Parisienne",
  "Pinyon+Script",
  "Montserrat:wght@400;600;700",
  "Poppins:wght@400;600;700",
  "Lato:wght@400;700",
  "Raleway:wght@400;600;700",
  "Josefin+Sans:wght@400;600;700",
  "DM+Sans:wght@400;600;700",
  "Playfair+Display+SC:wght@400;700",
  "Tenor+Sans",
];

export const STUDIO_FONT_STYLESHEET = `https://fonts.googleapis.com/css2?${families
  .map((family) => `family=${family}`)
  .join("&")}&display=swap`;

export const DEFAULT_FONT = "Playfair Display";
