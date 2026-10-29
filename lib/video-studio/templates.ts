import type {
  AnimationPreset,
  DecorativeAsset,
  InvitationData,
  InvitationElement,
  InvitationTheme,
  PhotoElement,
  Scene,
  TemplateMotion,
  TemplateTypography,
  TextElement,
  TypeToken,
  VideoTemplate,
  VideoTemplateCategory,
} from "./types";

const DEMO_DATA: InvitationData = {
  brideName: "Alya",
  groomName: "Raka",
  weddingDate: "12 Desember 2026",
  akadDate: "12 Desember 2026",
  akadTime: "08.00 WIB",
  receptionDate: "12 Desember 2026",
  receptionTime: "11.00 WIB",
  venueName: "The Garden House",
  venueAddress: "Jl. Melati No. 12, Bandung · Demo venue",
  openingMessage:
    "Dengan penuh cinta, kami mengundang Anda untuk merayakan awal perjalanan kami.",
  rsvpContact: "+62 812-0000-0000",
  loveStory:
    "Kami bertemu di sebuah acara buku, tumbuh bersama lewat percakapan panjang, dan memilih untuk melangkah bersama selamanya.",
  parentsBride: "Bapak Hendra & Ibu Lestari",
  parentsGroom: "Bapak Surya & Ibu Wulan",
  hashtag: "#AlyaRakaForever",
};

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

function token(
  fontFamily: string,
  fontSize: number,
  color: string,
  extra: Partial<TypeToken> = {},
): TypeToken {
  return {
    fontFamily,
    fontSize,
    color,
    fontWeight: 400,
    italic: false,
    letterSpacing: 0,
    lineHeight: 1.2,
    ...extra,
  };
}

function scene(
  id: string,
  title: string,
  duration: number,
  transition: Scene["transition"],
): Scene {
  return {
    id,
    title,
    duration,
    transition,
    background: { kind: "theme" },
  };
}

function typeText(
  sceneId: string,
  binding: keyof InvitationData,
  x: number,
  y: number,
  width: number,
  type: TypeToken,
  extra: Partial<TextElement> = {},
): InvitationElement {
  return {
    kind: "text",
    id: nextId("text"),
    sceneId,
    binding,
    x,
    y,
    width,
    height: Math.max(34, type.fontSize * 1.4),
    rotation: 0,
    opacity: 1,
    enter: "fade",
    exit: "fade",
    delay: 0.1,
    layer: 20,
    fontFamily: type.fontFamily,
    fontSize: type.fontSize,
    fontWeight: type.fontWeight,
    italic: type.italic,
    align: "center",
    color: type.color,
    lineHeight: type.lineHeight,
    letterSpacing: type.letterSpacing,
    ...extra,
  };
}

function custom(
  sceneId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  type: TypeToken,
  extra: Partial<TextElement> = {},
): InvitationElement {
  return {
    kind: "text",
    id: nextId("text"),
    sceneId,
    text,
    x,
    y,
    width,
    height: Math.max(28, type.fontSize * 1.35),
    rotation: 0,
    opacity: 1,
    enter: "fade",
    exit: "fade",
    delay: 0.1,
    layer: 20,
    fontFamily: type.fontFamily,
    fontSize: type.fontSize,
    fontWeight: type.fontWeight,
    italic: type.italic,
    align: "center",
    color: type.color,
    lineHeight: type.lineHeight,
    letterSpacing: type.letterSpacing,
    ...extra,
  };
}

function photo(
  sceneId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  frameColor: string,
  radius: number,
  enter: AnimationPreset,
  extra: Partial<PhotoElement> = {},
): InvitationElement {
  return {
    kind: "photo",
    id: nextId("photo"),
    sceneId,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    enter,
    exit: "fade",
    delay: 0.3,
    layer: 8,
    fit: "cover",
    cropX: 0.5,
    cropY: 0.5,
    zoom: 1,
    radius,
    frameColor,
    frameWidth: 1.5,
    ...extra,
  };
}

function decor(
  sceneId: string,
  asset: DecorativeAsset,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  secondaryColor: string,
  enter: AnimationPreset = "fade",
  opacity = 1,
  extra: Partial<InvitationElement & { kind: "decor" }> = {},
): InvitationElement {
  return {
    kind: "decor",
    id: nextId("decor"),
    sceneId,
    asset,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity,
    enter,
    exit: "fade",
    delay: 0,
    layer: 3,
    color,
    secondaryColor,
    ...extra,
  };
}

function typography(
  values: Omit<TemplateTypography, "names" | "headline" | "supporting" | "detail" | "rsvp"> & Partial<TemplateTypography>,
): TemplateTypography {
  return {
    names: values.names!,
    headline: values.headline!,
    supporting: values.supporting!,
    detail: values.detail!,
    rsvp: values.rsvp!,
  };
}

const botanicalTheme: InvitationTheme = {
  paper: "#f1eee3",
  ink: "#30493b",
  accent: "#7e9473",
  accentSoft: "#dbe7d3",
  secondary: "#c98f9a",
  muted: "#74836d",
  displayFont: "Cormorant Garamond",
  scriptFont: "Great Vibes",
  bodyFont: "Montserrat",
  nameFont: "Great Vibes",
  headlineFont: "Cormorant Garamond",
  supportFont: "Cormorant Garamond",
  detailFont: "Montserrat",
  ornament: "botanical",
  photoPlaceholder: ["#aebfa2", "#e9e3d1"],
  typography: typography({
    names: token("Great Vibes", 64, "#30493b", { lineHeight: 0.95 }),
    headline: token("Cormorant Garamond", 12, "#7e9473", {
      fontWeight: 600,
      letterSpacing: 3.4,
      lineHeight: 1.1,
    }),
    supporting: token("Cormorant Garamond", 19, "#556a59", {
      italic: true,
      lineHeight: 1.4,
    }),
    detail: token("Montserrat", 10, "#74836d", {
      letterSpacing: 1.7,
      lineHeight: 1.5,
    }),
    rsvp: token("Montserrat", 11, "#30493b", { letterSpacing: 0.7 }),
  }),
};

const pastelTheme: InvitationTheme = {
  paper: "#fcf1ee",
  ink: "#65424b",
  accent: "#c78f99",
  accentSoft: "#f0d9da",
  secondary: "#8f3f51",
  muted: "#9d7d82",
  displayFont: "Parisienne",
  scriptFont: "Parisienne",
  bodyFont: "Lato",
  nameFont: "Parisienne",
  headlineFont: "Libre Baskerville",
  supportFont: "Cormorant Garamond",
  detailFont: "Lato",
  ornament: "pastel",
  photoPlaceholder: ["#e1b7bc", "#f4e6df"],
  typography: typography({
    names: token("Parisienne", 62, "#65424b", { lineHeight: 0.9 }),
    headline: token("Libre Baskerville", 9, "#8f3f51", {
      fontWeight: 700,
      letterSpacing: 2.7,
      lineHeight: 1.3,
    }),
    supporting: token("Cormorant Garamond", 18, "#7d5961", {
      italic: true,
      lineHeight: 1.45,
    }),
    detail: token("Lato", 10, "#9d7d82", {
      letterSpacing: 1.2,
      lineHeight: 1.55,
    }),
    rsvp: token("Lato", 11, "#65424b", { letterSpacing: 0.5 }),
  }),
};

const modernTheme: InvitationTheme = {
  paper: "#f4f0e8",
  ink: "#242522",
  accent: "#9d8661",
  accentSoft: "#e7ddce",
  secondary: "#a98d87",
  muted: "#80796e",
  displayFont: "DM Serif Display",
  scriptFont: "DM Sans",
  bodyFont: "DM Sans",
  nameFont: "DM Serif Display",
  headlineFont: "DM Sans",
  supportFont: "DM Sans",
  detailFont: "DM Sans",
  ornament: "minimal",
  photoPlaceholder: ["#b7a68d", "#eee8dc"],
  typography: typography({
    names: token("DM Serif Display", 58, "#242522", { lineHeight: 1.02 }),
    headline: token("DM Sans", 9, "#9d8661", {
      fontWeight: 600,
      letterSpacing: 4.1,
      lineHeight: 1.2,
    }),
    supporting: token("DM Sans", 14, "#5f5a51", { lineHeight: 1.6 }),
    detail: token("DM Sans", 9, "#80796e", { letterSpacing: 1.1 }),
    rsvp: token("DM Sans", 11, "#242522", { letterSpacing: 0.3 }),
  }),
};

