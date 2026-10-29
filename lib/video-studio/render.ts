import type {
  AnimationPreset,
  InvitationData,
  InvitationElement,
  PhotoElement,
  Scene,
  SceneTiming,
  TextElement,
  VideoDraft,
} from "./types";

export const VIDEO_WIDTH = 540;
export const VIDEO_HEIGHT = 960;
export const EXPORT_WIDTH = 720;
export const EXPORT_HEIGHT = 1280;

const imageCache = new Map<string, HTMLImageElement>();
const imageLoading = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);
  const pending = imageLoading.get(src);
  if (pending) return pending;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageCache.set(src, image);
      imageLoading.delete(src);
      resolve(image);
    };
    image.onerror = () => {
      imageLoading.delete(src);
      resolve(null);
    };
    image.src = src;
  });
  imageLoading.set(src, promise);
  return promise;
}

export async function preloadDraftImages(draft: VideoDraft) {
  const sources = draft.elements
    .filter((element): element is PhotoElement => element.kind === "photo")
    .map((element) => element.src)
    .filter((src): src is string => Boolean(src));
  await Promise.all(sources.map((src) => loadImage(src)));
  if (draft.background.image) await loadImage(draft.background.image);
}

export function getSceneTimeline(scenes: Scene[]): SceneTiming[] {
  let cursor = 0;
  return scenes.map((scene, index) => {
    const duration = Math.max(0.8, Number(scene.duration) || 1);
    const start = cursor;
    cursor += duration;
    return { scene, index, start, end: cursor };
  });
}

export function totalDuration(scenes: Scene[]) {
  return getSceneTimeline(scenes).at(-1)?.end ?? 0;
}

export function sceneAt(scenes: Scene[], time: number) {
  const timeline = getSceneTimeline(scenes);
  return (
    timeline.find((entry) => time >= entry.start && time < entry.end) ??
    timeline.at(-1) ??
    null
  );
}

export function valueFor(
  element: InvitationElement,
  data: InvitationData,
): string {
  if (element.kind !== "text") return "";
  if (element.text !== undefined) return element.text;
  return element.binding ? data[element.binding] : "";
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
}

function animationState(
  preset: AnimationPreset,
  progress: number,
  exit = false,
) {
  const eased = easeOutCubic(progress);
  const remaining = 1 - eased;
  if (preset === "none") return { alpha: 1, x: 0, y: 0, scale: 1 };
  if (preset === "zoom") {
    return { alpha: exit ? remaining : eased, x: 0, y: 0, scale: exit ? 1.04 : 0.94 + eased * 0.06 };
  }
  if (preset === "slide-left") {
    return { alpha: exit ? remaining : eased, x: exit ? 38 * eased : -38 * remaining, y: 0, scale: 1 };
  }
  if (preset === "slide-right") {
    return { alpha: exit ? remaining : eased, x: exit ? -38 * eased : 38 * remaining, y: 0, scale: 1 };
  }
  if (preset === "slide-up") {
    return { alpha: exit ? remaining : eased, x: 0, y: exit ? -24 * eased : 30 * remaining, scale: 1 };
  }
  if (preset === "pan") {
    return { alpha: exit ? remaining : eased, x: 12 * (progress - 0.5), y: 0, scale: 1 };
  }
  return { alpha: exit ? remaining : eased, x: 0, y: 0, scale: 1 };
}

function elementAnimation(element: InvitationElement, localTime: number, duration: number) {
  const enterDuration = 0.85;
  const exitDuration = 0.65;
  const enterProgress = Math.max(0, Math.min(1, (localTime - element.delay) / enterDuration));
  const exitStart = Math.max(enterDuration, duration - exitDuration);
  const exitProgress = Math.max(0, Math.min(1, (localTime - exitStart) / exitDuration));
  const enter = animationState(element.enter, enterProgress);
  const exit = animationState(element.exit, exitProgress, true);
  return {
    alpha: enter.alpha * exit.alpha * element.opacity,
    x: enter.x + exit.x,
    y: enter.y + exit.y,
    scale: enter.scale * exit.scale,
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function multiplyMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  ctx.translate(x + width / 2 + offsetX, y + height / 2 + offsetY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-(x + width / 2), -(y + height / 2));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  data: InvitationData,
  localTime: number,
  sceneDuration: number,
) {
  const content = valueFor(element, data);
  if (!content) return;
  const animation = elementAnimation(element, localTime, sceneDuration);
  if (animation.alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = animation.alpha;
  multiplyMatrix(
    ctx,
    element.x,
    element.y,
    element.width,
    element.height,
    element.rotation,
    animation.scale,
    animation.x,
    animation.y,
  );
  ctx.fillStyle = element.color;
  ctx.textBaseline = "top";
  ctx.textAlign = element.align;
  ctx.font = `${element.italic ? "italic " : ""}${element.fontWeight} ${element.fontSize}px "${element.fontFamily}", serif`;
  const spacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  spacing.letterSpacing = `${element.letterSpacing}px`;
  const lines = wrapText(ctx, content, element.width);
  const x =
    element.align === "center"
      ? element.x + element.width / 2
      : element.align === "right"
        ? element.x + element.width
        : element.x;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, element.y + index * element.fontSize * element.lineHeight);
  });
  spacing.letterSpacing = "0px";
  ctx.restore();
}

