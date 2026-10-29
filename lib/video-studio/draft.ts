import { cloneTemplateSnapshot, videoTemplateById } from "./templates";
import type { InvitationElement, VideoDraft } from "./types";

function freshId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDraftFromTemplate(templateId: string): VideoDraft | null {
  const template = videoTemplateById(templateId);
  if (!template) return null;
  const snapshot = cloneTemplateSnapshot(template);
  const now = new Date().toISOString();
  return {
    id: freshId(),
    title: `${template.name} Invitation`,
    templateId: template.id,
    templateName: template.name,
    version: 1,
    width: 540,
    height: 960,
    data: clone(snapshot.demoData),
    theme: clone(snapshot.theme),
    typography: clone(snapshot.typography),
    assetIds: clone(snapshot.assetIds),
    scenes: clone(snapshot.scenes),
    elements: clone(snapshot.elements),
    background: {
      color:
        template.theme.ornament === "luxury"
          ? "#260a11"
          : template.theme.paper,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneDraft(draft: VideoDraft): VideoDraft {
  return clone(draft);
}

export function elementBounds(element: InvitationElement) {
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  };
}

export function createTextElement(
  sceneId: string,
  x: number,
  y: number,
  options: Partial<Extract<InvitationElement, { kind: "text" }>> = {},
): Extract<InvitationElement, { kind: "text" }> {
  return {
    kind: "text",
    id: `text-${freshId()}`,
    sceneId,
    text: "Tulis teks Anda",
    x,
    y,
    width: 380,
    height: 50,
    rotation: 0,
    opacity: 1,
    enter: "fade",
    exit: "fade",
    delay: 0.3,
    layer: 30,
    fontSize: 28,
    fontWeight: 400,
    italic: false,
    align: "center",
    color: "#4e3a2f",
    lineHeight: 1.2,
    letterSpacing: 0,
    fontFamily: "Playfair Display",
    ...options,
  };
}

export function createPhotoElement(
  sceneId: string,
  x: number,
  y: number,
  options: Partial<Extract<InvitationElement, { kind: "photo" }>> = {},
): Extract<InvitationElement, { kind: "photo" }> {
  return {
    kind: "photo",
    id: `photo-${freshId()}`,
    sceneId,
    x,
    y,
    width: 320,
    height: 380,
    rotation: 0,
    opacity: 1,
    enter: "dissolve",
    exit: "fade",
    delay: 0.3,
    layer: 8,
    fit: "cover",
    cropX: 0.5,
    cropY: 0.5,
    zoom: 1,
    radius: 8,
    frameColor: "#b99562",
    frameWidth: 2,
    ...options,
  };
}

export function createDecorElement(
  sceneId: string,
  x: number,
  y: number,
  options: Partial<Extract<InvitationElement, { kind: "decor" }>> = {},
): Extract<InvitationElement, { kind: "decor" }> {
  return {
    kind: "decor",
    id: `decor-${freshId()}`,
    sceneId,
    asset: "classic-ornament",
    x,
    y,
    width: 180,
    height: 180,
    rotation: 0,
    opacity: 1,
    enter: "fade",
    exit: "fade",
    delay: 0.2,
    layer: 2,
    color: "#b99562",
    secondaryColor: "#eadbc4",
    ...options,
  };
}