const luxuryTheme: InvitationTheme = {
  paper: "#260a11",
  ink: "#f4e7ce",
  accent: "#c6a05c",
  accentSoft: "#5e202e",
  secondary: "#e0c689",
  muted: "#bba888",
  displayFont: "Bodoni Moda",
  scriptFont: "Cormorant Garamond",
  bodyFont: "Montserrat",
  nameFont: "Bodoni Moda",
  headlineFont: "Cinzel",
  supportFont: "Cormorant Garamond",
  detailFont: "Montserrat",
  ornament: "luxury",
  photoPlaceholder: ["#5b1c2a", "#c7a05b"],
  typography: typography({
    names: token("Bodoni Moda", 64, "#f4e7ce", { lineHeight: 1.02 }),
    headline: token("Cinzel", 10, "#c6a05c", {
      fontWeight: 600,
      letterSpacing: 3.6,
      lineHeight: 1.2,
    }),
    supporting: token("Cormorant Garamond", 19, "#dfd1b7", {
      italic: true,
      lineHeight: 1.4,
    }),
    detail: token("Montserrat", 9, "#bba888", {
      letterSpacing: 2.1,
      lineHeight: 1.5,
    }),
    rsvp: token("Montserrat", 10, "#e0c689", { letterSpacing: 1.2 }),
  }),
};

const classicTheme: InvitationTheme = {
  paper: "#fbf6ec",
  ink: "#4e3a2f",
  accent: "#b99562",
  accentSoft: "#eadbc5",
  secondary: "#8d6c4b",
  muted: "#897768",
  displayFont: "Playfair Display",
  scriptFont: "Pinyon Script",
  bodyFont: "Libre Baskerville",
  nameFont: "Pinyon Script",
  headlineFont: "Cinzel",
  supportFont: "Cormorant Garamond",
  detailFont: "Libre Baskerville",
  ornament: "classic",
  photoPlaceholder: ["#cbb18d", "#f2e7d4"],
  typography: typography({
    names: token("Pinyon Script", 60, "#4e3a2f", { lineHeight: 0.92 }),
    headline: token("Cinzel", 9, "#8d6c4b", {
      fontWeight: 600,
      letterSpacing: 3.1,
      lineHeight: 1.2,
    }),
    supporting: token("Cormorant Garamond", 17, "#6a5546", {
      italic: true,
      lineHeight: 1.45,
    }),
    detail: token("Libre Baskerville", 9, "#897768", {
      letterSpacing: 0.8,
      lineHeight: 1.6,
    }),
    rsvp: token("Libre Baskerville", 10, "#4e3a2f", { letterSpacing: 0.4 }),
  }),
};



const premiereTheme: InvitationTheme = {
  paper: "#09090b",
  ink: "#f7ebd1",
  accent: "#d4af69",
  accentSoft: "#4a0e18",
  secondary: "#b28a4c",
  muted: "#c7b797",
  displayFont: "Playfair Display",
  scriptFont: "Cinzel",
  bodyFont: "Montserrat",
  nameFont: "Playfair Display",
  headlineFont: "Cinzel",
  supportFont: "Cormorant Garamond",
  detailFont: "Montserrat",
  ornament: "premiere",
  photoPlaceholder: ["#5b1b27", "#c9a35e"],
  typography: typography({
    names: token("Playfair Display", 64, "#f7ebd1", { lineHeight: 0.98 }),
    headline: token("Cinzel", 10, "#d4af69", {
      fontWeight: 600,
      letterSpacing: 3.8,
      lineHeight: 1.2,
    }),
    supporting: token("Cormorant Garamond", 18, "#d7c8ac", {
      italic: true,
      lineHeight: 1.4,
    }),
    detail: token("Montserrat", 9, "#c7b797", { letterSpacing: 1.8 }),
    rsvp: token("Montserrat", 10, "#f7ebd1", { letterSpacing: 1 }),
  }),
};

const cinderellaTheme: InvitationTheme = {
  paper: "#0b1028",
  ink: "#e9e1c8",
  accent: "#c9d4ec",
  accentSoft: "#25355f",
  secondary: "#8d9dc7",
  muted: "#b5c1db",
  displayFont: "Allura",
  scriptFont: "Allura",
  bodyFont: "Montserrat",
  nameFont: "Allura",
  headlineFont: "Cinzel",
  supportFont: "Cormorant Garamond",
  detailFont: "Montserrat",
  ornament: "cinderella",
  photoPlaceholder: ["#273862", "#d6d0b8"],
  typography: typography({
    names: token("Allura", 72, "#e9e1c8", { lineHeight: 0.9 }),
    headline: token("Cinzel", 10, "#c9d4ec", {
      fontWeight: 600,
      letterSpacing: 3.5,
      lineHeight: 1.2,
    }),
    supporting: token("Cormorant Garamond", 18, "#d4dced", {
      italic: true,
      lineHeight: 1.45,
    }),
    detail: token("Montserrat", 9, "#b5c1db", { letterSpacing: 1.8 }),
    rsvp: token("Montserrat", 10, "#e9e1c8", { letterSpacing: 0.8 }),
  }),
};


const lalalandTheme: InvitationTheme = {
  paper: "#08142b",
  ink: "#f6e9c7",
  accent: "#e0bf73",
  accentSoft: "#1c3152",
  secondary: "#8aa0c0",
  muted: "#b9c7db",
  displayFont: "Alex Brush",
  scriptFont: "Alex Brush",
  bodyFont: "Lato",
  nameFont: "Alex Brush",
  headlineFont: "Montserrat",
  supportFont: "Playfair Display",
  detailFont: "Lato",
  ornament: "lalaland",
  photoPlaceholder: ["#203a60", "#f2d992"],
  typography: typography({
    names: token("Alex Brush", 70, "#f6e9c7", { lineHeight: 0.9 }),
    headline: token("Montserrat", 10, "#e0bf73", {
      fontWeight: 600,
      letterSpacing: 3.4,
      lineHeight: 1.25,
    }),
    supporting: token("Playfair Display", 19, "#dbe5f2", {
      italic: true,
      lineHeight: 1.4,
    }),
    detail: token("Lato", 9, "#b9c7db", { letterSpacing: 1.5 }),
    rsvp: token("Lato", 11, "#f6e9c7", { letterSpacing: 0.6 }),
  }),
};

const vintageTheme: InvitationTheme = {
  paper: "#efe4cb",
  ink: "#3a2b23",
  accent: "#7a2e21",
  accentSoft: "#d7ba82",
  secondary: "#c9a36a",
  muted: "#876b4c",
  displayFont: "Prata",
  scriptFont: "Prata",
  bodyFont: "Libre Baskerville",
  nameFont: "Prata",
  headlineFont: "Cinzel",
  supportFont: "Libre Baskerville",
  detailFont: "Montserrat",
  ornament: "vintage",
  photoPlaceholder: ["#b58b5c", "#efe4cb"],
  typography: typography({
    names: token("Prata", 50, "#3a2b23", { lineHeight: 1.02 }),
    headline: token("Cinzel", 11, "#7a2e21", {
      fontWeight: 600,
      letterSpacing: 3.2,
      lineHeight: 1.25,
    }),
    supporting: token("Libre Baskerville", 15, "#5b4433", {
      italic: true,
      lineHeight: 1.55,
    }),
    detail: token("Montserrat", 9, "#876b4c", { letterSpacing: 1.2 }),
    rsvp: token("Libre Baskerville", 10, "#3a2b23", { letterSpacing: 0.3 }),
  }),
};

const enchantedTheme: InvitationTheme = {
  paper: "#0e1b16",
  ink: "#f5eed8",
  accent: "#d8cfb0",
  accentSoft: "#3e5b48",
  secondary: "#9c805b",
  muted: "#b6c3ad",
  displayFont: "Great Vibes",
  scriptFont: "Great Vibes",
  bodyFont: "Lato",
  nameFont: "Great Vibes",
  headlineFont: "Cinzel",
  supportFont: "Playfair Display",
  detailFont: "Lato",
  ornament: "enchanted",
  photoPlaceholder: ["#365040", "#e1dbc3"],
  typography: typography({
    names: token("Great Vibes", 68, "#f5eed8", { lineHeight: 0.95 }),
    headline: token("Cinzel", 10, "#d8cfb0", {
      fontWeight: 600,
      letterSpacing: 3.3,
      lineHeight: 1.2,
    }),
    supporting: token("Playfair Display", 19, "#dce3cd", {
      italic: true,
      lineHeight: 1.4,
    }),
    detail: token("Lato", 9, "#b6c3ad", { letterSpacing: 1.7 }),
    rsvp: token("Lato", 10, "#f5eed8", { letterSpacing: 0.7 }),
  }),
};