function drawDemoPhoto(
  ctx: CanvasRenderingContext2D,
  element: PhotoElement,
  theme: VideoDraft["theme"],
) {
  const gradient = ctx.createLinearGradient(
    element.x,
    element.y,
    element.x + element.width,
    element.y + element.height,
  );
  gradient.addColorStop(0, theme.photoPlaceholder[0]);
  gradient.addColorStop(1, theme.photoPlaceholder[1]);
  ctx.fillStyle = gradient;
  roundedRect(ctx, element.x, element.y, element.width, element.height, element.radius);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(
    element.x + element.width / 2,
    element.y + element.height / 2 - 15,
    Math.min(element.width, element.height) * 0.12,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    element.x + element.width / 2,
    element.y + element.height / 2 + 25,
    Math.min(element.width, element.height) * 0.2,
    Math.PI * 1.05,
    Math.PI * 1.95,
  );
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = '10px "Montserrat", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "DEMO PHOTO",
    element.x + element.width / 2,
    element.y + element.height - 28,
  );
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  element: PhotoElement,
  data: InvitationData,
  localTime: number,
  sceneDuration: number,
  theme: VideoDraft["theme"],
) {
  void data;
  const animation = elementAnimation(element, localTime, sceneDuration);
  if (animation.alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = animation.alpha;
  multiplyMatrix(
    ctx,
    element.x,
    element.y,
    element.width,
    element.height,
    element.rotation,
    animation.scale,
    animation.x,
    animation.y,
  );
  roundedRect(ctx, element.x, element.y, element.width, element.height, element.radius);
  ctx.clip();
  const image = element.src ? imageCache.get(element.src) : null;
  if (image?.complete && image.naturalWidth > 0) {
    const baseScale =
      element.fit === "cover"
        ? Math.max(element.width / image.naturalWidth, element.height / image.naturalHeight)
        : Math.min(element.width / image.naturalWidth, element.height / image.naturalHeight);
    const scale = baseScale * element.zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = element.x - (drawWidth - element.width) * element.cropX;
    const dy = element.y - (drawHeight - element.height) * element.cropY;
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  } else {
    drawDemoPhoto(ctx, element, theme);
  }
  ctx.restore();
  if (element.frameWidth > 0) {
    ctx.save();
    ctx.globalAlpha = animation.alpha;
    ctx.strokeStyle = element.frameColor;
    ctx.lineWidth = element.frameWidth;
    roundedRect(
      ctx,
      element.x + element.frameWidth / 2,
      element.y + element.frameWidth / 2,
      element.width - element.frameWidth,
      element.height - element.frameWidth,
      element.radius,
    );
    ctx.stroke();
    ctx.restore();
  }
}


function drawBotanicalCorner(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = secondary;
  ctx.lineWidth = Math.max(1, w * 0.008);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.9);
  ctx.bezierCurveTo(w * 0.16, h * 0.48, w * 0.38, h * 0.27, w * 0.78, h * 0.12);
  ctx.stroke();
  const leaves = [
    [0.19, 0.63, -0.8],
    [0.31, 0.47, -0.5],
    [0.43, 0.34, -0.2],
    [0.57, 0.24, 0.2],
  ];
  leaves.forEach(([lx, ly, rotate]) => {
    ctx.save();
    ctx.translate(w * lx, h * ly);
    ctx.rotate(rotate);
    ctx.beginPath();
    ctx.ellipse(w * 0.045, 0, w * 0.05, h * 0.014, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  const flowers = [
    [0.16, 0.73, 0.035],
    [0.38, 0.43, 0.027],
    [0.67, 0.22, 0.022],
  ];
  flowers.forEach(([fx, fy, radius]) => {
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        w * fx + Math.cos(angle) * w * radius,
        h * fy + Math.sin(angle) * h * radius,
        w * radius * 0.85,
        h * radius * 0.5,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = secondary;
  ctx.lineWidth = 1.2;
  const cx = w / 2;
  const cy = h / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(w * 0.05, h * 0.05, w * 0.02, h * 0.62, cx, cy + h * 0.12);
  ctx.bezierCurveTo(w * 0.98, h * 0.62, w * 0.95, h * 0.05, cx, cy);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * 0.1);
  ctx.bezierCurveTo(w * 0.2, h * 0.94, w * 0.4, h * 0.96, cx, cy + h * 0.34);
  ctx.bezierCurveTo(w * 0.6, h * 0.96, w * 0.8, h * 0.94, cx, cy + h * 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.08);
  ctx.quadraticCurveTo(w * 0.4, h * 0.02, w * 0.3, h * 0.16);
  ctx.moveTo(cx, cy - h * 0.08);
  ctx.quadraticCurveTo(w * 0.6, h * 0.02, w * 0.7, h * 0.16);
  ctx.stroke();
}

function drawLace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = secondary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += w / 18) {
    ctx.arc(x, h * 0.52, w / 36, 0, Math.PI, false);
  }
  ctx.stroke();
  for (let x = w / 36; x < w; x += w / 18) {
    ctx.beginPath();
    ctx.arc(x, h * 0.18, w / 110, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.bezierCurveTo(w * 0.24, h * 0.94, w * 0.44, h * 0.68, w, h * 0.78);
  ctx.stroke();
}

function drawGoldFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(w * 0.028, h * 0.022, w * 0.944, h * 0.956);
  const corner = Math.min(w, h) * 0.06;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  [
    [0, 0, 1, 1],
    [w, 0, -1, 1],
    [0, h, 1, -1],
    [w, h, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * corner, cy + dy * 4);
    ctx.lineTo(cx + dx * 4, cy + dy * 4);
    ctx.lineTo(cx + dx * 4, cy + dy * corner);
    ctx.stroke();
  });
}

function drawClassicOrnament(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96);
  ctx.lineWidth = 0.6;
  ctx.strokeRect(w * 0.045, h * 0.035, w * 0.91, h * 0.93);
  ctx.strokeStyle = secondary;
  const corner = Math.min(w, h) * 0.09;
  [
    [w * 0.02, h * 0.02, 1, 1],
    [w * 0.98, h * 0.02, -1, 1],
    [w * 0.02, h * 0.98, 1, -1],
    [w * 0.98, h * 0.98, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * corner, cy + dy * 2);
    ctx.quadraticCurveTo(cx + dx * corner * 0.3, cy + dy * corner * 0.3, cx + dx * 2, cy + dy * corner);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dx * corner * 0.55, cy + dy * corner * 0.55, 2, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawEnvelope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = secondary;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  roundedRect(ctx, w * 0.05, h * 0.16, w * 0.9, h * 0.64, 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.17);
  ctx.lineTo(w * 0.5, h * 0.55);
  ctx.lineTo(w * 0.95, h * 0.17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.79);
  ctx.lineTo(w * 0.38, h * 0.47);
  ctx.moveTo(w * 0.95, h * 0.79);
  ctx.lineTo(w * 0.62, h * 0.47);
  ctx.stroke();
}


function drawCurtain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.82;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(w * 0.24, h * 0.26, w * 0.04, h * 0.62, w * 0.16, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.bezierCurveTo(w * 0.76, h * 0.26, w * 0.96, h * 0.62, w * 0.84, h);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo((w * i) / 11, 0);
    ctx.bezierCurveTo(w * 0.08, h * 0.25, w * 0.01, h * 0.56, w * 0.07, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - (w * i) / 11, 0);
    ctx.bezierCurveTo(w * 0.92, h * 0.25, w * 0.99, h * 0.56, w * 0.93, h);
    ctx.stroke();
  }
}

function drawArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h);
  ctx.lineTo(w * 0.08, h * 0.34);
  ctx.bezierCurveTo(w * 0.08, h * 0.02, w * 0.92, h * 0.02, w * 0.92, h * 0.34);
  ctx.lineTo(w * 0.92, h);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.13, h);
  ctx.lineTo(w * 0.13, h * 0.35);
  ctx.bezierCurveTo(w * 0.13, h * 0.08, w * 0.87, h * 0.08, w * 0.87, h * 0.35);
  ctx.lineTo(w * 0.87, h);
  ctx.stroke();
}

function drawRings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.035);
  ctx.beginPath();
  ctx.arc(w * 0.38, h * 0.52, w * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.52, w * 0.25, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.88);
  ctx.bezierCurveTo(w * 0.08, h * 0.6, w * 0.08, h * 0.15, w * 0.28, h * 0.15);
  ctx.bezierCurveTo(w * 0.4, h * 0.15, w * 0.47, h * 0.27, w * 0.5, h * 0.32);
  ctx.bezierCurveTo(w * 0.53, h * 0.27, w * 0.6, h * 0.15, w * 0.72, h * 0.15);
  ctx.bezierCurveTo(w * 0.92, h * 0.15, w * 0.92, h * 0.6, w * 0.5, h * 0.88);
  ctx.closePath();
  ctx.fill();
}


function drawCinemaMarquee(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(w * 0.04, h * 0.08, w * 0.92, h * 0.84);
  ctx.lineWidth = 0.6;
  ctx.strokeRect(w * 0.055, h * 0.12, w * 0.89, h * 0.76);
  for (let i = 0; i < 20; i += 1) {
    const x = w * 0.08 + (i * w * 0.85) / 19;
    for (const y of [h * 0.08, h * 0.92]) {
      ctx.fillStyle = i % 3 === 0 ? secondary : color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, w * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.17);
  ctx.lineTo(w * 0.88, h * 0.17);
  ctx.moveTo(w * 0.12, h * 0.82);
  ctx.lineTo(w * 0.88, h * 0.82);
  ctx.stroke();
}

function drawPremiereSpotlight(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const gradient = ctx.createLinearGradient(w / 2, 0, w / 2, h);
  gradient.addColorStop(0, secondary);
  gradient.addColorStop(0.28, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.globalAlpha *= 0.3;
  ctx.beginPath();
  ctx.moveTo(w * 0.44, 0);
  ctx.lineTo(w * 0.56, 0);
  ctx.lineTo(w, h * 0.84);
  ctx.lineTo(w * 0.1, h);
  ctx.closePath();
  ctx.fill();
}

function drawRedCarpet(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, "#31070d");
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, "#31070d");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h);
  ctx.lineTo(w * 0.3, h * 0.1);
  ctx.lineTo(w * 0.7, h * 0.1);
  ctx.lineTo(w * 0.82, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h);
  ctx.lineTo(w * 0.35, h * 0.12);
  ctx.moveTo(w * 0.76, h);
  ctx.lineTo(w * 0.65, h * 0.12);
  ctx.stroke();
}

