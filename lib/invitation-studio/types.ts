export type StudioTemplateCategory = "basic" | "movie";

export type StudioTextLayer = {
  kind: "text";
  text: string;
  left: number;
  top: number;
  width: number;
  fill: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  charSpacing?: number;
  lineHeight?: number;
  angle?: number;
  opacity?: number;
};

export type StudioRectLayer = {
  kind: "rect";
  left: number;
  top: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  angle?: number;
  opacity?: number;
};

export type StudioLineLayer = {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
  opacity?: number;
};

export type StudioCircleLayer = {
  kind: "circle";
  left: number;
  top: number;
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export type StudioEllipseLayer = {
  kind: "ellipse";
  left: number;
  top: number;
  rx: number;
  ry: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export type StudioSvgLayer = {
  kind: "svg";
  svg: string;
  left: number;
  top: number;
  width: number;
  color?: string;
  angle?: number;
  opacity?: number;
};

export type StudioLayer =
  | StudioTextLayer
  | StudioRectLayer
  | StudioLineLayer
  | StudioCircleLayer
  | StudioEllipseLayer
  | StudioSvgLayer;

export type StudioBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; colors: [string, string]; angle?: number };

export type StudioTemplate = {
  id: string;
  name: string;
  category: StudioTemplateCategory;
  description: string;
  palette: string[];
  background: StudioBackground;
  layers: StudioLayer[];
};

export type StudioDocument = {
  id: string;
  title: string;
  templateId: string;
  width: number;
  height: number;
  background: StudioBackground;
  /** Fabric.js serialized canvas (objects, positions, styles, layers). */
  canvasJson: string;
  createdAt: string;
  updatedAt: string;
};

export type StudioFont = {
  name: string;
  category: "Serif" | "Script" | "Sans" | "Display";
};

export type StudioElementDefinition = {
  id: string;
  label: string;
  category: string;
  kind: "shape" | "svg";
  shape?: "rect" | "circle" | "ellipse" | "line";
  svg?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultColor?: string;
};
