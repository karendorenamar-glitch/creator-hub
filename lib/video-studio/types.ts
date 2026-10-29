export type InvitationData = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  akadDate: string;
  akadTime: string;
  receptionDate: string;
  receptionTime: string;
  venueName: string;
  venueAddress: string;
  openingMessage: string;
  rsvpContact: string;
  loveStory: string;
  parentsBride: string;
  parentsGroom: string;
  hashtag: string;
};

export type AnimationPreset =
  | "fade"
  | "zoom"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "pan"
  | "dissolve"
  | "none";

export type SceneTransition = "fade" | "dissolve" | "curtain" | "wipe" | "zoom";

export type TextAlign = "left" | "center" | "right";

export type ElementBase = {
  id: string;
  sceneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  enter: AnimationPreset;
  exit: AnimationPreset;
  delay: number;
  layer: number;
};

export type TextElement = ElementBase & {
  kind: "text";
  binding?: keyof InvitationData;
  text?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700;
  italic: boolean;
  align: TextAlign;
  color: string;
  lineHeight: number;
  letterSpacing: number;
};

export type PhotoElement = ElementBase & {
  kind: "photo";
  src?: string;
  fit: "cover" | "contain";
  cropX: number;
  cropY: number;
  zoom: number;
  radius: number;
  frameColor: string;
  frameWidth: number;
};

export type DecorativeElement = ElementBase & {
  kind: "decor";
  asset: DecorativeAsset;
  color: string;
  secondaryColor: string;
};

export type InvitationElement = TextElement | PhotoElement | DecorativeElement;

export type DecorativeAsset =
  | "cinema-marquee"
  | "premiere-spotlight"
  | "red-carpet"
  | "film-strip"
  | "premiere-stars"
  | "cinema-curtain"
  | "film-reel"
  | "moonlit-castle"
  | "glass-slipper"
  | "silver-filigree"
  | "fairy-stars"
  | "city-skyline"
  | "lamp-post"
  | "night-stars"
  | "golden-glow"
  | "vintage-film-strip"
  | "vintage-ticket"
  | "retro-sunburst"
  | "film-grain"
  | "enchanted-moon"
  | "enchanted-forest"
  | "enchanted-castle"
  | "enchanted-floral"
  | "fairy-sparkle"
  | "watercolor-rose"
  | "watercolor-spray"
  | "botanical-arch"
  | "butterfly-script"
  | "pressed-flower"
  | "lace-scallop"
  | "silk-ribbon"
  | "blush-envelope"
  | "wax-seal"
  | "modern-card"
  | "editorial-arch"
  | "thin-rule"
  | "velvet-curtain"
  | "deco-fan"
  | "gold-rule"
  | "spotlight-beam"
  | "engraved-frame"
  | "acanthus"
  | "classic-seal"
  | "photo-arch"
  | "botanical-corner"
  | "butterfly"
  | "lace"
  | "gold-frame"
  | "envelope"
  | "curtain"
  | "classic-ornament"
  | "rings"
  | "heart"
  | "arch";

export type TypeToken = {
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
  color: string;
};

export type TemplateTypography = {
  names: TypeToken;
  headline: TypeToken;
  supporting: TypeToken;
  detail: TypeToken;
  rsvp: TypeToken;
};

export type TemplateMotion = {
  nameEnter: AnimationPreset;
  nameExit: AnimationPreset;
  bodyEnter: AnimationPreset;
  bodyExit: AnimationPreset;
  decorEnter: AnimationPreset;
  decorExit: AnimationPreset;
  stagger: number;
  sceneTransitions: [SceneTransition, SceneTransition, SceneTransition, SceneTransition];
};


export type SceneBackground =
  | { kind: "theme" }
  | { kind: "color"; color: string }
  | { kind: "gradient"; colors: [string, string]; angle: number };

export type Scene = {
  id: string;
  title: string;
  duration: number;
  transition: SceneTransition;
  background: SceneBackground;
};

export type VideoTemplateCategory = "basic" | "movie";

export type InvitationTheme = {
  paper: string;
  ink: string;
  accent: string;
  accentSoft: string;
  secondary: string;
  muted: string;
  displayFont: string;
  scriptFont: string;
  bodyFont: string;
  nameFont: string;
  headlineFont: string;
  supportFont: string;
  detailFont: string;
  ornament:
    | "botanical"
    | "pastel"
    | "minimal"
    | "luxury"
    | "classic"
    | "premiere"
    | "cinderella"
    | "lalaland"
    | "vintage"
    | "enchanted";
  photoPlaceholder: [string, string];
  typography: TemplateTypography;
};

export type VideoTemplate = {
  id: string;
  name: string;
  category: VideoTemplateCategory;
  description: string;
  styleLabel: string;
  palette: string[];
  theme: InvitationTheme;
  typography: TemplateTypography;
  motion: TemplateMotion;
  assetIds: DecorativeAsset[];
  scenes: Scene[];
  elements: InvitationElement[];
  demoData: InvitationData;
};

export type AudioAsset = {
  name: string;
  type: string;
  dataUrl: string;
};

export type VideoDraft = {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  version: 1;
  width: 540;
  height: 960;
  data: InvitationData;
  theme: InvitationTheme;
  typography?: TemplateTypography;
  assetIds?: DecorativeAsset[];
  scenes: Scene[];
  elements: InvitationElement[];
  background: { color: string; image?: string };
  audio?: AudioAsset;
  createdAt: string;
  updatedAt: string;
};

export type RenderOptions = {
  width: number;
  height: number;
  time: number;
  selectedId?: string | null;
};

export type SceneTiming = {
  scene: Scene;
  index: number;
  start: number;
  end: number;
};