function drawFilmStrip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.02, h * 0.1, w * 0.96, h * 0.8);
  const count = 10;
  for (let i = 0; i < count; i += 1) {
    const x = w * 0.05 + (i * w * 0.9) / count;
    ctx.fillStyle = i % 2 ? secondary : color;
    ctx.globalAlpha *= 0.7;
    ctx.fillRect(x, h * 0.15, w * 0.018, h * 0.12);
    ctx.fillRect(x + w * 0.05, h * 0.15, w * 0.018, h * 0.12);
    ctx.fillRect(x, h * 0.73, w * 0.018, h * 0.12);
    ctx.fillRect(x + w * 0.05, h * 0.73, w * 0.018, h * 0.12);
  }
}

function drawPremiereStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const points = [
    [0.08, 0.38],
    [0.2, 0.12],
    [0.35, 0.5],
    [0.52, 0.2],
    [0.7, 0.54],
    [0.86, 0.16],
    [0.94, 0.42],
  ];
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const px = w * x;
    const py = h * y;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  points.forEach(([x, y], index) => {
    ctx.fillStyle = index % 2 ? secondary : color;
    ctx.beginPath();
    ctx.arc(w * x, h * y, Math.max(1, w * 0.006), 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCinemaCurtain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  for (const side of [0, 1]) {
    const x = side === 0 ? 0 : w;
    const edge = side === 0 ? w * 0.22 : w * 0.78;
    const gradient = ctx.createLinearGradient(x, 0, edge, 0);
    gradient.addColorStop(0, secondary);
    gradient.addColorStop(0.6, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.globalAlpha *= 0.82;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(edge, h * 0.16, edge * 0.8, h * 0.75, edge, h);
    ctx.lineTo(x, h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFilmReel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.38;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(angle) * radius * 0.62,
      cy + Math.sin(angle) * radius * 0.62,
      radius * 0.22,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = i % 2 ? secondary : color;
    ctx.stroke();
  }
}


function drawMoonlitCastle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = secondary;
  ctx.globalAlpha *= 0.7;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.28, w * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.45;
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.23, w * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.9);
  ctx.lineTo(w * 0.12, h * 0.62);
  ctx.lineTo(w * 0.2, h * 0.62);
  ctx.lineTo(w * 0.2, h * 0.5);
  ctx.lineTo(w * 0.28, h * 0.5);
  ctx.lineTo(w * 0.28, h * 0.64);
  ctx.lineTo(w * 0.38, h * 0.64);
  ctx.lineTo(w * 0.38, h * 0.43);
  ctx.lineTo(w * 0.47, h * 0.32);
  ctx.lineTo(w * 0.56, h * 0.43);
  ctx.lineTo(w * 0.56, h * 0.64);
  ctx.lineTo(w * 0.66, h * 0.64);
  ctx.lineTo(w * 0.66, h * 0.5);
  ctx.lineTo(w * 0.74, h * 0.5);
  ctx.lineTo(w * 0.74, h * 0.62);
  ctx.lineTo(w * 0.88, h * 0.62);
  ctx.lineTo(w * 0.88, h * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.9);
  ctx.lineTo(w * 0.46, h * 0.76);
  ctx.quadraticCurveTo(w * 0.47, h * 0.7, w * 0.47, h * 0.76);
  ctx.lineTo(w * 0.47, h * 0.9);
  ctx.stroke();
}

function drawGlassSlipper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = secondary;
  ctx.globalAlpha *= 0.42;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.62);
  ctx.bezierCurveTo(w * 0.3, h * 0.66, w * 0.62, h * 0.64, w * 0.9, h * 0.52);
  ctx.bezierCurveTo(w * 0.82, h * 0.78, w * 0.56, h * 0.86, w * 0.22, h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.62);
  ctx.bezierCurveTo(w * 0.32, h * 0.34, w * 0.52, h * 0.18, w * 0.76, h * 0.2);
  ctx.bezierCurveTo(w * 0.72, h * 0.42, w * 0.56, h * 0.56, w * 0.34, h * 0.66);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.arc(w * 0.79, h * 0.19, w * 0.025, 0, Math.PI * 2);
  ctx.fill();
}

function drawSilverFiligree(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96);
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = secondary;
  ctx.strokeRect(w * 0.05, h * 0.045, w * 0.9, h * 0.91);
  const corner = Math.min(w, h) * 0.16;
  for (const [cx, cy, dx, dy] of [
    [w * 0.03, h * 0.03, 1, 1],
    [w * 0.97, h * 0.03, -1, 1],
    [w * 0.03, h * 0.97, 1, -1],
    [w * 0.97, h * 0.97, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * corner);
    ctx.bezierCurveTo(cx + dx * corner * 0.2, cy + dy * corner * 0.35, cx + dx * corner * 0.75, cy + dy * corner * 0.15, cx + dx * corner, cy);
    ctx.moveTo(cx, cy + dy * corner * 0.65);
    ctx.bezierCurveTo(cx + dx * corner * 0.35, cy + dy * corner * 0.9, cx + dx * corner * 0.7, cy + dy * corner * 0.7, cx + dx * corner * 0.8, cy + dy * corner * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dx * corner * 0.42, cy + dy * corner * 0.42, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFairyStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const stars = [
    [0.08, 0.2, 0.04],
    [0.18, 0.66, 0.022],
    [0.32, 0.12, 0.028],
    [0.48, 0.4, 0.02],
    [0.63, 0.14, 0.045],
    [0.78, 0.56, 0.024],
    [0.9, 0.26, 0.032],
    [0.55, 0.76, 0.018],
  ];
  stars.forEach(([x, y, size], index) => {
    ctx.fillStyle = index % 2 ? secondary : color;
    const r = w * size;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const rr = i % 2 ? r * 0.35 : r;
      const px = w * x + Math.cos(angle) * rr;
      const py = h * y + Math.sin(angle) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  });
}


function drawCitySkyline(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const buildings = [
    [0.02, 0.52, 0.08, 0.48],
    [0.1, 0.36, 0.09, 0.64],
    [0.2, 0.62, 0.07, 0.38],
    [0.28, 0.25, 0.08, 0.75],
    [0.37, 0.48, 0.09, 0.52],
    [0.47, 0.34, 0.11, 0.66],
    [0.59, 0.58, 0.07, 0.42],
    [0.67, 0.28, 0.09, 0.72],
    [0.77, 0.45, 0.08, 0.55],
    [0.86, 0.36, 0.12, 0.64],
  ];
  buildings.forEach(([x, y, bw, bh], index) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.28 + (index % 3) * 0.08;
    ctx.fillRect(w * x, h * y, w * bw, h * bh);
  });
  ctx.fillStyle = secondary;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 34; i += 1) {
    const x = (w * ((i * 37 + 13) % 97)) / 100;
    const y = h * (0.5 + ((i * 23) % 43) / 100);
    ctx.fillRect(x, y, w * 0.004, h * 0.005);
  }
}