function buildBotanical(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "watercolor-spray", -35, 140, 250, 390, theme.accent, theme.secondary, "slide-up", 0.95),
    decor(opening, "watercolor-rose", 398, 220, 150, 145, theme.secondary, theme.accent, "zoom", 0.9),
    decor(opening, "botanical-arch", 22, 52, 496, 856, theme.accent, theme.accentSoft, "fade", 0.9),
    decor(opening, "butterfly-script", 376, 112, 80, 58, theme.secondary, theme.accent, "slide-up", 0.9),
    decor(opening, "pressed-flower", 52, 682, 78, 112, theme.accent, theme.secondary, "fade", 0.8),
    custom(opening, "A GARDEN WEDDING", 95, 210, 350, t.headline, { align: "center", delay: 0.15 }),
    typeText(opening, "brideName", 48, 292, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 395, 40, t.names, { align: "center", fontSize: 30, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(opening, "groomName", 48, 432, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.1 }),
    custom(opening, "SAVE THE DATE", 130, 610, 280, t.headline, { align: "center", enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    typeText(opening, "weddingDate", 100, 635, 340, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(opening, "openingMessage", 92, 690, 356, t.detail, { align: "center", fontSize: 11, lineHeight: 1.55, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(couple, "watercolor-spray", 360, 230, 220, 350, theme.accent, theme.secondary, "slide-up", 0.85),
    decor(couple, "watercolor-rose", 55, 260, 135, 130, theme.secondary, theme.accent, "zoom", 0.9),
    photo(couple, 110, 268, 320, 360, theme.accent, 160, "zoom", { frameWidth: 1.5, delay: 0.25 }),
    decor(couple, "pressed-flower", 420, 610, 75, 110, theme.secondary, theme.accent, "fade", 0.8),
    custom(couple, "OUR STORY", 95, 675, 350, t.headline, { align: "center", delay: 0.7 }),
    typeText(couple, "openingMessage", 95, 705, 350, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.85 }),
    typeText(couple, "loveStory", 95, 790, 350, t.detail, { align: "center", fontSize: 10, lineHeight: 1.65, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),

    decor(details, "botanical-arch", 28, 35, 484, 890, theme.accent, theme.accentSoft, "fade", 0.8),
    decor(details, "watercolor-spray", 350, 640, 220, 310, theme.accent, theme.secondary, "slide-up", 0.8),
    custom(details, "THE GARDEN CELEBRATION", 80, 150, 380, t.headline, { align: "center", delay: 0.15 }),
    custom(details, "Akad Nikah", 70, 245, 400, t.supporting, { align: "center", fontSize: 30, italic: false, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.35 }),
    typeText(details, "akadDate", 70, 300, 400, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.5 }),
    typeText(details, "akadTime", 70, 325, 400, t.detail, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    custom(details, "Resepsi", 70, 425, 400, t.supporting, { align: "center", fontSize: 30, italic: false, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.8 }),
    typeText(details, "receptionDate", 70, 480, 400, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(details, "receptionTime", 70, 505, 400, t.detail, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    custom(details, "AT THE GARDEN", 95, 645, 350, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 674, 390, t.supporting, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 720, 370, t.detail, { align: "center", fontSize: 10, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "Kami menantikan kehadiran Anda", 90, 825, 360, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "watercolor-spray", -35, 45, 230, 330, theme.accent, theme.secondary, "slide-up", 0.9),
    decor(closing, "watercolor-spray", 350, 690, 230, 330, theme.accent, theme.secondary, "slide-up", 0.9),
    decor(closing, "botanical-arch", 28, 35, 484, 890, theme.accent, theme.accentSoft, "fade", 0.85),
    custom(closing, "WITH LOVE", 120, 210, 300, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 50, 265, 440, t.names, { align: "center", fontSize: 54, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 350, 40, t.names, { align: "center", fontSize: 24, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 50, 380, 440, t.names, { align: "center", fontSize: 54, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.7 }),
    custom(closing, "Together with their families", 80, 510, 380, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 540, 430, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 565, 430, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 680, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 705, 340, t.rsvp, { align: "center", fontSize: 12, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 745, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 900, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}


function buildPastel(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "lace-scallop", 15, 25, 510, 95, theme.accent, theme.accentSoft, "fade", 0.8),
    decor(opening, "lace-scallop", 15, 845, 510, 90, theme.accent, theme.accentSoft, "fade", 0.8),
    decor(opening, "blush-envelope", 72, 205, 396, 500, theme.secondary, theme.accentSoft, "slide-up", 0.9),
    decor(opening, "silk-ribbon", -20, 470, 580, 140, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "wax-seal", 242, 720, 56, 56, theme.secondary, theme.accent, "zoom", 0.9),
    custom(opening, "A ROMANTIC CELEBRATION", 110, 170, 320, t.headline, { align: "center", delay: 0.2 }),
    typeText(opening, "brideName", 55, 285, 430, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.5 }),
    custom(opening, "&", 250, 390, 40, t.names, { align: "center", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 55, 425, 430, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.1 }),
    custom(opening, "THE WEDDING DAY", 130, 590, 280, t.headline, { align: "center", delay: 1.3 }),
    typeText(opening, "weddingDate", 100, 615, 340, t.supporting, { align: "center", fontSize: 18, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    typeText(opening, "openingMessage", 115, 675, 310, t.supporting, { align: "center", fontSize: 15, lineHeight: 1.5, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(couple, "lace-scallop", 20, 200, 500, 100, theme.accent, theme.accentSoft, "fade", 0.75),
    decor(couple, "blush-envelope", 75, 275, 390, 400, theme.secondary, theme.accentSoft, "slide-up", 0.9),
    photo(couple, 95, 295, 350, 340, theme.secondary, 6, "fade", { frameWidth: 2, delay: 0.3 }),
    decor(couple, "silk-ribbon", 0, 615, 540, 120, theme.accent, theme.secondary, "fade", 0.85),
    custom(couple, "A LETTER FOR YOU", 120, 665, 300, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 105, 695, 330, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(couple, "loveStory", 105, 780, 330, t.detail, { align: "center", fontSize: 10, lineHeight: 1.65, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),

    decor(details, "lace-scallop", 20, 35, 500, 85, theme.accent, theme.accentSoft, "fade", 0.75),
    decor(details, "silk-ribbon", 10, 870, 520, 90, theme.accent, theme.secondary, "fade", 0.8),
    custom(details, "THE CELEBRATION", 100, 160, 340, t.headline, { align: "center", delay: 0.15 }),
    custom(details, "Akad", 55, 245, 210, t.supporting, { align: "center", fontSize: 29, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.35 }),
    typeText(details, "akadDate", 45, 310, 230, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.5 }),
    typeText(details, "akadTime", 45, 340, 230, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    custom(details, "Reception", 275, 245, 210, t.supporting, { align: "center", fontSize: 29, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.8 }),
    typeText(details, "receptionDate", 275, 310, 230, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(details, "receptionTime", 275, 340, 230, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    decor(details, "wax-seal", 250, 445, 42, 42, theme.secondary, theme.accent, "fade", 0.9),
    custom(details, "WITH JOY AT", 120, 565, 300, t.headline, { align: "center", delay: 1.15 }),
    typeText(details, "venueName", 75, 595, 390, t.supporting, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.25 }),
    typeText(details, "venueAddress", 90, 640, 360, t.detail, { align: "center", fontSize: 10, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    custom(details, "Your presence would be a gift", 100, 790, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.5 }),

    decor(closing, "silk-ribbon", -20, 30, 580, 130, theme.accent, theme.secondary, "fade", 0.8),
    decor(closing, "lace-scallop", 20, 840, 500, 90, theme.accent, theme.accentSoft, "fade", 0.75),
    decor(closing, "wax-seal", 242, 685, 56, 56, theme.secondary, theme.accent, "zoom", 0.9),
    custom(closing, "WITH LOVE", 120, 210, 300, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 50, 270, 440, t.names, { align: "center", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 355, 40, t.names, { align: "center", fontSize: 24, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 50, 390, 440, t.names, { align: "center", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.7 }),
    custom(closing, "Together with", 100, 515, 340, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 545, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 570, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 755, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 780, 340, t.rsvp, { align: "center", fontSize: 12, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 810, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 905, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}


function buildModern(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "modern-card", 34, 130, 472, 640, theme.accent, theme.accentSoft, "fade", 0.7),
    decor(opening, "editorial-arch", 330, 165, 180, 360, theme.accentSoft, theme.accent, "fade", 0.55),
    decor(opening, "thin-rule", 64, 248, 412, 1, theme.ink, theme.accent, "slide-left", 0.9),
    custom(opening, "THE WEDDING OF", 64, 185, 410, t.headline, { align: "left", delay: 0.15 }),
    typeText(opening, "brideName", 64, 275, 420, t.names, { align: "left", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(opening, "&", 64, 365, 80, t.names, { align: "left", fontSize: 31, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.7 }),
    typeText(opening, "groomName", 64, 405, 420, t.names, { align: "left", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.9 }),
    custom(opening, "SAVE THE DATE", 64, 585, 410, t.headline, { align: "left", delay: 1.15 }),
    typeText(opening, "weddingDate", 64, 610, 410, t.supporting, { align: "left", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.25 }),
    typeText(opening, "openingMessage", 64, 665, 380, t.supporting, { align: "left", fontSize: 13, lineHeight: 1.55, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(opening, "KEFOO STUDIO · DEMO", 64, 850, 410, t.detail, { align: "left", delay: 1.7 }),

    decor(couple, "thin-rule", 292, 225, 1, 580, theme.ink, theme.accent, "fade", 0.8),
    custom(couple, "A SHARED LIFE", 54, 190, 225, t.headline, { align: "left", delay: 0.2 }),
    typeText(couple, "openingMessage", 54, 235, 220, t.supporting, { align: "left", fontSize: 13, lineHeight: 1.55, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.45 }),
    photo(couple, 320, 260, 170, 230, theme.accent, 0, "zoom", { frameWidth: 1, delay: 0.3 }),
    typeText(couple, "loveStory", 54, 520, 220, t.detail, { align: "left", fontSize: 10, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    custom(couple, "OUR STORY", 54, 765, 220, t.headline, { align: "left", delay: 1.15 }),
    custom(couple, "01 — THE BEGINNING", 54, 815, 220, t.detail, { align: "left", delay: 1.3 }),

    decor(details, "modern-card", 45, 145, 450, 610, theme.accent, theme.accentSoft, "fade", 0.5),
    decor(details, "thin-rule", 68, 225, 404, 1, theme.ink, theme.accent, "slide-left", 0.9),
    custom(details, "THE CELEBRATION", 68, 175, 400, t.headline, { align: "left", delay: 0.15 }),
    custom(details, "AKAD", 68, 250, 180, t.detail, { align: "left", fontWeight: 600, delay: 0.35 }),
    typeText(details, "akadDate", 68, 275, 180, t.supporting, { align: "left", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.45 }),
    typeText(details, "akadTime", 68, 305, 180, t.detail, { align: "left", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.55 }),
    custom(details, "RECEPTION", 300, 250, 180, t.detail, { align: "left", fontWeight: 600, delay: 0.7 }),
    typeText(details, "receptionDate", 300, 275, 180, t.supporting, { align: "left", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.8 }),
    typeText(details, "receptionTime", 300, 305, 180, t.detail, { align: "left", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    decor(details, "thin-rule", 68, 380, 404, 1, theme.ink, theme.accent, "fade", 0.8),
    custom(details, "THE VENUE", 68, 425, 400, t.headline, { align: "left", delay: 1.05 }),
    typeText(details, "venueName", 68, 455, 400, t.supporting, { align: "left", fontSize: 23, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    typeText(details, "venueAddress", 68, 495, 400, t.detail, { align: "left", fontSize: 10, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.25 }),
    custom(details, "An afternoon of good food, music, and the people we love.", 68, 650, 380, t.supporting, { align: "left", fontSize: 13, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),

    decor(closing, "thin-rule", 54, 220, 100, 1, theme.ink, theme.accent, "slide-left", 0.9),
    custom(closing, "WITH LOVE", 54, 245, 420, t.headline, { align: "left", delay: 0.2 }),
    typeText(closing, "brideName", 54, 300, 430, t.names, { align: "left", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(closing, "&", 54, 385, 80, t.names, { align: "left", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.65 }),
    typeText(closing, "groomName", 54, 420, 430, t.names, { align: "left", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.8 }),
    custom(closing, "TOGETHER WITH", 54, 540, 400, t.headline, { align: "left", delay: 1 }),
    typeText(closing, "parentsBride", 54, 570, 400, t.detail, { align: "left", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    typeText(closing, "parentsGroom", 54, 598, 400, t.detail, { align: "left", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),
    decor(closing, "thin-rule", 54, 665, 400, 1, theme.ink, theme.accent, "fade", 0.8),
    custom(closing, "RSVP", 54, 700, 400, t.headline, { align: "left", delay: 1.35 }),
    typeText(closing, "rsvpContact", 54, 725, 400, t.rsvp, { align: "left", fontSize: 12, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 54, 760, 400, t.detail, { align: "left", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 54, 900, 400, t.detail, { align: "left", delay: 1.8 }),
  ];
}


function buildLuxury(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "spotlight-beam", 85, -10, 370, 760, theme.secondary, theme.accent, "fade", 0.35),
    decor(opening, "velvet-curtain", -35, 0, 610, 960, theme.accentSoft, theme.accent, "slide-left", 0.8),
    decor(opening, "deco-fan", 175, 115, 190, 130, theme.accent, theme.secondary, "zoom", 0.9),
    decor(opening, "gold-rule", 105, 250, 330, 1, theme.accent, theme.secondary, "slide-left", 0.85),
    custom(opening, "THE WEDDING OF", 100, 275, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(opening, "brideName", 48, 330, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.5 }),
    custom(opening, "&", 250, 425, 40, t.names, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(opening, "groomName", 48, 460, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.1 }),
    decor(opening, "gold-rule", 105, 570, 330, 1, theme.accent, theme.secondary, "slide-left", 0.85),
    custom(opening, "A BLACK-TIE CELEBRATION", 100, 600, 340, t.headline, { align: "center", delay: 1.35 }),
    typeText(opening, "weddingDate", 100, 625, 340, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(opening, "openingMessage", 100, 690, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.6 }),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 900, 340, t.detail, { align: "center", delay: 1.85 }),

    decor(couple, "spotlight-beam", 60, 120, 420, 700, theme.secondary, theme.accent, "fade", 0.22),
    decor(couple, "gold-rule", 45, 210, 450, 1, theme.accent, theme.secondary, "slide-left", 0.9),
    photo(couple, 50, 235, 440, 390, theme.accent, 0, "zoom", { frameWidth: 2, delay: 0.3 }),
    decor(couple, "gold-rule", 45, 655, 450, 1, theme.accent, theme.secondary, "slide-right", 0.9),
    custom(couple, "A CINEMATIC LOVE", 85, 690, 370, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 90, 720, 360, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 95, 800, 350, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "velvet-curtain", -25, 0, 590, 960, theme.accentSoft, theme.accent, "fade", 0.55),
    decor(details, "deco-fan", 190, 70, 160, 100, theme.accent, theme.secondary, "zoom", 0.85),
    custom(details, "THE EVENING", 100, 205, 340, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "Akad", 55, 280, 205, t.supporting, { align: "center", fontSize: 30, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.4 }),
    typeText(details, "akadDate", 50, 345, 215, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.55 }),
    typeText(details, "akadTime", 50, 375, 215, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.65 }),
    custom(details, "Reception", 280, 280, 205, t.supporting, { align: "center", fontSize: 30, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.85 }),
    typeText(details, "receptionDate", 275, 345, 220, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    typeText(details, "receptionTime", 275, 375, 220, t.detail, { align: "center", fontSize: 10, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    decor(details, "gold-rule", 160, 490, 220, 1, theme.accent, theme.secondary, "fade", 0.9),
    custom(details, "THE VENUE", 100, 560, 340, t.headline, { align: "center", delay: 1.25 }),
    typeText(details, "venueName", 65, 590, 410, t.supporting, { align: "center", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    typeText(details, "venueAddress", 85, 635, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    custom(details, "An evening of celebration", 100, 790, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.6 }),

    decor(closing, "velvet-curtain", -35, 0, 610, 960, theme.accentSoft, theme.accent, "slide-right", 0.65),
    decor(closing, "classic-seal", 240, 700, 60, 60, theme.accent, theme.secondary, "zoom", 0.9),
    decor(closing, "gold-rule", 105, 215, 330, 1, theme.accent, theme.secondary, "slide-left", 0.9),
    custom(closing, "WITH LOVE", 100, 250, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 48, 310, 444, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 420, 40, t.names, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 48, 455, 444, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "TOGETHER WITH", 100, 590, 340, t.headline, { align: "center", delay: 1 }),
    typeText(closing, "parentsBride", 55, 620, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    typeText(closing, "parentsGroom", 55, 648, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),
    custom(closing, "RSVP", 190, 760, 160, t.headline, { align: "center", delay: 1.4 }),
    typeText(closing, "rsvpContact", 100, 785, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.5 }),
    typeText(closing, "hashtag", 100, 815, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.6 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 910, 340, t.detail, { align: "center", delay: 1.9 }),
  ];
}


function buildClassic(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "engraved-frame", 25, 25, 490, 910, theme.accent, theme.secondary, "fade", 0.9),
    decor(opening, "acanthus", 42, 45, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "acanthus", 393, 45, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "thin-rule", 170, 235, 200, 1, theme.accent, theme.secondary, "slide-left", 0.9),
    custom(opening, "TOGETHER WITH THEIR FAMILIES", 95, 195, 350, t.headline, { align: "center", delay: 0.15 }),
    typeText(opening, "brideName", 55, 290, 430, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 390, 40, t.names, { align: "center", fontSize: 23, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 55, 425, 430, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    decor(opening, "thin-rule", 170, 555, 200, 1, theme.accent, theme.secondary, "slide-right", 0.9),
    custom(opening, "REQUEST THE PLEASURE OF YOUR COMPANY", 80, 585, 380, t.headline, { align: "center", delay: 1.3 }),
    typeText(opening, "weddingDate", 110, 610, 320, t.supporting, { align: "center", fontSize: 18, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    typeText(opening, "openingMessage", 100, 675, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    decor(opening, "classic-seal", 242, 790, 56, 56, theme.accent, theme.secondary, "zoom", 0.8),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 900, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "engraved-frame", 25, 25, 490, 910, theme.accent, theme.secondary, "fade", 0.9),
    decor(couple, "acanthus", 42, 45, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    photo(couple, 150, 245, 240, 300, theme.accent, 0, "fade", { frameWidth: 1, delay: 0.3 }),
    decor(couple, "thin-rule", 180, 585, 180, 1, theme.accent, theme.secondary, "fade", 0.9),
    custom(couple, "A FORMAL CELEBRATION", 90, 210, 360, t.headline, { align: "center", delay: 0.15 }),
    typeText(couple, "openingMessage", 100, 620, 340, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.8 }),
    typeText(couple, "loveStory", 105, 720, 330, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    decor(couple, "classic-seal", 242, 835, 56, 56, theme.accent, theme.secondary, "zoom", 0.8),

    decor(details, "engraved-frame", 25, 25, 490, 910, theme.accent, theme.secondary, "fade", 0.9),
    decor(details, "acanthus", 42, 45, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    decor(details, "acanthus", 393, 810, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    custom(details, "THE ORDER OF CELEBRATION", 80, 175, 380, t.headline, { align: "center", delay: 0.15 }),
    custom(details, "Akad Nikah", 55, 270, 205, t.supporting, { align: "center", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.4 }),
    typeText(details, "akadDate", 50, 335, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.55 }),
    typeText(details, "akadTime", 50, 365, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.65 }),
    custom(details, "Resepsi", 280, 270, 205, t.supporting, { align: "center", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.85 }),
    typeText(details, "receptionDate", 275, 335, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    typeText(details, "receptionTime", 275, 365, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    decor(details, "classic-seal", 242, 470, 56, 56, theme.accent, theme.secondary, "zoom", 0.8),
    custom(details, "THE VENUE", 100, 590, 340, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 620, 390, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 665, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "The favour of your presence is requested", 90, 800, 360, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "engraved-frame", 25, 25, 490, 910, theme.accent, theme.secondary, "fade", 0.9),
    decor(closing, "acanthus", 42, 45, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    decor(closing, "acanthus", 393, 810, 105, 105, theme.accent, theme.secondary, "fade", 0.8),
    custom(closing, "WITH SINCERE THANKS", 100, 230, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 55, 300, 430, t.names, { align: "center", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 395, 40, t.names, { align: "center", fontSize: 23, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 55, 430, 430, t.names, { align: "center", fontSize: 52, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    decor(closing, "thin-rule", 170, 555, 200, 1, theme.accent, theme.secondary, "fade", 0.9),
    custom(closing, "TOGETHER WITH", 100, 585, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 615, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 643, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 735, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 760, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 790, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    decor(closing, "classic-seal", 242, 850, 56, 56, theme.accent, theme.secondary, "zoom", 0.8),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}



function buildPremiere(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "premiere-spotlight", 80, -18, 380, 800, theme.secondary, theme.accent, "zoom", 0.5),
    decor(opening, "cinema-curtain", -20, 0, 580, 960, theme.accentSoft, theme.accent, "slide-left", 0.7),
    decor(opening, "cinema-marquee", 35, 62, 470, 145, theme.accent, theme.secondary, "fade", 0.95),
    decor(opening, "premiere-stars", 65, 245, 410, 120, theme.accent, theme.secondary, "fade", 0.75),
    decor(opening, "red-carpet", 120, 790, 300, 160, theme.secondary, theme.accent, "slide-up", 0.8),
    custom(opening, "A KEFOO PICTURE", 115, 220, 310, t.headline, { align: "center", delay: 0.15 }),
    typeText(opening, "brideName", 48, 300, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 400, 40, t.names, { align: "center", fontSize: 27, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 48, 435, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    custom(opening, "PREMIERE NIGHT", 110, 570, 320, t.headline, { align: "center", delay: 1.25 }),
    typeText(opening, "weddingDate", 105, 595, 330, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    typeText(opening, "openingMessage", 100, 665, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.5 }),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 900, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "cinema-curtain", -30, 0, 120, 960, theme.accentSoft, theme.accent, "fade", 0.7),
    decor(couple, "cinema-marquee", 55, 115, 430, 120, theme.accent, theme.secondary, "fade", 0.7),
    decor(couple, "film-strip", 25, 265, 490, 88, theme.accent, theme.secondary, "slide-left", 0.8),
    photo(couple, 95, 365, 350, 280, theme.accent, 2, "zoom", { frameWidth: 2, delay: 0.3 }),
    decor(couple, "film-strip", 25, 665, 490, 88, theme.accent, theme.secondary, "slide-right", 0.8),
    custom(couple, "A LOVE STORY", 100, 285, 340, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 100, 725, 340, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 110, 800, 320, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "premiere-spotlight", 130, 40, 280, 670, theme.secondary, theme.accent, "fade", 0.25),
    decor(details, "cinema-marquee", 55, 70, 430, 120, theme.accent, theme.secondary, "fade", 0.8),
    custom(details, "SHOWTIMES", 100, 220, 340, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "AKAD", 55, 290, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.4 }),
    typeText(details, "akadDate", 50, 320, 215, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.5 }),
    typeText(details, "akadTime", 50, 350, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    custom(details, "RECEPTION", 280, 290, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.8 }),
    typeText(details, "receptionDate", 275, 320, 220, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(details, "receptionTime", 275, 350, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    decor(details, "film-strip", 35, 435, 470, 72, theme.accent, theme.secondary, "slide-left", 0.8),
    custom(details, "THE VENUE", 100, 565, 340, t.headline, { align: "center", delay: 1.15 }),
    typeText(details, "venueName", 75, 595, 390, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.25 }),
    typeText(details, "venueAddress", 85, 640, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    custom(details, "A night to remember", 100, 790, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "cinema-curtain", -20, 0, 580, 960, theme.accentSoft, theme.accent, "slide-right", 0.7),
    decor(closing, "premiere-stars", 80, 80, 380, 110, theme.accent, theme.secondary, "fade", 0.7),
    custom(closing, "END CREDITS", 100, 230, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 48, 300, 444, t.names, { align: "center", fontSize: 54, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 400, 40, t.names, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 48, 435, 444, t.names, { align: "center", fontSize: 54, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "WITH LOVE", 100, 560, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 590, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 618, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 700, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 725, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 755, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 910, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}

type Builder = (
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
) => InvitationElement[];

const builders: Record<string, Builder> = {
  botanical: buildBotanical,
  pastel: buildPastel,
  modern: buildModern,
  luxury: buildLuxury,
  classic: buildClassic,
  "movie-premiere": buildPremiere,
  cinderella: buildCinderella,
  "la-la-land": buildLaLaLand,
  "vintage-cinema": buildVintage,
  "enchanted-fairytale": buildEnchanted,
};

function makeTemplate(
  id: string,
  name: string,
  description: string,
  styleLabel: string,
  theme: InvitationTheme,
  motion: TemplateMotion,
  assetIds: DecorativeAsset[],
  durations: [number, number, number, number],
  category: VideoTemplateCategory = "basic",
): VideoTemplate {
  const sceneIds = ["opening", "couple", "details", "closing"].map(
    (part) => `${id}-${part}`,
  );
  const scenes = motion.sceneTransitions.map((transition, index) =>
    scene(
      sceneIds[index],
      ["Opening", "Our Story", "The Celebration", "With Love"][index],
      durations[index],
      transition,
    ),
  );
  return {
    id,
    name,
    category,
    description,
    styleLabel,
    palette: [theme.paper, theme.accent, theme.ink, theme.accentSoft, theme.secondary],
    theme,
    typography: theme.typography,
    motion,
    assetIds,
    scenes,
    elements: builders[id](theme, motion, sceneIds),
    demoData: { ...DEMO_DATA },
  };
}

const basicVideoTemplates: VideoTemplate[] = [
  makeTemplate(
    "botanical",
    "Botanical Garden",
    "A romantic vintage botanical invitation with watercolor roses, a hand-drawn arch, pressed flowers, and drifting butterflies.",
    "Romantic vintage botanical",
    botanicalTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "slide-up",
      decorExit: "fade",
      stagger: 0.18,
      sceneTransitions: ["dissolve", "fade", "fade", "fade"],
    },
    ["watercolor-spray", "watercolor-rose", "botanical-arch", "butterfly-script", "pressed-flower"],
    [5.2, 5.8, 5.2, 5.0],
  ),
  makeTemplate(
    "pastel",
    "Pastel Romance",
    "A delicate lace-and-ribbon stationery invitation with a blush envelope, wax seal, and soft swash calligraphy.",
    "Vintage lace romance",
    pastelTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "slide-up",
      bodyExit: "fade",
      decorEnter: "fade",
      decorExit: "fade",
      stagger: 0.22,
      sceneTransitions: ["dissolve", "fade", "curtain", "fade"],
    },
    ["lace-scallop", "silk-ribbon", "blush-envelope", "wax-seal"],
    [4.9, 5.3, 4.9, 4.7],
  ),
  makeTemplate(
    "modern",
    "Modern Minimalist",
    "A contemporary editorial invitation with asymmetric whitespace, a restrained serif, and clean card reveals.",
    "Editorial modern",
    modernTheme,
    {
      nameEnter: "slide-left",
      nameExit: "slide-left",
      bodyEnter: "slide-up",
      bodyExit: "fade",
      decorEnter: "fade",
      decorExit: "fade",
      stagger: 0.1,
      sceneTransitions: ["zoom", "wipe", "zoom", "fade"],
    },
    ["modern-card", "editorial-arch", "thin-rule", "photo-arch"],
    [4.2, 4.8, 4.5, 4.0],
  ),
  makeTemplate(
    "luxury",
    "Luxury",
    "A cinematic black-tie invitation with burgundy velvet, champagne gold, deco fans, theatrical light, and a curtain reveal.",
    "Cinematic luxury",
    luxuryTheme,
    {
      nameEnter: "zoom",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "slide-up",
      decorExit: "fade",
      stagger: 0.28,
      sceneTransitions: ["curtain", "fade", "zoom", "dissolve"],
    },
    ["velvet-curtain", "deco-fan", "gold-rule", "spotlight-beam", "classic-seal"],
    [5.5, 5.8, 5.4, 5.0],
  ),
  makeTemplate(
    "classic",
    "Classic Elegant",
    "A timeless engraved stationery invitation with a formal frame, acanthus corners, and a classic calligraphy signature.",
    "Traditional engraved",
    classicTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "fade",
      decorExit: "fade",
      stagger: 0.2,
      sceneTransitions: ["fade", "dissolve", "wipe", "fade"],
    },
    ["engraved-frame", "acanthus", "classic-seal", "photo-arch", "thin-rule"],
    [5.2, 5.4, 5.2, 4.8],
  ),
];

const movieVideoTemplates: VideoTemplate[] = [
  makeTemplate(
    "movie-premiere",
    "Movie Premiere",
    "A red-carpet cinema poster with a marquee, spotlight, film strip, and dramatic Playfair/Cinzel billing.",
    "Red-carpet cinema",
    premiereTheme,
    {
      nameEnter: "zoom",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "slide-up",
      decorExit: "fade",
      stagger: 0.24,
      sceneTransitions: ["curtain", "zoom", "fade", "dissolve"],
    },
    ["cinema-marquee", "premiere-spotlight", "red-carpet", "film-strip", "premiere-stars", "cinema-curtain"],
    [5.5, 5.6, 5.2, 5.0],
    "movie",
  ),
  makeTemplate(
    "cinderella",
    "Cinderella",
    "A moonlit glass-slipper fairytale with midnight blue, silver filigree, a distant castle, and Allura calligraphy.",
    "Midnight fairytale",
    cinderellaTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "slide-up",
      bodyExit: "fade",
      decorEnter: "fade",
      decorExit: "fade",
      stagger: 0.22,
      sceneTransitions: ["fade", "dissolve", "zoom", "fade"],
    },
    ["moonlit-castle", "glass-slipper", "silver-filigree", "fairy-stars"],
    [5.0, 5.4, 5.0, 4.8],
    "movie",
  ),
  makeTemplate(
    "la-la-land",
    "La La Land",
    "A city-of-stars invitation with a midnight skyline, lamp-post silhouette, golden glow, and Alex Brush script.",
    "City of stars",
    lalalandTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "fade",
      decorExit: "fade",
      stagger: 0.18,
      sceneTransitions: ["zoom", "dissolve", "fade", "wipe"],
    },
    ["city-skyline", "lamp-post", "night-stars", "golden-glow"],
    [4.8, 5.2, 4.9, 4.6],
    "movie",
  ),
  makeTemplate(
    "vintage-cinema",
    "Vintage Cinema",
    "A retro film-poster invitation with a sunburst, film-strip borders, ticket stub, Prata typography, and paper grain.",
    "Retro film poster",
    vintageTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "slide-up",
      bodyExit: "fade",
      decorEnter: "slide-left",
      decorExit: "fade",
      stagger: 0.16,
      sceneTransitions: ["fade", "wipe", "curtain", "fade"],
    },
    ["vintage-film-strip", "vintage-ticket", "retro-sunburst", "film-grain"],
    [4.9, 5.2, 4.9, 4.6],
    "movie",
  ),
  makeTemplate(
    "enchanted-fairytale",
    "Enchanted Fairytale",
    "A magical forest invitation with moonlight, a fairytale castle, enchanted florals, sparkles, and Great Vibes calligraphy.",
    "Enchanted forest",
    enchantedTheme,
    {
      nameEnter: "fade",
      nameExit: "fade",
      bodyEnter: "fade",
      bodyExit: "fade",
      decorEnter: "zoom",
      decorExit: "fade",
      stagger: 0.2,
      sceneTransitions: ["dissolve", "fade", "zoom", "fade"],
    },
    ["enchanted-moon", "enchanted-forest", "enchanted-castle", "enchanted-floral", "fairy-sparkle"],
    [5.2, 5.4, 5.0, 4.9],
    "movie",
  ),
];

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  ...basicVideoTemplates,
  ...movieVideoTemplates,
];

export function videoTemplateById(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find((template) => template.id === id);
}

export function cloneDemoData(data: InvitationData): InvitationData {
  return { ...data };
}

export function cloneTemplateSnapshot(template: VideoTemplate) {
  return {
    id: template.id,
    name: template.name,
    theme: { ...template.theme, typography: { ...template.theme.typography } },
    typography: { ...template.typography },
    motion: {
      ...template.motion,
      sceneTransitions: [...template.motion.sceneTransitions],
    },
    assetIds: [...template.assetIds],
    scenes: template.scenes.map((item) => ({
      ...item,
      background: { ...item.background },
    })),
    elements: template.elements.map((item) => ({ ...item })),
    demoData: cloneDemoData(template.demoData),
  };
}

export const ANIMATION_PRESETS = [
  { id: "fade", label: "Fade in/out" },
  { id: "zoom", label: "Slow zoom" },
  { id: "slide-left", label: "Slide from left" },
  { id: "slide-right", label: "Slide from right" },
  { id: "slide-up", label: "Slide up" },
  { id: "pan", label: "Gentle pan" },
  { id: "dissolve", label: "Dissolve" },
  { id: "none", label: "None" },
] as const;

export const SCENE_TRANSITIONS = [
  { id: "fade", label: "Fade" },
  { id: "dissolve", label: "Dissolve" },
  { id: "curtain", label: "Curtain" },
  { id: "wipe", label: "Wipe" },
  { id: "zoom", label: "Cinematic zoom" },
] as const;

export const DECORATIVE_ASSETS = [
  { id: "cinema-marquee", label: "Cinema marquee" },
  { id: "premiere-spotlight", label: "Premiere spotlight" },
  { id: "red-carpet", label: "Red carpet" },
  { id: "film-strip", label: "Film strip" },
  { id: "premiere-stars", label: "Premiere stars" },
  { id: "cinema-curtain", label: "Cinema curtain" },
  { id: "film-reel", label: "Film reel" },
  { id: "moonlit-castle", label: "Moonlit castle" },
  { id: "glass-slipper", label: "Glass slipper" },
  { id: "silver-filigree", label: "Silver filigree" },
  { id: "fairy-stars", label: "Fairy stars" },
  { id: "city-skyline", label: "City skyline" },
  { id: "lamp-post", label: "Lamp post" },
  { id: "night-stars", label: "Night stars" },
  { id: "golden-glow", label: "Golden glow" },
  { id: "vintage-film-strip", label: "Vintage film strip" },
  { id: "vintage-ticket", label: "Vintage ticket" },
  { id: "retro-sunburst", label: "Retro sunburst" },
  { id: "film-grain", label: "Film grain" },
  { id: "enchanted-moon", label: "Enchanted moon" },
  { id: "enchanted-forest", label: "Enchanted forest" },
  { id: "enchanted-castle", label: "Enchanted castle" },
  { id: "enchanted-floral", label: "Enchanted floral" },
  { id: "fairy-sparkle", label: "Fairy sparkle" },
  { id: "watercolor-rose", label: "Watercolor rose" },
  { id: "watercolor-spray", label: "Watercolor spray" },
  { id: "botanical-arch", label: "Botanical arch" },
  { id: "butterfly-script", label: "Script butterfly" },
  { id: "pressed-flower", label: "Pressed flower" },
  { id: "lace-scallop", label: "Lace scallop" },
  { id: "silk-ribbon", label: "Silk ribbon" },
  { id: "blush-envelope", label: "Blush envelope" },
  { id: "wax-seal", label: "Wax seal" },
  { id: "modern-card", label: "Editorial card" },
  { id: "editorial-arch", label: "Editorial arch" },
  { id: "thin-rule", label: "Thin rule" },
  { id: "velvet-curtain", label: "Velvet curtain" },
  { id: "deco-fan", label: "Deco fan" },
  { id: "gold-rule", label: "Gold rule" },
  { id: "spotlight-beam", label: "Spotlight" },
  { id: "engraved-frame", label: "Engraved frame" },
  { id: "acanthus", label: "Acanthus corner" },
  { id: "classic-seal", label: "Classic seal" },
  { id: "photo-arch", label: "Photo arch" },
  { id: "botanical-corner", label: "Legacy botanical" },
  { id: "butterfly", label: "Legacy butterfly" },
  { id: "lace", label: "Legacy lace" },
  { id: "gold-frame", label: "Legacy gold frame" },
  { id: "envelope", label: "Legacy envelope" },
  { id: "curtain", label: "Legacy curtain" },
  { id: "classic-ornament", label: "Legacy ornament" },
  { id: "rings", label: "Rings" },
  { id: "heart", label: "Heart" },
  { id: "arch", label: "Legacy arch" },
] as const;

export function decorativeAssetLabel(id: DecorativeAsset) {
  return DECORATIVE_ASSETS.find((asset) => asset.id === id)?.label ?? id;
}



function buildCinderella(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "moonlit-castle", 155, 70, 230, 210, theme.secondary, theme.accent, "fade", 0.75),
    decor(opening, "fairy-stars", 65, 105, 410, 320, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "silver-filigree", 32, 28, 476, 904, theme.accent, theme.secondary, "fade", 0.65),
    decor(opening, "glass-slipper", 205, 730, 130, 90, theme.accent, theme.secondary, "zoom", 0.9),
    custom(opening, "A FAIRYTALE WEDDING", 105, 260, 330, t.headline, { align: "center", delay: 0.2 }),
    typeText(opening, "brideName", 48, 320, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 445, 40, t.names, { align: "center", fontSize: 28, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 48, 480, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    custom(opening, "AT THE STROKE OF MIDNIGHT", 95, 610, 350, t.headline, { align: "center", delay: 1.25 }),
    typeText(opening, "weddingDate", 100, 635, 340, t.supporting, { align: "center", fontSize: 18, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    typeText(opening, "openingMessage", 100, 685, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 910, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "moonlit-castle", 170, 90, 200, 180, theme.secondary, theme.accent, "fade", 0.55),
    decor(couple, "silver-filigree", 55, 250, 430, 430, theme.accent, theme.secondary, "fade", 0.65),
    photo(couple, 150, 280, 240, 300, theme.accent, 150, "fade", { frameWidth: 1, delay: 0.3 }),
    decor(couple, "fairy-stars", 80, 600, 380, 140, theme.accent, theme.secondary, "fade", 0.7),
    custom(couple, "THE GLASS SLIPPER", 100, 680, 340, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 100, 710, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 105, 790, 330, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "moonlit-castle", 155, 75, 230, 190, theme.secondary, theme.accent, "fade", 0.55),
    decor(details, "silver-filigree", 32, 28, 476, 904, theme.accent, theme.secondary, "fade", 0.55),
    custom(details, "THE ROYAL BALL", 90, 205, 360, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "The Ceremony", 55, 290, 205, t.supporting, { align: "center", fontSize: 27, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.4 }),
    typeText(details, "akadDate", 50, 350, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.55 }),
    typeText(details, "akadTime", 50, 380, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.65 }),
    custom(details, "The Ball", 280, 290, 205, t.supporting, { align: "center", fontSize: 27, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.85 }),
    typeText(details, "receptionDate", 275, 350, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    typeText(details, "receptionTime", 275, 380, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    decor(details, "glass-slipper", 240, 480, 80, 56, theme.accent, theme.secondary, "zoom", 0.8),
    custom(details, "THE PALACE", 100, 585, 340, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 615, 390, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 660, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "A dream is a wish your heart makes", 90, 800, 360, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "silver-filigree", 32, 28, 476, 904, theme.accent, theme.secondary, "fade", 0.55),
    decor(closing, "moonlit-castle", 165, 75, 210, 180, theme.secondary, theme.accent, "fade", 0.55),
    decor(closing, "fairy-stars", 100, 260, 340, 110, theme.accent, theme.secondary, "fade", 0.65),
    custom(closing, "HAPPILY EVER AFTER", 90, 285, 360, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 48, 350, 444, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 460, 40, t.names, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 48, 495, 444, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "WITH LOVE", 100, 620, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 650, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 678, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 750, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 775, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 805, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    decor(closing, "glass-slipper", 230, 860, 80, 56, theme.accent, theme.secondary, "zoom", 0.8),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}


function buildLaLaLand(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "night-stars", 55, 70, 430, 250, theme.accent, theme.secondary, "fade", 0.75),
    decor(opening, "golden-glow", 370, 85, 120, 120, theme.accent, theme.secondary, "zoom", 0.7),
    decor(opening, "city-skyline", 0, 650, 540, 240, theme.secondary, theme.accent, "fade", 0.55),
    decor(opening, "lamp-post", 65, 475, 60, 270, theme.accent, theme.secondary, "fade", 0.7),
    custom(opening, "HERE'S TO THE FOOLS", 105, 150, 330, t.headline, { align: "center", delay: 0.15 }),
    typeText(opening, "brideName", 45, 220, 450, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 335, 40, t.names, { align: "center", fontSize: 27, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 45, 370, 450, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    custom(opening, "A CITY OF STARS", 100, 520, 340, t.headline, { align: "center", delay: 1.25 }),
    typeText(opening, "weddingDate", 100, 545, 340, t.supporting, { align: "center", fontSize: 17, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    typeText(opening, "openingMessage", 100, 600, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.5 }),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 900, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "night-stars", 45, 85, 450, 170, theme.accent, theme.secondary, "fade", 0.65),
    photo(couple, 60, 250, 420, 310, theme.accent, 2, "pan", { frameWidth: 2, delay: 0.3 }),
    decor(couple, "city-skyline", 0, 655, 540, 220, theme.secondary, theme.accent, "fade", 0.55),
    decor(couple, "golden-glow", 70, 500, 90, 90, theme.accent, theme.secondary, "zoom", 0.45),
    custom(couple, "A MOMENT IN THE CITY", 90, 280, 360, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 100, 580, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 105, 700, 330, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "city-skyline", 0, 700, 540, 220, theme.secondary, theme.accent, "fade", 0.55),
    decor(details, "night-stars", 80, 80, 380, 150, theme.accent, theme.secondary, "fade", 0.6),
    custom(details, "CITY LIGHTS", 100, 220, 340, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "THE CEREMONY", 55, 295, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.4 }),
    typeText(details, "akadDate", 50, 325, 215, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.5 }),
    typeText(details, "akadTime", 50, 355, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    custom(details, "THE PARTY", 280, 295, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.8 }),
    typeText(details, "receptionDate", 275, 325, 220, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(details, "receptionTime", 275, 355, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    decor(details, "lamp-post", 235, 430, 70, 290, theme.accent, theme.secondary, "fade", 0.65),
    custom(details, "THE VENUE", 100, 600, 340, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 630, 390, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 675, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "A city of stars, a night of us", 90, 800, 360, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "night-stars", 65, 90, 410, 180, theme.accent, theme.secondary, "fade", 0.65),
    decor(closing, "city-skyline", 0, 730, 540, 200, theme.secondary, theme.accent, "fade", 0.55),
    custom(closing, "WITH LOVE", 100, 290, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 45, 350, 450, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 460, 40, t.names, { align: "center", fontSize: 27, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 45, 495, 450, t.names, { align: "center", fontSize: 58, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "TOGETHER WITH", 100, 620, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 650, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 678, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 750, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 775, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 805, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}


function buildVintage(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "vintage-film-strip", 22, 30, 496, 82, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "vintage-film-strip", 22, 850, 496, 82, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "retro-sunburst", 100, 145, 340, 340, theme.secondary, theme.accent, "zoom", 0.35),
    decor(opening, "film-grain", 0, 0, 540, 960, theme.ink, theme.accent, "fade", 0.18),
    custom(opening, "NOW SHOWING", 115, 170, 310, t.headline, { align: "center", delay: 0.2 }),
    typeText(opening, "brideName", 48, 255, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 330, 40, t.names, { align: "center", fontSize: 24, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 48, 365, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    custom(opening, "A TIMELESS LOVE STORY", 95, 505, 350, t.headline, { align: "center", delay: 1.25 }),
    typeText(opening, "weddingDate", 100, 530, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    typeText(opening, "openingMessage", 100, 605, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.5 }),
    decor(opening, "vintage-ticket", 160, 700, 220, 100, theme.accent, theme.secondary, "slide-up", 0.9),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 905, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "vintage-film-strip", 18, 220, 110, 520, theme.accent, theme.secondary, "slide-left", 0.8),
    decor(couple, "vintage-film-strip", 412, 220, 110, 520, theme.accent, theme.secondary, "slide-right", 0.8),
    photo(couple, 120, 260, 300, 280, theme.accent, 0, "fade", { frameWidth: 2, delay: 0.3 }),
    decor(couple, "vintage-ticket", 150, 610, 240, 105, theme.accent, theme.secondary, "slide-up", 0.85),
    custom(couple, "ADMIT TWO", 95, 260, 350, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 100, 690, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 110, 790, 320, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "vintage-film-strip", 22, 40, 496, 72, theme.accent, theme.secondary, "fade", 0.8),
    decor(details, "vintage-film-strip", 22, 855, 496, 72, theme.accent, theme.secondary, "fade", 0.8),
    decor(details, "film-grain", 0, 0, 540, 960, theme.ink, theme.accent, "fade", 0.18),
    custom(details, "SHOWTIMES", 100, 185, 340, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "AKAD", 55, 270, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.4 }),
    typeText(details, "akadDate", 50, 300, 215, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.5 }),
    typeText(details, "akadTime", 50, 330, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    custom(details, "RECEPTION", 280, 270, 205, t.detail, { align: "center", fontWeight: 600, delay: 0.8 }),
    typeText(details, "receptionDate", 275, 300, 220, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(details, "receptionTime", 275, 330, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    decor(details, "vintage-ticket", 145, 430, 250, 115, theme.accent, theme.secondary, "slide-up", 0.85),
    custom(details, "THE VENUE", 100, 610, 340, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 640, 390, t.supporting, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 685, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "A feature presentation of love", 95, 800, 350, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "vintage-film-strip", 22, 45, 496, 82, theme.accent, theme.secondary, "fade", 0.8),
    decor(closing, "retro-sunburst", 115, 240, 310, 310, theme.secondary, theme.accent, "fade", 0.25),
    decor(closing, "vintage-ticket", 150, 740, 240, 105, theme.accent, theme.secondary, "slide-up", 0.85),
    custom(closing, "THE END", 100, 250, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 48, 315, 444, t.names, { align: "center", fontSize: 46, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 405, 40, t.names, { align: "center", fontSize: 22, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 48, 440, 444, t.names, { align: "center", fontSize: 46, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "WITH LOVE", 100, 565, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 595, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 623, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 690, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 715, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 745, 340, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}


function buildEnchanted(
  theme: InvitationTheme,
  motion: TemplateMotion,
  ids: string[],
): InvitationElement[] {
  const [opening, couple, details, closing] = ids;
  const t = theme.typography;
  return [
    decor(opening, "enchanted-moon", 385, 70, 120, 120, theme.accent, theme.secondary, "fade", 0.8),
    decor(opening, "enchanted-forest", 0, 500, 540, 460, theme.accentSoft, theme.accent, "fade", 0.75),
    decor(opening, "enchanted-castle", 165, 225, 210, 170, theme.secondary, theme.accent, "fade", 0.55),
    decor(opening, "fairy-sparkle", 70, 110, 400, 280, theme.accent, theme.secondary, "fade", 0.65),
    decor(opening, "enchanted-floral", 20, 40, 135, 170, theme.accent, theme.secondary, "slide-up", 0.8),
    decor(opening, "enchanted-floral", 390, 700, 135, 170, theme.accent, theme.secondary, "slide-up", 0.8),
    custom(opening, "AN ENCHANTED EVENING", 100, 390, 340, t.headline, { align: "center", delay: 0.2 }),
    typeText(opening, "brideName", 48, 445, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 0.45 }),
    custom(opening, "&", 250, 545, 40, t.names, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.9 }),
    typeText(opening, "groomName", 48, 580, 444, t.names, { align: "center", enter: motion.nameEnter, exit: motion.nameExit, delay: 1.05 }),
    custom(opening, "MOONLIGHT · MIDNIGHT · MAGIC", 100, 700, 340, t.headline, { align: "center", delay: 1.25 }),
    typeText(opening, "weddingDate", 100, 725, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.35 }),
    custom(opening, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),

    decor(couple, "enchanted-moon", 410, 75, 90, 90, theme.accent, theme.secondary, "fade", 0.75),
    decor(couple, "enchanted-forest", 0, 620, 540, 340, theme.accentSoft, theme.accent, "fade", 0.65),
    decor(couple, "enchanted-floral", 25, 250, 130, 210, theme.accent, theme.secondary, "slide-up", 0.8),
    decor(couple, "enchanted-floral", 385, 250, 130, 210, theme.accent, theme.secondary, "slide-up", 0.8),
    photo(couple, 120, 270, 300, 300, theme.accent, 150, "zoom", { frameWidth: 1, delay: 0.3 }),
    decor(couple, "fairy-sparkle", 70, 610, 400, 150, theme.accent, theme.secondary, "fade", 0.65),
    custom(couple, "A MAGICAL GARDEN", 90, 670, 360, t.headline, { align: "center", delay: 0.8 }),
    typeText(couple, "openingMessage", 100, 700, 340, t.supporting, { align: "center", fontSize: 16, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.95 }),
    typeText(couple, "loveStory", 105, 790, 330, t.detail, { align: "center", fontSize: 9, lineHeight: 1.7, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.2 }),

    decor(details, "enchanted-moon", 400, 75, 95, 95, theme.accent, theme.secondary, "fade", 0.7),
    decor(details, "enchanted-castle", 160, 120, 220, 180, theme.secondary, theme.accent, "fade", 0.45),
    decor(details, "enchanted-forest", 0, 760, 540, 200, theme.accentSoft, theme.accent, "fade", 0.55),
    custom(details, "THE ENCHANTED GARDEN", 80, 315, 380, t.headline, { align: "center", delay: 0.2 }),
    custom(details, "The Ceremony", 55, 390, 205, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.4 }),
    typeText(details, "akadDate", 50, 445, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.55 }),
    typeText(details, "akadTime", 50, 475, 215, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.65 }),
    custom(details, "The Celebration", 280, 390, 205, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.85 }),
    typeText(details, "receptionDate", 275, 445, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1 }),
    typeText(details, "receptionTime", 275, 475, 220, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.1 }),
    decor(details, "fairy-sparkle", 230, 540, 80, 60, theme.accent, theme.secondary, "zoom", 0.8),
    custom(details, "THE VENUE", 100, 610, 340, t.headline, { align: "center", delay: 1.2 }),
    typeText(details, "venueName", 75, 640, 390, t.supporting, { align: "center", fontSize: 26, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.3 }),
    typeText(details, "venueAddress", 85, 685, 370, t.detail, { align: "center", fontSize: 9, lineHeight: 1.6, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.4 }),
    custom(details, "Where the forest meets the stars", 90, 815, 360, t.supporting, { align: "center", fontSize: 14, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),

    decor(closing, "enchanted-moon", 390, 75, 105, 105, theme.accent, theme.secondary, "fade", 0.75),
    decor(closing, "enchanted-forest", 0, 620, 540, 340, theme.accentSoft, theme.accent, "fade", 0.65),
    decor(closing, "enchanted-floral", 20, 300, 120, 190, theme.accent, theme.secondary, "slide-up", 0.75),
    decor(closing, "enchanted-floral", 400, 300, 120, 190, theme.accent, theme.secondary, "slide-up", 0.75),
    decor(closing, "fairy-sparkle", 100, 180, 340, 120, theme.accent, theme.secondary, "fade", 0.6),
    custom(closing, "HAPPILY EVER AFTER", 90, 300, 360, t.headline, { align: "center", delay: 0.2 }),
    typeText(closing, "brideName", 48, 360, 444, t.names, { align: "center", fontSize: 56, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.4 }),
    custom(closing, "&", 250, 460, 40, t.names, { align: "center", fontSize: 25, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 0.6 }),
    typeText(closing, "groomName", 48, 495, 444, t.names, { align: "center", fontSize: 56, enter: motion.nameEnter, exit: motion.nameExit, delay: 0.75 }),
    custom(closing, "WITH LOVE", 100, 620, 340, t.headline, { align: "center", delay: 0.95 }),
    typeText(closing, "parentsBride", 55, 650, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.05 }),
    typeText(closing, "parentsGroom", 55, 678, 430, t.detail, { align: "center", fontSize: 9, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.15 }),
    custom(closing, "RSVP", 190, 750, 160, t.headline, { align: "center", delay: 1.35 }),
    typeText(closing, "rsvpContact", 100, 775, 340, t.rsvp, { align: "center", fontSize: 11, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.45 }),
    typeText(closing, "hashtag", 100, 805, 340, t.supporting, { align: "center", fontSize: 15, enter: motion.bodyEnter, exit: motion.bodyExit, delay: 1.55 }),
    custom(closing, "KEFOO STUDIO · DEMO", 100, 915, 340, t.detail, { align: "center", delay: 1.8 }),
  ];
}

