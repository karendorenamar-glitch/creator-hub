import * as fabric from "fabric";
import type { StudioBackground, StudioLayer, StudioTemplate } from "./types";

export const STUDIO_WIDTH = 600;
export const STUDIO_HEIGHT = 800;

async function createSvgGroup(
  svg: string,
  color: string,
  width: number,
): Promise<fabric.Group | null> {
  const parsed = await fabric.loadSVGFromString(svg.replace(/__COLOR__/g, color));
  const objects = parsed.objects.filter(
    (object): object is fabric.FabricObject => Boolean(object),
  );
  if (!objects.length) return null;
  const group = new fabric.Group(objects, {
    left: 0,
    top: 0,
    originX: "left",
    originY: "top",
    objectCaching: false,
  });
  group.scaleToWidth(width);
  group.setCoords();
  return group;
}

export function createStudioCanvas(
  element: HTMLCanvasElement,
): fabric.Canvas {
  const canvas = new fabric.Canvas(element, {
    width: STUDIO_WIDTH,
    height: STUDIO_HEIGHT,
    preserveObjectStacking: true,
    selection: true,
    backgroundColor: "#ffffff",
  });
  canvas.selectionColor = "rgba(130, 100, 65, 0.12)";
  return canvas;
}

export function applyBackground(
  canvas: fabric.Canvas,
  background: StudioBackground,
) {
  if (background.type === "solid") {
    canvas.backgroundColor = background.color;
  } else {
    canvas.backgroundColor = new fabric.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords: {
        x1: 0,
        y1: 0,
        x2: STUDIO_WIDTH,
        y2: STUDIO_HEIGHT,
      },
      colorStops: [
        { offset: 0, color: background.colors[0] },
        { offset: 1, color: background.colors[1] },
      ],
    });
  }
}

export async function createLayerObject(
  layer: StudioLayer,
): Promise<fabric.FabricObject | null> {
  if (layer.kind === "text") {
    return new fabric.Textbox(layer.text, {
      left: layer.left,
      top: layer.top,
      width: layer.width,
      fill: layer.fill,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight ?? "normal",
      fontStyle: layer.fontStyle ?? "normal",
      textAlign: layer.textAlign ?? "center",
      charSpacing: layer.charSpacing ?? 0,
      lineHeight: layer.lineHeight ?? 1.16,
      angle: layer.angle ?? 0,
      opacity: layer.opacity ?? 1,
      editable: true,
      objectCaching: false,
    });
  }

  if (layer.kind === "rect") {
    return new fabric.Rect({
      left: layer.left,
      top: layer.top,
      width: layer.width,
      height: layer.height,
      fill: layer.fill || "transparent",
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      rx: layer.rx ?? 0,
      ry: layer.ry ?? 0,
      angle: layer.angle ?? 0,
      opacity: layer.opacity ?? 1,
      objectCaching: false,
    });
  }

  if (layer.kind === "line") {
    return new fabric.Line([layer.x1, layer.y1, layer.x2, layer.y2], {
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 1,
      opacity: layer.opacity ?? 1,
      objectCaching: false,
    });
  }

  if (layer.kind === "circle") {
    return new fabric.Circle({
      left: layer.left,
      top: layer.top,
      radius: layer.radius,
      fill: layer.fill || "transparent",
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      opacity: layer.opacity ?? 1,
      objectCaching: false,
    });
  }

  if (layer.kind === "ellipse") {
    return new fabric.Ellipse({
      left: layer.left,
      top: layer.top,
      rx: layer.rx,
      ry: layer.ry,
      fill: layer.fill || "transparent",
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      opacity: layer.opacity ?? 1,
      objectCaching: false,
    });
  }

  const group = await createSvgGroup(
    layer.svg,
    layer.color ?? "#c5a46d",
    layer.width,
  );
  if (!group) return null;
  group.set({
    left: layer.left,
    top: layer.top,
    angle: layer.angle ?? 0,
    opacity: layer.opacity ?? 1,
    originX: "left",
    originY: "top",
  });
  group.setCoords();
  return group;
}

export async function applyTemplateToCanvas(
  canvas: fabric.Canvas,
  template: StudioTemplate,
) {
  canvas.clear();
  applyBackground(canvas, template.background);
  for (const layer of template.layers) {
    const object = await createLayerObject(layer);
    if (object) {
      object.set({ originX: "left", originY: "top" });
      object.setCoords();
      canvas.add(object);
    }
  }
  canvas.requestRenderAll();
}

export async function addElementObject(
  canvas: fabric.Canvas,
  kind: "shape" | "svg",
  shape: "rect" | "circle" | "ellipse" | "line" | undefined,
  svg: string | undefined,
  color: string,
  width: number,
) {
  let object: fabric.FabricObject | null = null;
  if (kind === "shape") {
    if (shape === "rect") {
      object = new fabric.Rect({
        left: 210,
        top: 350,
        width,
        height: Math.max(50, width * 0.55),
        rx: 10,
        ry: 10,
        fill: color,
        opacity: 0.9,
      });
    } else if (shape === "circle") {
      object = new fabric.Circle({
        left: 245,
        top: 350,
        radius: width / 2,
        fill: color,
        opacity: 0.9,
      });
    } else if (shape === "ellipse") {
      object = new fabric.Ellipse({
        left: 220,
        top: 360,
        rx: width / 2,
        ry: width / 3,
        fill: color,
        opacity: 0.9,
      });
    } else {
      object = new fabric.Line([180, 400, 420, 400], {
        stroke: color,
        strokeWidth: 3,
      });
    }
  } else if (svg) {
    const group = await createSvgGroup(svg, color, width);
    if (group) {
      group.set({ left: 210, top: 340, opacity: 0.95 });
      group.setCoords();
      object = group;
    }
  }
  if (object) {
    object.set({ originX: "left", originY: "top" });
    object.setCoords();
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
  }
  return object;
}

export async function addImageObject(
  canvas: fabric.Canvas,
  dataUrl: string,
) {
  const image = await fabric.FabricImage.fromURL(dataUrl, {
    crossOrigin: null,
  });
  const maxWidth = 360;
  const maxHeight = 420;
  const scale = Math.min(
    maxWidth / (image.width || maxWidth),
    maxHeight / (image.height || maxHeight),
    1,
  );
  image.set({
    left: 120,
    top: 250,
    scaleX: scale,
    scaleY: scale,
    originX: "left",
    originY: "top",
    cornerStyle: "circle",
  });
  canvas.add(image);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
  return image;
}