function drawLampPost(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h);
  ctx.lineTo(w * 0.5, h * 0.35);
  ctx.lineTo(w * 0.36, h * 0.35);
  ctx.lineTo(w * 0.36, h * 0.24);
  ctx.lineTo(w * 0.64, h * 0.24);
  ctx.lineTo(w * 0.64, h * 0.35);
  ctx.lineTo(w * 0.5, h * 0.35);
  ctx.stroke();
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.23, 1, w * 0.5, h * 0.23, w * 0.28);
  glow.addColorStop(0, secondary);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.globalAlpha *= 0.5;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.23, w * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function drawNightStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = color;
  for (let i = 0; i < 42; i += 1) {
    const x = (w * ((i * 43 + 11) % 101)) / 101;
    const y = (h * ((i * 67 + 7) % 97)) / 97;
    ctx.globalAlpha = 0.22 + (i % 4) * 0.12;
    ctx.beginPath();
    ctx.arc(x, y, i % 7 === 0 ? 1.5 : 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = secondary;
  for (let i = 0; i < 5; i += 1) {
    const x = w * (0.18 + i * 0.16);
    const y = h * (0.16 + (i % 2) * 0.13);
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoldenGlow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
  glow.addColorStop(0, secondary);
  glow.addColorStop(0.42, color);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.globalAlpha *= 0.42;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
}


function drawVintageFilmStrip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.86;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = secondary;
  const holes = Math.max(4, Math.floor(w / 34));
  for (let i = 0; i < holes; i += 1) {
    const x = (i * w) / holes + w * 0.012;
    ctx.fillRect(x, h * 0.18, w * 0.018, h * 0.2);
    ctx.fillRect(x, h * 0.62, w * 0.018, h * 0.2);
  }
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();
}

function drawVintageTicket(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = secondary;
  ctx.globalAlpha *= 0.22;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, h * 0.12);
  ctx.lineTo(w * 0.96, h * 0.12);
  ctx.lineTo(w * 0.96, h * 0.38);
  ctx.quadraticCurveTo(w * 0.88, h * 0.5, w * 0.96, h * 0.62);
  ctx.lineTo(w * 0.96, h * 0.88);
  ctx.lineTo(w * 0.04, h * 0.88);
  ctx.lineTo(w * 0.04, h * 0.62);
  ctx.quadraticCurveTo(w * 0.12, h * 0.5, w * 0.04, h * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.8;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.2);
  ctx.lineTo(w * 0.86, h * 0.2);
  ctx.moveTo(w * 0.14, h * 0.8);
  ctx.lineTo(w * 0.86, h * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRetroSunburst(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * w * 0.17, cy + Math.sin(angle) * h * 0.17);
    ctx.lineTo(cx + Math.cos(angle) * w * 0.52, cy + Math.sin(angle) * h * 0.52);
    ctx.stroke();
  }
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  for (let i = 0; i < 220; i += 1) {
    const x = (w * ((i * 71 + 19) % 997)) / 997;
    const y = (h * ((i * 137 + 43) % 991)) / 991;
    ctx.globalAlpha = 0.04 + (i % 5) * 0.012;
    ctx.fillRect(x, y, i % 9 === 0 ? 1.2 : 0.6, i % 13 === 0 ? 1.2 : 0.6);
  }
}


function drawEnchantedMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const glow = ctx.createRadialGradient(w * 0.55, h * 0.45, 2, w * 0.55, h * 0.45, w * 0.5);
  glow.addColorStop(0, secondary);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.globalAlpha *= 0.24;
  ctx.beginPath();
  ctx.arc(w * 0.55, h * 0.45, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.45, w * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(9,20,17,.9)";
  ctx.beginPath();
  ctx.arc(w * 0.6, h * 0.35, w * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = secondary;
  for (let i = 0; i < 9; i += 1) {
    const x = w * (0.15 + ((i * 29) % 73) / 100);
    const y = h * (0.1 + ((i * 41) % 70) / 100);
    ctx.globalAlpha *= 0.9;
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 1.3 : 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnchantedForest(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.8;
  for (let i = 0; i < 12; i += 1) {
    const x = (i * w) / 11;
    const height = h * (0.35 + ((i * 17) % 30) / 100);
    const spread = w * (0.06 + (i % 3) * 0.02);
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x - spread, h - height * 0.3);
    ctx.lineTo(x - spread * 0.7, h - height * 0.36);
    ctx.lineTo(x - spread * 0.35, h - height * 0.65);
    ctx.lineTo(x, h - height);
    ctx.lineTo(x + spread * 0.35, h - height * 0.65);
    ctx.lineTo(x + spread * 0.7, h - height * 0.36);
    ctx.lineTo(x + spread, h - height * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = secondary;
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 18; i += 1) {
    const x = (w * ((i * 31 + 7) % 97)) / 97;
    const y = h * (0.35 + ((i * 19) % 50) / 100);
    ctx.beginPath();
    ctx.arc(x, y, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnchantedCastle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.92);
  ctx.lineTo(w * 0.12, h * 0.6);
  ctx.lineTo(w * 0.24, h * 0.6);
  ctx.lineTo(w * 0.24, h * 0.46);
  ctx.lineTo(w * 0.35, h * 0.46);
  ctx.lineTo(w * 0.35, h * 0.35);
  ctx.lineTo(w * 0.43, h * 0.25);
  ctx.lineTo(w * 0.5, h * 0.35);
  ctx.lineTo(w * 0.57, h * 0.25);
  ctx.lineTo(w * 0.65, h * 0.35);
  ctx.lineTo(w * 0.65, h * 0.46);
  ctx.lineTo(w * 0.76, h * 0.46);
  ctx.lineTo(w * 0.76, h * 0.6);
  ctx.lineTo(w * 0.88, h * 0.6);
  ctx.lineTo(w * 0.88, h * 0.92);
  ctx.stroke();
  ctx.globalAlpha *= 0.7;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.92);
  ctx.lineTo(w * 0.5, h * 0.7);
  ctx.bezierCurveTo(w * 0.4, h * 0.7, w * 0.4, h * 0.88, w * 0.5, h * 0.88);
  ctx.stroke();
}

function drawEnchantedFloral(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.9);
  ctx.bezierCurveTo(w * 0.24, h * 0.58, w * 0.42, h * 0.38, w * 0.78, h * 0.16);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const t = i / 5;
    const x = w * (0.24 + t * 0.4);
    const y = h * (0.65 - t * 0.32);
    ctx.fillStyle = i % 2 ? secondary : color;
    ctx.globalAlpha *= 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.035, h * 0.012, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  petal(ctx, w * 0.78, h * 0.16, w * 0.06, h * 0.025, 0.2, color, 0.55);
  petal(ctx, w * 0.7, h * 0.24, w * 0.045, h * 0.02, -0.4, secondary, 0.45);
}

function drawFairySparkle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const sparkles = [
    [0.15, 0.3, 0.06],
    [0.3, 0.7, 0.035],
    [0.48, 0.2, 0.05],
    [0.7, 0.6, 0.03],
    [0.85, 0.3, 0.045],
    [0.58, 0.82, 0.025],
  ];
  sparkles.forEach(([x, y, size], index) => {
    const cx = w * x;
    const cy = h * y;
    const r = w * size;
    ctx.strokeStyle = index % 2 ? secondary : color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.fillStyle = index % 2 ? color : secondary;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDecorative(
  ctx: CanvasRenderingContext2D,
  element: Extract<InvitationElement, { kind: "decor" }>,
  localTime: number,
  sceneDuration: number,
) {
  const animation = elementAnimation(element, localTime, sceneDuration);
  if (animation.alpha <= 0.01) return;
  const float = element.asset === "butterfly" ? Math.sin(localTime * 1.6) * 4 : 0;
  ctx.save();
  ctx.globalAlpha = animation.alpha;
  multiplyMatrix(
    ctx,
    element.x,
    element.y,
    element.width,
    element.height,
    element.rotation,
    animation.scale,
    animation.x,
    animation.y + float,
  );
  ctx.translate(element.x, element.y);
  const w = element.width;
  const h = element.height;
  switch (element.asset) {
    case "cinema-marquee":
      drawCinemaMarquee(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "premiere-spotlight":
      drawPremiereSpotlight(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "red-carpet":
      drawRedCarpet(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "film-strip":
      drawFilmStrip(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "premiere-stars":
      drawPremiereStars(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "cinema-curtain":
      drawCinemaCurtain(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "film-reel":
      drawFilmReel(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "moonlit-castle":
      drawMoonlitCastle(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "glass-slipper":
      drawGlassSlipper(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "silver-filigree":
      drawSilverFiligree(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "fairy-stars":
      drawFairyStars(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "city-skyline":
      drawCitySkyline(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "lamp-post":
      drawLampPost(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "night-stars":
      drawNightStars(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "golden-glow":
      drawGoldenGlow(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "vintage-film-strip":
      drawVintageFilmStrip(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "vintage-ticket":
      drawVintageTicket(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "retro-sunburst":
      drawRetroSunburst(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "film-grain":
      drawFilmGrain(ctx, w, h, element.color);
      break;
    case "enchanted-moon":
      drawEnchantedMoon(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "enchanted-forest":
      drawEnchantedForest(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "enchanted-castle":
      drawEnchantedCastle(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "enchanted-floral":
      drawEnchantedFloral(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "fairy-sparkle":
      drawFairySparkle(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "watercolor-spray":
      drawWatercolorSpray(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "watercolor-rose":
      drawWatercolorRose(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "botanical-arch":
      drawBotanicalArch(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "butterfly-script":
      drawButterflyScript(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "pressed-flower":
      drawPressedFlower(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "lace-scallop":
      drawLaceScallop(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "silk-ribbon":
      drawSilkRibbon(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "blush-envelope":
      drawBlushEnvelope(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "wax-seal":
      drawWaxSeal(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "modern-card":
      drawModernCard(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "editorial-arch":
      drawEditorialArch(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "thin-rule":
      drawThinRule(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "velvet-curtain":
      drawVelvetCurtain(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "deco-fan":
      drawDecoFan(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "gold-rule":
      drawGoldRule(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "spotlight-beam":
      drawSpotlightBeam(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "engraved-frame":
      drawEngravedFrame(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "acanthus":
      drawAcanthus(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "classic-seal":
      drawClassicSeal(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "photo-arch":
      drawPhotoArch(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "botanical-corner":
      drawBotanicalCorner(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "butterfly":
      drawButterfly(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "lace":
      drawLace(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "gold-frame":
      drawGoldFrame(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "envelope":
      drawEnvelope(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "curtain":
      drawCurtain(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "classic-ornament":
      drawClassicOrnament(ctx, w, h, element.color, element.secondaryColor);
      break;
    case "rings":
      drawRings(ctx, w, h, element.color);
      break;
    case "heart":
      drawHeart(ctx, w, h, element.color);
      break;
    case "arch":
      drawArch(ctx, w, h, element.color, element.secondaryColor);
      break;
    default:
      break;
  }
  ctx.restore();
}


function drawPaperTexture(
  ctx: CanvasRenderingContext2D,
  theme: VideoDraft["theme"],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  ctx.save();
  if (theme.ornament === "botanical") {
    const wash = ctx.createRadialGradient(70, 90, 10, 70, 90, 330);
    wash.addColorStop(0, "rgba(145, 173, 132, .24)");
    wash.addColorStop(1, "rgba(145, 173, 132, 0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 540, 960);
    const blush = ctx.createRadialGradient(490, 760, 10, 490, 760, 300);
    blush.addColorStop(0, "rgba(201, 143, 154, .18)");
    blush.addColorStop(1, "rgba(201, 143, 154, 0)");
    ctx.fillStyle = blush;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < 145; i += 1) {
      const x = ((i * 97 + 31) % 997) / 997 * 540;
      const y = ((i * 193 + 73) % 991) / 991 * 960;
      ctx.beginPath();
      ctx.arc(x, y, i % 4 === 0 ? 0.7 : 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = theme.accent;
    for (let i = 0; i < 9; i += 1) {
      const x = 25 + i * 61;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 5, 280, x - 4, 630, x + 3, 960);
      ctx.stroke();
    }
  } else if (theme.ornament === "pastel") {
    const wash = ctx.createLinearGradient(0, 0, 540, 960);
    wash.addColorStop(0, "rgba(255,255,255,.28)");
    wash.addColorStop(0.55, "rgba(240,217,218,.3)");
    wash.addColorStop(1, "rgba(199,143,153,.12)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = theme.secondary;
    for (let i = 0; i < 36; i += 1) {
      const y = i * 27;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + 1, 370, y - 1, 540, y + 2);
      ctx.stroke();
    }
    for (let i = 0; i < 22; i += 1) {
      const x = (i * 79 + 31) % 540;
      const y = (i * 131 + 19) % 960;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = theme.secondary;
      ctx.fill();
    }
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = theme.accent;
    for (let i = 0; i < 13; i += 1) {
      ctx.beginPath();
      ctx.arc(-40 + i * 54, 960, 49, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  } else if (theme.ornament === "minimal") {
    const light = ctx.createLinearGradient(0, 0, 540, 960);
    light.addColorStop(0, "rgba(255,255,255,.35)");
    light.addColorStop(0.6, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(157,134,97,.08)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = theme.ink;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(54, 80 + i * 95);
      ctx.lineTo(486, 80 + i * 95);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.09;
    for (let i = 0; i < 80; i += 1) {
      const x = ((i * 83 + 17) % 991) / 991 * 540;
      const y = ((i * 157 + 39) % 983) / 983 * 960;
      ctx.fillStyle = theme.ink;
      ctx.fillRect(x, y, 0.6, 0.6);
    }
  } else if (theme.ornament === "luxury") {
    const base = ctx.createRadialGradient(270, 270, 20, 270, 420, 650);
    base.addColorStop(0, "#4b1625");
    base.addColorStop(0.46, "#2b0b13");
    base.addColorStop(1, "#17070c");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 10; i += 1) {
      const x = i * 65;
      const fold = ctx.createLinearGradient(x, 0, x + 64, 0);
      fold.addColorStop(0, "rgba(255,238,208,0)");
      fold.addColorStop(0.5, "rgba(255,238,208,.16)");
      fold.addColorStop(1, "rgba(255,238,208,0)");
      ctx.fillStyle = fold;
      ctx.fillRect(x, 0, 64, 960);
    }
    ctx.globalAlpha = 0.28;
    const vignette = ctx.createRadialGradient(270, 440, 180, 270, 440, 620);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.78)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.12;
    const gold = ctx.createLinearGradient(0, 0, 540, 0);
    gold.addColorStop(0, "rgba(198,160,92,0)");
    gold.addColorStop(0.5, "rgba(198,160,92,.72)");
    gold.addColorStop(1, "rgba(198,160,92,0)");
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, 540, 960);
  } else if (theme.ornament === "premiere") {
    const stage = ctx.createRadialGradient(270, 300, 20, 270, 340, 620);
    stage.addColorStop(0, "#3a0d16");
    stage.addColorStop(0.5, "#130609");
    stage.addColorStop(1, "#070708");
    ctx.fillStyle = stage;
    ctx.fillRect(0, 0, 540, 960);
    const beam = ctx.createLinearGradient(220, 0, 340, 800);
    beam.addColorStop(0, "rgba(212,175,105,.34)");
    beam.addColorStop(1, "rgba(212,175,105,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(230, 0);
    ctx.lineTo(310, 0);
    ctx.lineTo(510, 960);
    ctx.lineTo(30, 960);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d4af69";
    for (let i = 0; i < 48; i += 1) {
      const x = (i * 79 + 13) % 540;
      const y = (i * 113 + 27) % 960;
      ctx.globalAlpha = 0.12 + (i % 4) * 0.1;
      ctx.fillRect(x, y, i % 5 === 0 ? 1.2 : 0.6, 0.6);
    }
  } else if (theme.ornament === "cinderella") {
    const sky = ctx.createLinearGradient(0, 0, 0, 960);
    sky.addColorStop(0, "#16234a");
    sky.addColorStop(0.5, "#0b1028");
    sky.addColorStop(1, "#111a38");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 540, 960);
    const moonGlow = ctx.createRadialGradient(400, 145, 10, 400, 145, 260);
    moonGlow.addColorStop(0, "rgba(233,225,200,.25)");
    moonGlow.addColorStop(1, "rgba(233,225,200,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, 540, 960);
    ctx.fillStyle = "#c9d4ec";
    for (let i = 0; i < 35; i += 1) {
      ctx.globalAlpha = 0.18 + (i % 3) * 0.14;
      ctx.beginPath();
      ctx.arc((i * 67 + 11) % 540, (i * 43 + 21) % 500, i % 7 === 0 ? 1.4 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.ornament === "lalaland") {
    const sky = ctx.createLinearGradient(0, 0, 0, 960);
    sky.addColorStop(0, "#061228");
    sky.addColorStop(0.55, "#102c50");
    sky.addColorStop(1, "#1d3150");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 540, 960);
    const cityGlow = ctx.createLinearGradient(0, 560, 0, 960);
    cityGlow.addColorStop(0, "rgba(224,191,115,0)");
    cityGlow.addColorStop(1, "rgba(224,191,115,.16)");
    ctx.fillStyle = cityGlow;
    ctx.fillRect(0, 0, 540, 960);
    ctx.fillStyle = "#f6e9c7";
    for (let i = 0; i < 55; i += 1) {
      ctx.globalAlpha = 0.18 + (i % 5) * 0.1;
      ctx.beginPath();
      ctx.arc((i * 83 + 31) % 540, (i * 53 + 17) % 620, i % 9 === 0 ? 1.4 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.ornament === "vintage") {
    const paper = ctx.createLinearGradient(0, 0, 540, 960);
    paper.addColorStop(0, "#f4ead3");
    paper.addColorStop(0.55, "#e8d8b9");
    paper.addColorStop(1, "#d9c39d");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#7a2e21";
    for (let i = 0; i < 95; i += 1) {
      ctx.fillRect((i * 71 + 17) % 540, (i * 103 + 29) % 960, 0.6, 0.6);
    }
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#7a2e21";
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, i * 82);
      ctx.bezierCurveTo(180, i * 82 + 2, 370, i * 82 - 2, 540, i * 82 + 1);
      ctx.stroke();
    }
  } else if (theme.ornament === "enchanted") {
    const forest = ctx.createLinearGradient(0, 0, 0, 960);
    forest.addColorStop(0, "#0b1b15");
    forest.addColorStop(0.45, "#1d3428");
    forest.addColorStop(1, "#0b1712");
    ctx.fillStyle = forest;
    ctx.fillRect(0, 0, 540, 960);
    const mist = ctx.createRadialGradient(280, 500, 10, 280, 500, 420);
    mist.addColorStop(0, "rgba(216,207,176,.16)");
    mist.addColorStop(1, "rgba(216,207,176,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, 540, 960);
    ctx.fillStyle = "#d8cfb0";
    for (let i = 0; i < 40; i += 1) {
      ctx.globalAlpha = 0.12 + (i % 4) * 0.1;
      ctx.beginPath();
      ctx.arc((i * 59 + 23) % 540, (i * 97 + 13) % 730, i % 8 === 0 ? 1.2 : 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const light = ctx.createRadialGradient(270, 170, 20, 270, 380, 620);
    light.addColorStop(0, "rgba(255,255,255,.4)");
    light.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 540, 960);
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = theme.accent;
    for (let i = 0; i < 18; i += 1) {
      const inset = 30 + i * 15;
      ctx.beginPath();
      ctx.moveTo(inset, 25);
      ctx.lineTo(inset + 40, 25);
      ctx.moveTo(inset, 935);
      ctx.lineTo(inset + 40, 935);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = theme.secondary;
    for (let i = 0; i < 90; i += 1) {
      const x = ((i * 113 + 23) % 991) / 991 * 540;
      const y = ((i * 179 + 37) % 983) / 983 * 960;
      ctx.fillRect(x, y, 0.7, 0.7);
    }
  }
  ctx.restore();
}


function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function drawSceneBackground(
  ctx: CanvasRenderingContext2D,
  draft: VideoDraft,
  scene: Scene,
  time: number,
) {
  const background = scene.background;
  const image = draft.background.image ? imageCache.get(draft.background.image) : null;
  if (background.kind === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    gradient.addColorStop(0, background.colors[0]);
    gradient.addColorStop(1, background.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  } else if (background.kind === "color") {
    drawPaperTexture(ctx, draft.theme, background.color);
  } else {
    drawPaperTexture(ctx, draft.theme, draft.background.color);
  }
  const zoom = 1.035 + Math.sin(time * 0.08) * 0.012;
  if (image?.complete) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.translate(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-VIDEO_WIDTH / 2, -VIDEO_HEIGHT / 2);
    drawCoverImage(ctx, image, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.restore();
    const overlay = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT);
    overlay.addColorStop(0, "rgba(0,0,0,0)");
    overlay.addColorStop(0.6, "rgba(0,0,0,0.04)");
    overlay.addColorStop(1, "rgba(0,0,0,0.24)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }
  if (draft.theme.ornament === "luxury") {
    ctx.save();
    ctx.globalAlpha = 0.18;
    const light = ctx.createRadialGradient(270, 260, 15, 270, 260, 440);
    light.addColorStop(0, "#e6c17a");
    light.addColorStop(1, "rgba(230,193,122,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.restore();
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  draft: VideoDraft,
  scene: Scene,
  localTime: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawSceneBackground(ctx, draft, scene, localTime);
  const sceneElements = draft.elements
    .filter((element) => element.sceneId === scene.id)
    .slice()
    .sort((a, b) => a.layer - b.layer);
  for (const element of sceneElements) {
    if (element.kind === "text") {
      drawText(ctx, element, draft.data, localTime, scene.duration);
    } else if (element.kind === "photo") {
      drawPhoto(ctx, element, draft.data, localTime, scene.duration, draft.theme);
    } else {
      drawDecorative(ctx, element, localTime, scene.duration);
    }
  }
  ctx.restore();
}

function drawPreviousScene(
  ctx: CanvasRenderingContext2D,
  draft: VideoDraft,
  scene: Scene,
) {
  drawScene(ctx, draft, scene, Math.max(0.2, scene.duration - 0.55), 1);
}

export function renderInvitationFrame(
  ctx: CanvasRenderingContext2D,
  draft: VideoDraft,
  time: number,
  width = VIDEO_WIDTH,
  height = VIDEO_HEIGHT,
) {
  const timeline = getSceneTimeline(draft.scenes);
  if (timeline.length === 0) return;
  const safeTime = Math.max(0, Math.min(time, timeline.at(-1)?.end ?? 0));
  const current = sceneAt(draft.scenes, safeTime) ?? timeline[0];
  const position = timeline[current.index];
  const previous = current.index > 0 ? timeline[current.index - 1] : null;
  const localTime = safeTime - position.start;
  const transitionDuration = 0.8;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.scale(width / VIDEO_WIDTH, height / VIDEO_HEIGHT);

  if (previous && localTime < transitionDuration) {
    const progress = Math.max(0, Math.min(1, localTime / transitionDuration));
    drawPreviousScene(ctx, draft, previous.scene);
    if (current.scene.transition === "curtain") {
      ctx.save();
      const revealWidth = VIDEO_WIDTH * progress;
      ctx.beginPath();
      ctx.rect((VIDEO_WIDTH - revealWidth) / 2, 0, revealWidth, VIDEO_HEIGHT);
      ctx.clip();
      drawScene(ctx, draft, current.scene, localTime, 1);
      ctx.restore();
    } else if (current.scene.transition === "wipe") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, VIDEO_WIDTH * progress, VIDEO_HEIGHT);
      ctx.clip();
      drawScene(ctx, draft, current.scene, localTime, 1);
      ctx.restore();
    } else if (current.scene.transition === "zoom") {
      ctx.save();
      ctx.translate(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2);
      const scale = 1.12 - progress * 0.12;
      ctx.scale(scale, scale);
      ctx.translate(-VIDEO_WIDTH / 2, -VIDEO_HEIGHT / 2);
      drawScene(ctx, draft, current.scene, localTime, progress);
      ctx.restore();
    } else {
      drawScene(ctx, draft, current.scene, localTime, progress);
    }
  } else {
    drawScene(ctx, draft, current.scene, localTime, 1);
  }
  ctx.restore();
}

export function renderDraftToCanvas(
  canvas: HTMLCanvasElement,
  draft: VideoDraft,
  time: number,
  width = VIDEO_WIDTH,
  height = VIDEO_HEIGHT,
) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  renderInvitationFrame(ctx, draft, time, width, height);
}

export function renderStaticPreview(
  canvas: HTMLCanvasElement,
  draft: VideoDraft,
  width = 270,
  height = 480,
) {
  const firstScene = getSceneTimeline(draft.scenes)[0];
  const time = firstScene ? Math.min(2.6, firstScene.start + 2.6) : 0;
  renderDraftToCanvas(canvas, draft, time, width, height);
}

export async function renderDraftToCanvasReady(
  canvas: HTMLCanvasElement,
  draft: VideoDraft,
  time: number,
  width = VIDEO_WIDTH,
  height = VIDEO_HEIGHT,
) {
  await preloadDraftImages(draft);
  renderDraftToCanvas(canvas, draft, time, width, height);
}



function petal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  color: string,
  alpha: number,
) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWatercolorSpray(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.011);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.92);
  ctx.bezierCurveTo(w * 0.2, h * 0.64, w * 0.44, h * 0.5, w * 0.78, h * 0.18);
  ctx.stroke();
  const leafPositions = [
    [0.26, 0.72, -0.85],
    [0.37, 0.57, -0.55],
    [0.5, 0.44, -0.22],
    [0.62, 0.34, 0.12],
  ];
  leafPositions.forEach(([x, y, r], index) => {
    ctx.save();
    ctx.translate(w * x, h * y);
    ctx.rotate(r);
    const gradient = ctx.createLinearGradient(-w * 0.06, 0, w * 0.06, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, secondary);
    ctx.globalAlpha *= 0.38 + index * 0.08;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.07, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  petal(ctx, w * 0.26, h * 0.7, w * 0.045, h * 0.02, -0.2, secondary, 0.8);
  petal(ctx, w * 0.43, h * 0.49, w * 0.038, h * 0.018, 0.35, secondary, 0.7);
  petal(ctx, w * 0.63, h * 0.28, w * 0.032, h * 0.015, -0.5, secondary, 0.6);
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    petal(
      ctx,
      w * 0.26 + Math.cos(angle) * w * 0.028,
      h * 0.7 + Math.sin(angle) * h * 0.028,
      w * 0.026,
      h * 0.014,
      angle,
      secondary,
      0.58,
    );
  }
}

function drawWatercolorRose(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w * 0.5;
  const cy = h * 0.46;
  const radius = Math.min(w, h) * 0.3;
  for (let layer = 0; layer < 4; layer += 1) {
    const count = 7 + layer * 2;
    const r = radius * (1 - layer * 0.16);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + layer * 0.4;
      const px = cx + Math.cos(angle) * r * 0.45;
      const py = cy + Math.sin(angle) * r * 0.4;
      petal(ctx, px, py, r * 0.45, r * 0.24, angle, layer % 2 ? secondary : color, 0.52);
    }
  }
  ctx.strokeStyle = secondary;
  ctx.globalAlpha *= 0.6;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.27, 0.2, Math.PI * 1.7);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(cx, cy + radius * 0.95);
  ctx.bezierCurveTo(cx - w * 0.12, cy + radius * 1.6, cx + w * 0.1, cy + radius * 1.8, cx + w * 0.2, cy + radius * 1.5);
  ctx.stroke();
}

function drawBotanicalArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  const baseAlpha = ctx.globalAlpha;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.95);
  ctx.bezierCurveTo(w * 0.04, h * 0.5, w * 0.16, h * 0.09, w * 0.5, h * 0.07);
  ctx.bezierCurveTo(w * 0.84, h * 0.09, w * 0.96, h * 0.5, w * 0.92, h * 0.95);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.94);
  ctx.bezierCurveTo(w * 0.08, h * 0.51, w * 0.2, h * 0.13, w * 0.5, h * 0.11);
  ctx.bezierCurveTo(w * 0.8, h * 0.13, w * 0.92, h * 0.51, w * 0.88, h * 0.94);
  ctx.stroke();
  ctx.globalAlpha = baseAlpha;
  const leaves = [
    [0.1, 0.72, 0.8],
    [0.08, 0.53, 1.1],
    [0.15, 0.3, 0.5],
    [0.27, 0.13, 0.1],
    [0.8, 0.44, -0.9],
    [0.88, 0.68, -0.6],
  ];
  leaves.forEach(([x, y, rotation], index) => {
    ctx.save();
    ctx.translate(w * x, h * y);
    ctx.rotate(rotation);
    ctx.fillStyle = index % 2 ? secondary : color;
    ctx.globalAlpha *= 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.035, h * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}


function drawButterflyScript(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = secondary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(w * 0.06, h * 0.01, w * 0.03, h * 0.56, cx, cy + h * 0.1);
  ctx.bezierCurveTo(w * 0.97, h * 0.56, w * 0.94, h * 0.01, cx, cy);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * 0.05);
  ctx.bezierCurveTo(w * 0.2, h * 0.9, w * 0.38, h * 0.96, cx, cy + h * 0.3);
  ctx.bezierCurveTo(w * 0.62, h * 0.96, w * 0.8, h * 0.9, cx, cy + h * 0.05);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha *= 0.65;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(w * 0.27, h * 0.2, w * 0.16, h * 0.32);
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(w * 0.73, h * 0.2, w * 0.84, h * 0.32);
  ctx.moveTo(cx, cy - h * 0.04);
  ctx.quadraticCurveTo(w * 0.37, 0, w * 0.31, h * 0.05);
  ctx.moveTo(cx, cy - h * 0.04);
  ctx.quadraticCurveTo(w * 0.63, 0, w * 0.69, h * 0.05);
  ctx.stroke();
}

function drawPressedFlower(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.95);
  ctx.bezierCurveTo(w * 0.45, h * 0.7, w * 0.48, h * 0.45, w * 0.5, h * 0.25);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    petal(
      ctx,
      w * 0.5 + Math.cos(angle) * w * 0.1,
      h * 0.24 + Math.sin(angle) * h * 0.08,
      w * 0.12,
      h * 0.06,
      angle,
      i % 2 ? secondary : color,
      0.35,
    );
  }
  ctx.fillStyle = secondary;
  ctx.globalAlpha *= 0.3;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.24, w * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w * 0.48, h * 0.55);
    ctx.quadraticCurveTo(w * (0.25 - i * 0.03), h * (0.45 + i * 0.05), w * 0.16, h * (0.35 + i * 0.07));
    ctx.stroke();
  }
}

function drawLaceScallop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const step = w / 17;
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) {
    ctx.arc(x, h * 0.45, step * 0.5, Math.PI, 0, true);
  }
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  for (let x = step / 2; x < w; x += step) {
    ctx.arc(x, h * 0.25, step * 0.2, 0, Math.PI * 2);
  }
  ctx.stroke();
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.arc(x, h * 0.7, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawSilkRibbon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const gradient = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.8);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, secondary);
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  ctx.globalAlpha *= 0.72;
  ctx.beginPath();
  ctx.moveTo(-w * 0.05, h * 0.55);
  ctx.bezierCurveTo(w * 0.25, h * 0.15, w * 0.68, h * 0.92, w * 1.05, h * 0.38);
  ctx.lineTo(w * 1.05, h * 0.62);
  ctx.bezierCurveTo(w * 0.7, h * 1.08, w * 0.28, h * 0.32, -w * 0.05, h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.38;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.66);
  ctx.bezierCurveTo(w * 0.3, h * 0.25, w * 0.65, h * 0.9, w, h * 0.48);
  ctx.stroke();
}

function drawBlushEnvelope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, secondary);
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.shadowColor = "rgba(95, 50, 55, .18)";
  ctx.shadowBlur = Math.min(w, h) * 0.045;
  roundedRect(ctx, w * 0.08, h * 0.14, w * 0.84, h * 0.68, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.15);
  ctx.lineTo(w * 0.5, h * 0.55);
  ctx.lineTo(w * 0.92, h * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.81);
  ctx.lineTo(w * 0.36, h * 0.49);
  ctx.moveTo(w * 0.92, h * 0.81);
  ctx.lineTo(w * 0.64, h * 0.49);
  ctx.stroke();
}

function drawWaxSeal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.42;
  const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 1, cx, cy, radius);
  gradient.addColorStop(0, secondary);
  gradient.addColorStop(0.7, color);
  gradient.addColorStop(1, "#6c2935");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,240,218,.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.24, cy + radius * 0.1);
  ctx.bezierCurveTo(cx - radius * 0.2, cy - radius * 0.36, cx + radius * 0.2, cy - radius * 0.36, cx + radius * 0.24, cy + radius * 0.1);
  ctx.moveTo(cx - radius * 0.22, cy + radius * 0.1);
  ctx.bezierCurveTo(cx - radius * 0.03, cy + radius * 0.28, cx + radius * 0.03, cy + radius * 0.28, cx + radius * 0.22, cy + radius * 0.1);
  ctx.stroke();
}


function drawModernCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(w * 0.015, h * 0.015, w * 0.97, h * 0.97);
  ctx.globalAlpha *= 0.28;
  ctx.fillStyle = secondary;
  ctx.fillRect(w * 0.015, h * 0.015, w * 0.97, h * 0.97);
  ctx.globalAlpha *= 0.7;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.1);
  ctx.lineTo(w * 0.08, h * 0.9);
  ctx.stroke();
}

function drawEditorialArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.92, 0);
  ctx.lineTo(w * 0.92, h * 0.58);
  ctx.bezierCurveTo(w * 0.92, h * 0.9, w * 0.46, h, 0, h);
  ctx.stroke();
  ctx.globalAlpha *= 0.38;
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.7, 0);
  ctx.lineTo(w * 0.7, h * 0.42);
  ctx.bezierCurveTo(w * 0.7, h * 0.7, w * 0.3, h * 0.82, 0, h * 0.8);
  ctx.closePath();
  ctx.fill();
}

function drawThinRule(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (w >= h) {
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
  } else {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
  }
  ctx.stroke();
  ctx.globalAlpha *= 0.45;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  if (w >= h) {
    ctx.arc(w / 2, h / 2, Math.min(2.5, w / 2), 0, Math.PI * 2);
  } else {
    ctx.arc(w / 2, h / 2, Math.min(2.5, h / 2), 0, Math.PI * 2);
  }
  ctx.stroke();
}

function drawPhotoArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h);
  ctx.lineTo(w * 0.08, h * 0.38);
  ctx.bezierCurveTo(w * 0.08, h * 0.04, w * 0.92, h * 0.04, w * 0.92, h * 0.38);
  ctx.lineTo(w * 0.92, h);
  ctx.stroke();
  ctx.globalAlpha *= 0.4;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, h);
  ctx.lineTo(w * 0.04, h * 0.37);
  ctx.bezierCurveTo(w * 0.04, h * 0.0, w * 0.96, h * 0.0, w * 0.96, h * 0.37);
  ctx.lineTo(w * 0.96, h);
  ctx.stroke();
}

function drawVelvetCurtain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  for (const side of [-1, 1]) {
    const x = side === -1 ? 0 : w;
    for (let i = 0; i < 5; i += 1) {
      const edge = side === -1 ? w * (0.06 + i * 0.032) : w * (0.94 - i * 0.032);
      const gradient = ctx.createLinearGradient(x, 0, edge, 0);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.55, secondary);
      gradient.addColorStop(1, "rgba(20,6,10,0)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha *= 0.72;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(edge, h * 0.15, edge * 0.8, h * 0.78, edge, h);
      ctx.lineTo(x, h);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha *= 0.28;
  ctx.strokeStyle = "#f0d398";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, (h * i) / 5);
    ctx.quadraticCurveTo(w * 0.02, (h * (i + 0.4)) / 5, 0, (h * (i + 0.8)) / 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, (h * i) / 5);
    ctx.quadraticCurveTo(w * 0.98, (h * (i + 0.4)) / 5, w, (h * (i + 0.8)) / 5);
    ctx.stroke();
  }
}

function drawDecoFan(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i += 1) {
    const angle = Math.PI + (i / 12) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * w * 0.5, cy + Math.sin(angle) * h * 0.9);
    ctx.stroke();
  }
  ctx.globalAlpha *= 0.5;
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.23, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.42, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function drawGoldRule(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  if (w >= h) {
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
  } else {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
  }
  ctx.stroke();
  ctx.globalAlpha *= 0.7;
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2 - 2);
  ctx.lineTo(w / 2 + 3, h / 2);
  ctx.lineTo(w / 2, h / 2 + 2);
  ctx.lineTo(w / 2 - 3, h / 2);
  ctx.closePath();
  ctx.fill();
}

function drawSpotlightBeam(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const gradient = ctx.createLinearGradient(w / 2, 0, w / 2, h);
  gradient.addColorStop(0, secondary);
  gradient.addColorStop(0.2, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.globalAlpha *= 0.28;
  ctx.beginPath();
  ctx.moveTo(w * 0.44, 0);
  ctx.lineTo(w * 0.56, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}


function drawEngravedFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(w * 0.015, h * 0.015, w * 0.97, h * 0.97);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(w * 0.038, h * 0.03, w * 0.924, h * 0.94);
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.45;
  const corner = Math.min(w, h) * 0.11;
  for (const [cx, cy, dx, dy] of [
    [w * 0.015, h * 0.015, 1, 1],
    [w * 0.985, h * 0.015, -1, 1],
    [w * 0.015, h * 0.985, 1, -1],
    [w * 0.985, h * 0.985, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * corner, cy + dy * 4);
    ctx.lineTo(cx + dx * 4, cy + dy * 4);
    ctx.lineTo(cx + dx * 4, cy + dy * corner);
    ctx.stroke();
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * corner, cy + dy * (6 + i * 8));
      ctx.lineTo(cx + dx * (6 + i * 8), cy + dy * corner);
      ctx.stroke();
    }
  }
}

function drawAcanthus(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.88);
  ctx.bezierCurveTo(w * 0.3, h * 0.82, w * 0.34, h * 0.52, w * 0.12, h * 0.46);
  ctx.bezierCurveTo(w * 0.02, h * 0.43, w * 0.02, h * 0.27, w * 0.18, h * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.16, h * 0.64);
  ctx.bezierCurveTo(w * 0.45, h * 0.7, w * 0.52, h * 0.43, w * 0.38, h * 0.28);
  ctx.stroke();
  ctx.globalAlpha *= 0.5;
  ctx.strokeStyle = secondary;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(w * (0.12 + i * 0.08), h * (0.32 + i * 0.09), w * 0.045, 0.2, Math.PI * 1.5);
    ctx.stroke();
  }
}

function drawClassicSeal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  secondary: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.42;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha *= 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.76, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(angle) * radius * 0.6, cy + Math.sin(angle) * radius * 0.6);
    ctx.lineTo(cx + Math.cos(angle) * radius * 0.72, cy + Math.sin(angle) * radius * 0.72);
  }
  ctx.stroke();
}

