"use client";

import * as fabric from "fabric";
import Image from "next/image";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Eye,
  ImagePlus,
  Layers,
  Loader2,
  Minus,
  MousePointer2,
  Palette,
  Plus,
  Redo2,
  Save,
  Search,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addElementObject,
  addImageObject,
  applyBackground,
  applyTemplateToCanvas,
  createStudioCanvas,
  STUDIO_HEIGHT,
  STUDIO_WIDTH,
} from "@/lib/invitation-studio/canvas";
import { STUDIO_ELEMENTS } from "@/lib/invitation-studio/elements";
import { DEFAULT_FONT, STUDIO_FONTS } from "@/lib/invitation-studio/fonts";
import {
  deleteStudioDocument,
  listStudioDocuments,
  loadLatestStudioDocument,
  saveStudioDocument,
} from "@/lib/invitation-studio/storage";
import {
  STUDIO_TEMPLATES,
  STUDIO_TEMPLATE_CATEGORIES,
} from "@/lib/invitation-studio/templates";
import type {
  StudioBackground,
  StudioDocument,
  StudioTemplate,
  StudioTemplateCategory,
} from "@/lib/invitation-studio/types";

type Panel =
  | "templates"
  | "elements"
  | "text"
  | "uploads"
  | "backgrounds"
  | "colors"
  | "fonts"
  | "documents";

const PANEL_ITEMS: { id: Panel; label: string; icon: React.ReactNode }[] = [
  { id: "templates", label: "Templates", icon: <Layers className="size-4" /> },
  { id: "elements", label: "Elements", icon: <Sparkles className="size-4" /> },
  { id: "text", label: "Text", icon: <Type className="size-4" /> },
  { id: "uploads", label: "Uploads", icon: <Upload className="size-4" /> },
  { id: "backgrounds", label: "Backgrounds", icon: <Palette className="size-4" /> },
  { id: "colors", label: "Colors", icon: <Palette className="size-4" /> },
  { id: "fonts", label: "Fonts", icon: <Type className="size-4" /> },
  { id: "documents", label: "My designs", icon: <MousePointer2 className="size-4" /> },
];

const COLOR_PALETTES = [
  { name: "Luxury", colors: ["#430d1b", "#0d2c27", "#111827", "#c6a15b", "#f4e8cf"] },
  { name: "Pastel", colors: ["#f8dfe5", "#d9c7ea", "#c8dceb", "#f4e6ae", "#c7e4d4"] },
  { name: "Romantic", colors: ["#7d3f4c", "#b6788d", "#d8a9b4", "#f1d8da", "#fff8f2"] },
  { name: "Cinematic", colors: ["#08080a", "#4a0e18", "#d4af69", "#f4ead6", "#8e1d2c"] },
  { name: "Botanical", colors: ["#32503c", "#6f7c5a", "#a78b62", "#e4ecdd", "#f8f1df"] },
  { name: "Classic", colors: ["#5d4438", "#c5a46d", "#e8dcc4", "#fbf7ef", "#ffffff"] },
];

const BACKGROUND_PRESETS = [
  "#ffffff",
  "#fbf7ef",
  "#f4f1ea",
  "#fceef0",
  "#e8efe3",
  "#101a3a",
  "#260710",
  "#0b0b0d",
  "#efe4cb",
  "#14251e",
];

function backgroundStyle(background: StudioBackground) {
  if (background.type === "solid") return { background: background.color };
  return {
    background: `linear-gradient(${background.angle ?? 135}deg, ${background.colors[0]}, ${background.colors[1]})`,
  };
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

function objectTypeLabel(object: fabric.FabricObject | null) {
  if (!object) return "Canvas";
  if (object instanceof fabric.Textbox || object instanceof fabric.IText) return "Text";
  if (object instanceof fabric.FabricImage) return "Image";
  return "Shape";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}


export function StudioEditor() {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef({ items: [] as string[], index: -1 });
  const saveTimerRef = useRef<number | null>(null);
  const suppressHistoryRef = useRef(true);
  const titleRef = useRef("Untitled invitation");
  const clipboardRef = useRef<Record<string, unknown> | null>(null);
  const docIdRef = useRef(crypto.randomUUID());
  const templateIdRef = useRef(STUDIO_TEMPLATES[0].id);
  const backgroundRef = useRef<StudioBackground>(STUDIO_TEMPLATES[0].background);

  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("Untitled invitation");
  const [templateId, setTemplateId] = useState(STUDIO_TEMPLATES[0].id);
  const [background, setBackground] = useState<StudioBackground>(
    STUDIO_TEMPLATES[0].background,
  );
  const [selected, setSelected] = useState<fabric.FabricObject | null>(null);
  const [panel, setPanel] = useState<Panel>("templates");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templateCategory, setTemplateCategory] = useState<
    "all" | StudioTemplateCategory
  >("all");
  const [templateQuery, setTemplateQuery] = useState("");
  const [elementCategory, setElementCategory] = useState("All");
  const [zoom, setZoom] = useState(0.75);
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gradientStart, setGradientStart] = useState("#260710");
  const [gradientEnd, setGradientEnd] = useState("#520f22");
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [tick, setTick] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    titleRef.current = title;
    templateIdRef.current = templateId;
    backgroundRef.current = background;
  }, [title, templateId, background]);

  const selectedType = objectTypeLabel(selected);
  const isText = Boolean(
    selected && (selected instanceof fabric.Textbox || selected instanceof fabric.IText),
  );
  const isImage = selected instanceof fabric.FabricImage;
  const isGroup = selected instanceof fabric.Group;

  const objectValue = useCallback(
    (key: string, fallback: unknown = "") => {
      void tick;
      if (!selected) return fallback;
      const value = selected.get(key as never);
      return value ?? fallback;
    },
    [selected, tick],
  );

  useEffect(() => {
    Promise.all(
      STUDIO_FONTS.map((font) =>
        document.fonts.load(`16px "${font.name}"`).catch(() => undefined),
      ),
    ).then(() => {
      canvasRef.current?.requestRenderAll();
    });
  }, []);

  const canvasJson = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? JSON.stringify(canvas.toJSON()) : "{}";
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      setDocuments(await listStudioDocuments());
    } catch {
      setDocuments([]);
    }
  }, []);

  const saveNow = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatus("saving");
    const now = new Date().toISOString();
    const existing = await listStudioDocuments().catch(() => []);
    const previous = existing.find((item) => item.id === docIdRef.current);
    const doc: StudioDocument = {
      id: docIdRef.current,
      title: titleRef.current.trim() || "Untitled invitation",
      templateId: templateIdRef.current,
      width: STUDIO_WIDTH,
      height: STUDIO_HEIGHT,
      background: backgroundRef.current,
      canvasJson: canvasJson(),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveStudioDocument(doc);
      setStatus("saved");
      await refreshDocuments();
    } catch {
      setStatus("unsaved");
    }
  }, [canvasJson, refreshDocuments]);

  const queueSave = useCallback(() => {
    setStatus("unsaved");
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void saveNow();
    }, 900);
  }, [saveNow]);

  const pushHistory = useCallback(() => {
    if (suppressHistoryRef.current) return;
    const json = canvasJson();
    const history = historyRef.current;
    if (history.items[history.index] === json) return;
    history.items = history.items.slice(0, history.index + 1);
    history.items.push(json);
    history.index = history.items.length - 1;
    setCanUndo(history.index > 0);
    setCanRedo(false);
    queueSave();
  }, [canvasJson, queueSave]);

  const setCanvasSelection = useCallback((object: fabric.FabricObject | null) => {
    setSelected(object);
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    const element = canvasElementRef.current;
    if (!element) return;
    const canvas = createStudioCanvas(element);
    canvasRef.current = canvas;

    const onSelection = (event: { selected?: fabric.FabricObject[] }) => {
      setCanvasSelection(event.selected?.[0] ?? null);
    };
    const onCleared = () => setCanvasSelection(null);
    const onModified = () => {
      pushHistory();
    };
    const onEditEntered = () => setCanvasSelection(canvas.getActiveObject() ?? null);
    const onEditExited = () => {
      setCanvasSelection(canvas.getActiveObject() ?? null);
      pushHistory();
    };

    canvas.on("selection:created", onSelection);
    canvas.on("selection:updated", onSelection);
    canvas.on("selection:cleared", onCleared);
    canvas.on("object:modified", onModified);
    canvas.on("object:added", onModified);
    canvas.on("object:removed", onModified);
    canvas.on("text:editing:entered", onEditEntered);
    canvas.on("text:editing:exited", onEditExited);

    let active = true;
    async function initialize() {
      await document.fonts.ready.catch(() => undefined);
      if (!active) return;
      await refreshDocuments();
      let doc: StudioDocument | null = null;
      try {
        doc = await loadLatestStudioDocument();
      } catch {
        doc = null;
      }
      if (!active) return;
      suppressHistoryRef.current = true;
      if (doc) {
        try {
          await canvas.loadFromJSON(doc.canvasJson);
          if (!active) return;
          canvas.requestRenderAll();
          docIdRef.current = doc.id;
          templateIdRef.current = doc.templateId;
          backgroundRef.current = doc.background;
          setTitle(doc.title);
          setTemplateId(doc.templateId);
          setBackground(doc.background);
        } catch {
          if (!active) return;
          await applyTemplateToCanvas(canvas, STUDIO_TEMPLATES[0]);
        }
      } else {
        await applyTemplateToCanvas(canvas, STUDIO_TEMPLATES[0]);
        if (!active) return;
        titleRef.current = STUDIO_TEMPLATES[0].name;
        setTitle(STUDIO_TEMPLATES[0].name);
      }
      if (!active) return;
      suppressHistoryRef.current = false;
      historyRef.current = { items: [canvasJson()], index: 0 };
      setCanUndo(false);
      setCanRedo(false);
      setReady(true);
      setStatus("saved");
    }

    void initialize();

    return () => {
      active = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      canvas.dispose();
      canvasRef.current = null;
    };
    // The canvas is initialized once; handlers use refs for current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyTemplate(template: StudioTemplate) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      canvas.getObjects().length > 0 &&
      !window.confirm(`Ganti desain dengan template "${template.name}"?`)
    ) {
      return;
    }
    suppressHistoryRef.current = true;
    await applyTemplateToCanvas(canvas, template);
    suppressHistoryRef.current = false;
    docIdRef.current = crypto.randomUUID();
    templateIdRef.current = template.id;
    backgroundRef.current = template.background;
    titleRef.current = template.name;
    setTemplateId(template.id);
    setBackground(template.background);
    setTitle(template.name);
    setSelected(null);
    historyRef.current = { items: [canvasJson()], index: 0 };
    setCanUndo(false);
    setCanRedo(false);
    setTick((value) => value + 1);
    setStatus("unsaved");
    await saveNow();
  }

  function updateSelected(patch: Record<string, unknown>) {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    object.set(patch as never);
    object.setCoords();
    canvas.requestRenderAll();
    setTick((value) => value + 1);
    pushHistory();
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    canvas.remove(object);
    canvas.discardActiveObject();
    setSelected(null);
    canvas.requestRenderAll();
    pushHistory();
  }

  async function duplicateSelected() {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    const clone = await object.clone();
    clone.set({
      left: Number(object.left ?? 0) + 24,
      top: Number(object.top ?? 0) + 24,
    });
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    setSelected(clone);
    pushHistory();
  }

  function copySelected() {
    const object = canvasRef.current?.getActiveObject();
    if (!object) return;
    clipboardRef.current = object.toObject() as unknown as Record<string, unknown>;
  }

  async function pasteClipboard() {
    const canvas = canvasRef.current;
    const data = clipboardRef.current;
    if (!canvas || !data) return;
    const objects = (await fabric.util.enlivenObjects([
      data as never,
    ])) as fabric.FabricObject[];
    const object = objects[0];
    if (!object) return;
    object.set({
      left: Number(object.left ?? 0) + 28,
      top: Number(object.top ?? 0) + 28,
    });
    object.setCoords();
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelected(object);
    pushHistory();
  }

  function moveLayer(direction: "up" | "down" | "front" | "back") {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    if (direction === "up") canvas.bringObjectForward(object);
    if (direction === "down") canvas.sendObjectBackwards(object);
    if (direction === "front") canvas.bringObjectToFront(object);
    if (direction === "back") canvas.sendObjectToBack(object);
    canvas.requestRenderAll();
    pushHistory();
  }

  function addTextPreset(
    kind: "heading" | "subheading" | "body" | "date" | "venue" | "names" | "custom",
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const presets = {
      heading: { text: "Your Heading", fontSize: 48, fontFamily: "Playfair Display", fill: "#5d4438" },
      subheading: { text: "A beautiful subheading", fontSize: 24, fontFamily: "Cormorant Garamond", fill: "#7d6b5c" },
      body: { text: "Write your invitation message here.", fontSize: 18, fontFamily: "Lato", fill: "#5d4438" },
      date: { text: "Saturday, 12 December 2026", fontSize: 18, fontFamily: "Montserrat", fill: "#5d4438" },
      venue: { text: "The Grand Ballroom · Jakarta", fontSize: 18, fontFamily: "Montserrat", fill: "#5d4438" },
      names: { text: "Maya & Arka", fontSize: 58, fontFamily: "Playfair Display", fill: "#5d4438" },
      custom: { text: "Custom text", fontSize: 24, fontFamily: DEFAULT_FONT, fill: "#5d4438" },
    } as const;
    const preset = presets[kind];
    const object = new fabric.Textbox(preset.text, {
      left: 90,
      top: 250,
      width: 420,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fill: preset.fill,
      textAlign: "center",
      originX: "left",
      originY: "top",
      editable: true,
      objectCaching: false,
    });
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelected(object);
    setPanel("text");
    pushHistory();
  }

  async function addElement(definition: (typeof STUDIO_ELEMENTS)[number]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const object = await addElementObject(
      canvas,
      definition.kind,
      definition.shape,
      definition.svg,
      definition.defaultColor ?? "#c5a46d",
      definition.defaultWidth ?? 160,
    );
    if (object) {
      setSelected(object);
      pushHistory();
    }
  }

  async function uploadImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 8 MB.");
      return;
    }
    setUploadError(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUrl) {
      setUploadError("Gambar gagal dibaca. Coba lagi.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const object = await addImageObject(canvas, dataUrl);
    setSelected(object);
    pushHistory();
  }

  async function replaceSelectedImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 8 MB.");
      return;
    }
    setUploadError(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUrl) return;
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !(object instanceof fabric.FabricImage)) return;
    const replacement = await fabric.FabricImage.fromURL(dataUrl, {
      crossOrigin: null,
    });
    const previousWidth = Number(object.getScaledWidth?.() ?? object.width ?? 200);
    const scale = previousWidth / (replacement.width || previousWidth);
    replacement.set({
      left: object.left,
      top: object.top,
      angle: object.angle,
      opacity: object.opacity,
      scaleX: scale,
      scaleY: scale,
      originX: "left",
      originY: "top",
    });
    canvas.remove(object);
    canvas.add(replacement);
    canvas.setActiveObject(replacement);
    canvas.requestRenderAll();
    setSelected(replacement);
    pushHistory();
  }

  function setCanvasBackground(next: StudioBackground) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyBackground(canvas, next);
    backgroundRef.current = next;
    setBackground(next);
    canvas.requestRenderAll();
    pushHistory();
  }

  function applyPalette(colors: string[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const paint = (object: fabric.FabricObject, index: number) => {
      if (object instanceof fabric.Group) {
        object.getObjects().forEach((child, childIndex) => paint(child, index + childIndex));
        return;
      }
      const fill = object.get("fill");
      if (typeof fill === "string" && fill !== "transparent") {
        object.set("fill", colors[(index + 1) % colors.length] as never);
      }
      const stroke = object.get("stroke");
      if (typeof stroke === "string" && stroke) {
        object.set("stroke", colors[(index + 2) % colors.length] as never);
      }
    };
    canvas.getObjects().forEach((object, index) => paint(object, index));
    applyBackground(canvas, { type: "solid", color: colors[0] });
    backgroundRef.current = { type: "solid", color: colors[0] };
    setBackground({ type: "solid", color: colors[0] });
    canvas.requestRenderAll();
    pushHistory();
    setTick((value) => value + 1);
  }

  function setGroupColor(color: string) {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !(object instanceof fabric.Group)) return;
    const paint = (item: fabric.FabricObject) => {
      if (item instanceof fabric.Group) {
        item.getObjects().forEach(paint);
        return;
      }
      const fill = item.get("fill");
      if (typeof fill === "string" && fill !== "transparent" && fill !== "none") {
        item.set("fill", color as never);
      }
      const stroke = item.get("stroke");
      if (typeof stroke === "string" && stroke && stroke !== "none") {
        item.set("stroke", color as never);
      }
    };
    paint(object);
    canvas.requestRenderAll();
    setTick((value) => value + 1);
    pushHistory();
  }

  async function restoreHistory(index: number) {
    const canvas = canvasRef.current;
    const snapshot = historyRef.current.items[index];
    if (!canvas || !snapshot) return;
    suppressHistoryRef.current = true;
    await canvas.loadFromJSON(snapshot);
    canvas.requestRenderAll();
    setSelected(canvas.getActiveObject() ?? null);
    suppressHistoryRef.current = false;
    historyRef.current.index = index;
    setCanUndo(index > 0);
    setCanRedo(index < historyRef.current.items.length - 1);
    setTick((value) => value + 1);
    setStatus("unsaved");
    queueSave();
  }

  async function exportImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await document.fonts.ready.catch(() => undefined);
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    downloadDataUrl(
      dataUrl,
      `${(titleRef.current || "kefoo-invitation").replace(/\s+/g, "-")}.png`,
    );
  }

  async function exportPdf() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await document.fonts.ready.catch(() => undefined);
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [STUDIO_WIDTH, STUDIO_HEIGHT],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, STUDIO_WIDTH, STUDIO_HEIGHT);
    pdf.save(
      `${(titleRef.current || "kefoo-invitation").replace(/\s+/g, "-")}.pdf`,
    );
  }


  async function openDocument(doc: StudioDocument) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    suppressHistoryRef.current = true;
    await canvas.loadFromJSON(doc.canvasJson);
    canvas.requestRenderAll();
    docIdRef.current = doc.id;
    templateIdRef.current = doc.templateId;
    backgroundRef.current = doc.background;
    titleRef.current = doc.title;
    setTitle(doc.title);
    setTemplateId(doc.templateId);
    setBackground(doc.background);
    suppressHistoryRef.current = false;
    historyRef.current = { items: [canvasJson()], index: 0 };
    setCanUndo(false);
    setCanRedo(false);
    setSelected(canvas.getActiveObject() ?? null);
    setTick((value) => value + 1);
    setStatus("saved");
    setPanel("templates");
  }

  async function removeDocument(doc: StudioDocument) {
    if (!window.confirm(`Hapus desain "${doc.title}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    await deleteStudioDocument(doc.id);
    await refreshDocuments();
    if (doc.id === docIdRef.current) {
      docIdRef.current = crypto.randomUUID();
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const canvas = canvasRef.current;
      if (!canvas || (canvas.getActiveObject() as { isEditing?: boolean } | null)?.isEditing) return;
      const mod = event.metaKey || event.ctrlKey;
      if (event.key === "Delete" || event.key === "Backspace") {
        if (canvas.getActiveObject()) {
          event.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          if (historyRef.current.index < historyRef.current.items.length - 1) {
            void restoreHistory(historyRef.current.index + 1);
          }
        } else if (historyRef.current.index > 0) {
          void restoreHistory(historyRef.current.index - 1);
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        void duplicateSelected();
      }
      if (mod && event.key.toLowerCase() === "c") {
        copySelected();
      }
      if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        void pasteClipboard();
      }
      if (event.key === "Escape") {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        setSelected(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Handlers use current refs; register once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTemplates = useMemo(() => {
    const needle = templateQuery.trim().toLowerCase();
    return STUDIO_TEMPLATES.filter((template) => {
      if (templateCategory !== "all" && template.category !== templateCategory) {
        return false;
      }
      if (!needle) return true;
      return `${template.name} ${template.description}`
        .toLowerCase()
        .includes(needle);
    });
  }, [templateCategory, templateQuery]);

  const elementCategories = useMemo(
    () => ["All", ...Array.from(new Set(STUDIO_ELEMENTS.map((item) => item.category)))],
    [],
  );
  const visibleElements = useMemo(
    () =>
      STUDIO_ELEMENTS.filter(
        (item) => elementCategory === "All" || item.category === elementCategory,
      ),
    [elementCategory],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e9e5dd] text-ink">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-cocoa/10 bg-[#faf8f3] px-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-cocoa text-xs font-semibold text-ivory">
            K
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cocoa/45">
              Kefoo Studio
            </p>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                queueSave();
              }}
              aria-label="Design name"
              className="w-40 truncate border-0 bg-transparent p-0 font-heading text-sm font-semibold text-cocoa outline-none focus:ring-0 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (historyRef.current.index > 0) {
                void restoreHistory(historyRef.current.index - 1);
              }
            }}
            disabled={!canUndo}
            className="studio-tool-button"
            aria-label="Undo"
            title="Undo (Ctrl/Cmd+Z)"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (historyRef.current.index < historyRef.current.items.length - 1) {
                void restoreHistory(historyRef.current.index + 1);
              }
            }}
            disabled={!canRedo}
            className="studio-tool-button"
            aria-label="Redo"
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            <Redo2 className="size-4" />
          </button>
          <span className="mx-1 hidden h-5 w-px bg-cocoa/10 sm:block" />
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.35, Number((value - 0.1).toFixed(2))))}
            className="studio-tool-button"
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-[11px] text-cocoa/55">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(2))))}
            className="studio-tool-button"
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] text-cocoa/45 sm:block">
            {status === "saving" ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Menyimpan…
              </span>
            ) : status === "unsaved" ? (
              "Belum tersimpan"
            ) : (
              "Tersimpan lokal"
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              setPreviewUrl(canvas.toDataURL({ format: "png", multiplier: 1.5 }));
              setPreviewOpen(true);
            }}
            className="studio-top-button"
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            type="button"
            onClick={() => void saveNow()}
            className="studio-top-button"
          >
            <Save className="size-4" />
            <span className="hidden sm:inline">Simpan</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((value) => !value)}
              className="studio-top-button bg-cocoa text-ivory hover:bg-cocoa/90"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen ? (
              <div className="absolute right-0 top-11 z-30 w-40 rounded-xl border border-cocoa/10 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    void exportImage();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-cocoa hover:bg-olive-50"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    void exportPdf();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-cocoa hover:bg-olive-50"
                >
                  Download PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside className="z-10 flex w-14 shrink-0 flex-col items-center gap-1 border-r border-cocoa/10 bg-[#f4f1ea] py-3">
          {PANEL_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPanel(item.id);
                setSidebarOpen(true);
              }}
              aria-label={item.label}
              title={item.label}
              className={`flex size-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[8px] transition-colors ${
                panel === item.id && sidebarOpen
                  ? "bg-cocoa text-ivory shadow-sm"
                  : "text-cocoa/55 hover:bg-white hover:text-cocoa"
              }`}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label={sidebarOpen ? "Close panel" : "Open panel"}
            className="mt-auto flex size-9 items-center justify-center rounded-xl text-cocoa/45 hover:bg-white hover:text-cocoa"
          >
            {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </aside>

        {sidebarOpen ? (
          <aside className="z-10 flex w-72 shrink-0 flex-col border-r border-cocoa/10 bg-[#faf8f3] sm:w-80">
            <div className="flex items-center justify-between border-b border-cocoa/10 px-4 py-3">
              <h2 className="font-heading text-sm font-semibold text-cocoa">
                {PANEL_ITEMS.find((item) => item.id === panel)?.label}
              </h2>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1 text-cocoa/40 hover:bg-white hover:text-cocoa"
                aria-label="Close panel"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="studio-panel-scroll flex-1 overflow-y-auto p-4">

              {panel === "templates" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-cocoa/35" />
                    <input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Cari template…" className="w-full rounded-xl border border-cocoa/10 bg-white px-3 py-2 pl-8 text-xs outline-none focus:border-olive-400" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => setTemplateCategory("all")} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${templateCategory === "all" ? "bg-cocoa text-ivory" : "bg-cocoa/5 text-cocoa/60"}`}>All</button>
                    {STUDIO_TEMPLATE_CATEGORIES.map((category) => (
                      <button key={category.id} type="button" onClick={() => setTemplateCategory(category.id)} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${templateCategory === category.id ? "bg-cocoa text-ivory" : "bg-cocoa/5 text-cocoa/60"}`}>{category.label}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTemplates.map((template) => (
                      <button key={template.id} type="button" onClick={() => void applyTemplate(template)} className={`group overflow-hidden rounded-xl border text-left transition-all ${templateId === template.id ? "border-olive-500 ring-2 ring-olive-200" : "border-cocoa/10 hover:-translate-y-0.5 hover:border-olive-300"}`} title={template.description}>
                        <div className="relative flex h-32 flex-col items-center justify-center overflow-hidden px-3 text-center" style={backgroundStyle(template.background)}>
                          <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: template.palette[3] }}>THE WEDDING OF</span>
                          <span className="mt-1 line-clamp-2 font-heading text-[15px] leading-[1.05]" style={{ color: template.palette[3] }}>{template.name}</span>
                          <span className="mt-2 text-[8px] uppercase tracking-[0.18em]" style={{ color: template.palette[3], opacity: 0.75 }}>12 · 12 · 2026</span>
                          <div className="absolute inset-x-3 bottom-3 flex justify-center gap-1">
                            {template.palette.map((color) => <span key={color} className="size-1.5 rounded-full border border-white/30" style={{ backgroundColor: color }} />)}
                          </div>
                        </div>
                        <div className="bg-white px-2.5 py-2">
                          <p className="truncate text-[11px] font-semibold text-cocoa">{template.name}</p>
                          <p className="truncate text-[9px] text-cocoa/45">{template.category === "basic" ? "Basic" : "Movie Inspired"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}


              {panel === "elements" ? (
                <div className="space-y-3">
                  <select value={elementCategory} onChange={(event) => setElementCategory(event.target.value)} className="w-full rounded-xl border border-cocoa/10 bg-white px-3 py-2 text-xs outline-none">
                    {elementCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleElements.map((element) => (
                      <button key={element.id} type="button" onClick={() => void addElement(element)} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-cocoa/10 bg-white px-1 py-2 text-center text-[9px] text-cocoa/65 hover:border-olive-300 hover:bg-olive-50" title={element.label}>
                        <span className="flex size-7 items-center justify-center rounded-lg bg-olive-50 text-cocoa">{element.kind === "shape" ? <Plus className="size-3.5" /> : <Sparkles className="size-3.5" />}</span>
                        <span className="line-clamp-2">{element.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {panel === "text" ? (
                <div className="space-y-2">
                  {[
                    ["heading", "Add heading", "48px display"],
                    ["subheading", "Add subheading", "24px serif"],
                    ["body", "Add body text", "18px sans"],
                    ["date", "Add date & time", "Tanggal acara"],
                    ["venue", "Add venue", "Lokasi acara"],
                    ["names", "Add couple names", "Nama pasangan"],
                    ["custom", "Add custom text", "Teks bebas"],
                  ].map(([key, label, hint]) => (
                    <button key={key} type="button" onClick={() => addTextPreset(key as "heading")} className="flex w-full items-center justify-between rounded-xl border border-cocoa/10 bg-white px-3 py-3 text-left hover:border-olive-300 hover:bg-olive-50">
                      <span><span className="block text-xs font-medium text-cocoa">{label}</span><span className="block text-[10px] text-cocoa/45">{hint}</span></span>
                      <Plus className="size-4 text-cocoa/40" />
                    </button>
                  ))}
                </div>
              ) : null}

              {panel === "uploads" ? (
                <div className="space-y-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-olive-300 bg-olive-50/60 px-4 py-8 text-center hover:bg-olive-50">
                    <ImagePlus className="size-7 text-olive-600" />
                    <span className="text-xs font-medium text-cocoa">Upload image</span>
                    <span className="text-[10px] leading-relaxed text-cocoa/50">JPG, PNG, WEBP · max 8 MB<br />Disimpan lokal di browser ini.</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} />
                  </label>
                  {uploadError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{uploadError}</p> : null}
                  <p className="text-[10px] leading-relaxed text-cocoa/45">Gambar langsung muncul di canvas dan bisa dipindah, di-resize, diputar, atau diganti dari panel Properties.</p>
                </div>
              ) : null}


              {panel === "backgrounds" ? (
                <div className="space-y-4">
                  <p className="text-[10px] leading-relaxed text-cocoa/50">Warna solid langsung diterapkan ke canvas. Gradient tersedia dari palette di bawah.</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUND_PRESETS.map((color) => (
                      <button key={color} type="button" onClick={() => setCanvasBackground({ type: "solid", color })} className="aspect-square rounded-lg border border-cocoa/10 shadow-inner" style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                  <label className="block text-[10px] font-medium text-cocoa/60">Custom color<input type="color" value={background.type === "solid" ? background.color : "#ffffff"} onChange={(event) => setCanvasBackground({ type: "solid", color: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                  <label className="block text-[10px] font-medium text-cocoa/60">HEX<input type="text" placeholder="#5d4438" onChange={(event) => { const value = event.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(value)) setCanvasBackground({ type: "solid", color: value }); }} className="mt-1 w-full rounded-lg border border-cocoa/10 bg-white px-2.5 py-1.5 text-[11px] uppercase outline-none focus:border-olive-400" /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-cocoa/55">Gradient from<input type="color" value={gradientStart} onChange={(event) => setGradientStart(event.target.value)} className="mt-1 block h-8 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                    <label className="text-[10px] text-cocoa/55">Gradient to<input type="color" value={gradientEnd} onChange={(event) => setGradientEnd(event.target.value)} className="mt-1 block h-8 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                  </div>
                  <button type="button" onClick={() => setCanvasBackground({ type: "gradient", colors: [gradientStart, gradientEnd], angle: 135 })} className="w-full rounded-lg bg-cocoa px-3 py-2 text-[10px] font-medium text-ivory">Terapkan gradient</button>
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-cocoa/45">Gradient presets</p>
                    {COLOR_PALETTES.slice(0, 4).map((palette) => (
                      <button key={palette.name} type="button" onClick={() => setCanvasBackground({ type: "gradient", colors: [palette.colors[0], palette.colors[1]], angle: 135 })} className="flex w-full items-center gap-2 rounded-xl border border-cocoa/10 bg-white p-2 text-left hover:border-olive-300">
                        <span className="h-8 flex-1 rounded-md" style={{ background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})` }} />
                        <span className="text-[10px] text-cocoa/60">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {panel === "colors" ? (
                <div className="space-y-4">
                  <p className="text-[10px] leading-relaxed text-cocoa/50">Pilih elemen dulu untuk mengganti warna elemen. Palette menerapkan warna ke seluruh elemen yang punya fill/stroke.</p>
                  {COLOR_PALETTES.map((palette) => (
                    <div key={palette.name} className="space-y-1.5 rounded-xl border border-cocoa/10 bg-white p-2.5">
                      <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-cocoa/65">{palette.name}</span><button type="button" onClick={() => applyPalette([...palette.colors])} className="rounded-full bg-cocoa px-2 py-0.5 text-[9px] text-ivory">Apply</button></div>
                      <div className="flex gap-1.5">{palette.colors.map((color) => <button key={color} type="button" onClick={() => selected ? updateSelected({ fill: color }) : setCanvasBackground({ type: "solid", color })} className="size-7 rounded-full border border-cocoa/10" style={{ backgroundColor: color }} title={color} />)}</div>
                    </div>
                  ))}
                  <label className="block text-[10px] font-medium text-cocoa/60">Custom color<input type="color" value={typeof objectValue("fill") === "string" ? String(objectValue("fill")) : "#5d4438"} onChange={(event) => selected ? updateSelected({ fill: event.target.value }) : setCanvasBackground({ type: "solid", color: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                  <label className="block text-[10px] font-medium text-cocoa/60">HEX<input type="text" placeholder="#5d4438" onChange={(event) => { const value = event.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(value)) { if (selected) updateSelected({ fill: value }); else setCanvasBackground({ type: "solid", color: value }); } }} className="mt-1 w-full rounded-lg border border-cocoa/10 bg-white px-2.5 py-1.5 text-[11px] uppercase outline-none focus:border-olive-400" /></label>
                </div>
              ) : null}

              {panel === "fonts" ? (
                <div className="space-y-1.5">
                  {STUDIO_FONTS.map((font) => (
                    <button key={font.name} type="button" onClick={() => { if (selected && isText) updateSelected({ fontFamily: font.name }); else setPanel("text"); }} className="flex w-full items-center justify-between rounded-xl border border-cocoa/10 bg-white px-3 py-2.5 text-left hover:border-olive-300 hover:bg-olive-50">
                      <span style={{ fontFamily: font.name }} className="truncate text-sm text-cocoa">{font.name}</span>
                      <span className="text-[9px] uppercase tracking-[0.12em] text-cocoa/35">{font.category}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {panel === "documents" ? (
                <div className="space-y-2">
                  <button type="button" onClick={() => void saveNow()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-3 py-2.5 text-xs font-medium text-ivory"><Save className="size-3.5" /> Simpan desain</button>
                  {documents.length === 0 ? <p className="rounded-xl border border-dashed border-cocoa/15 px-3 py-5 text-center text-xs text-cocoa/45">Belum ada desain tersimpan.</p> : null}
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-cocoa/10 bg-white p-2.5">
                      <button type="button" onClick={() => void openDocument(doc)} className="block w-full text-left"><p className="truncate text-xs font-semibold text-cocoa">{doc.title}</p><p className="mt-0.5 text-[9px] text-cocoa/45">{new Date(doc.updatedAt).toLocaleString("id-ID")}</p></button>
                      <button type="button" onClick={() => void removeDocument(doc)} className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium text-rose-600"><Trash2 className="size-3" /> Hapus</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}

        <main className="studio-workspace flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-9 items-center justify-between border-b border-cocoa/10 bg-[#eee9df] px-4 text-[10px] text-cocoa/45">
            <span>Invitation · {STUDIO_WIDTH} × {STUDIO_HEIGHT}px</span>
            <span className="hidden sm:block">Double-click teks untuk edit langsung · Drag untuk memindah · Delete untuk menghapus</span>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-5 sm:p-10">
            <div style={{ width: STUDIO_WIDTH * zoom, height: STUDIO_HEIGHT * zoom }} className="shrink-0">
              <div style={{ width: STUDIO_WIDTH, height: STUDIO_HEIGHT, transform: `scale(${zoom})`, transformOrigin: "top left" }} className="relative overflow-hidden rounded-[2px] bg-white shadow-[0_22px_70px_-24px_rgba(55,38,30,.5)]">
                <canvas ref={canvasElementRef} width={STUDIO_WIDTH} height={STUDIO_HEIGHT} />
                {!ready ? <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="size-6 animate-spin text-cocoa/40" /></div> : null}
              </div>
            </div>
          </div>
          <div className="flex h-9 items-center justify-center gap-2 border-t border-cocoa/10 bg-[#eee9df] text-[10px] text-cocoa/45">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Local autosave aktif · {documents.length} desain tersimpan
          </div>
        </main>

        <aside className="z-10 hidden w-72 shrink-0 overflow-y-auto border-l border-cocoa/10 bg-[#faf8f3] p-3 lg:block xl:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-cocoa">Properties</h2>
            <span className="rounded-full bg-cocoa/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cocoa/45">{selectedType}</span>
          </div>

          {!selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-cocoa/15 bg-white/60 p-4 text-center">
                <MousePointer2 className="mx-auto size-6 text-cocoa/30" />
                <p className="mt-2 text-xs font-medium text-cocoa/60">Pilih elemen di canvas</p>
                <p className="mt-1 text-[10px] leading-relaxed text-cocoa/40">Klik teks, gambar, atau dekorasi untuk mengatur ukuran, warna, rotasi, dan layer.</p>
              </div>
              <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Background</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {BACKGROUND_PRESETS.map((color) => <button key={color} type="button" onClick={() => setCanvasBackground({ type: "solid", color })} className="aspect-square rounded-md border border-cocoa/10" style={{ backgroundColor: color }} aria-label={color} />)}
                </div>
                <label className="block text-[10px] text-cocoa/50">Custom<input type="color" value={background.type === "solid" ? background.color : "#ffffff"} onChange={(event) => setCanvasBackground({ type: "solid", color: event.target.value })} className="mt-1 block h-8 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void duplicateSelected()} className="studio-property-action" title="Duplicate"><Copy className="size-3.5" /></button>
                <button type="button" onClick={() => moveLayer("front")} className="studio-property-action" title="Bring to front"><ArrowUp className="size-3.5" /></button>
                <button type="button" onClick={() => moveLayer("up")} className="studio-property-action" title="Bring forward"><ChevronUp className="size-3.5" /></button>
                <button type="button" onClick={() => moveLayer("down")} className="studio-property-action" title="Send backward"><ChevronDown className="size-3.5" /></button>
                <button type="button" onClick={() => moveLayer("back")} className="studio-property-action" title="Send to back"><ArrowDown className="size-3.5" /></button>
                <button type="button" onClick={deleteSelected} className="studio-property-action ml-auto text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="size-3.5" /></button>
              </div>


              {isText ? (
                <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Text</label>
                  <textarea value={String(objectValue("text"))} onChange={(event) => updateSelected({ text: event.target.value })} rows={3} className="w-full resize-y rounded-xl border border-cocoa/10 bg-[#faf8f3] px-2.5 py-2 text-xs outline-none focus:border-olive-400" />
                  <select value={String(objectValue("fontFamily", DEFAULT_FONT))} onChange={(event) => updateSelected({ fontFamily: event.target.value })} className="w-full rounded-xl border border-cocoa/10 bg-white px-2.5 py-2 text-xs outline-none">
                    {STUDIO_FONTS.map((font) => <option key={font.name} value={font.name}>{font.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-cocoa/50">Size<input type="number" value={Number(objectValue("fontSize", 24))} onChange={(event) => updateSelected({ fontSize: Number(event.target.value) || 1 })} className="studio-number-input" /></label>
                    <label className="text-[10px] text-cocoa/50">Letter spacing<input type="number" value={Number(objectValue("charSpacing", 0))} onChange={(event) => updateSelected({ charSpacing: Number(event.target.value) || 0 })} className="studio-number-input" /></label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => updateSelected({ fontWeight: objectValue("fontWeight") === "bold" ? "normal" : "bold" })} className={`studio-format-button ${objectValue("fontWeight") === "bold" ? "is-active" : ""}`}>B</button>
                    <button type="button" onClick={() => updateSelected({ fontStyle: objectValue("fontStyle") === "italic" ? "normal" : "italic" })} className={`studio-format-button italic ${objectValue("fontStyle") === "italic" ? "is-active" : ""}`}>I</button>
                    <span className="mx-1 h-4 w-px bg-cocoa/10" />
                    <button type="button" onClick={() => updateSelected({ textAlign: "left" })} className={`studio-format-button ${objectValue("textAlign") === "left" ? "is-active" : ""}`}><AlignLeft className="size-3.5" /></button>
                    <button type="button" onClick={() => updateSelected({ textAlign: "center" })} className={`studio-format-button ${objectValue("textAlign") === "center" ? "is-active" : ""}`}><AlignCenter className="size-3.5" /></button>
                    <button type="button" onClick={() => updateSelected({ textAlign: "right" })} className={`studio-format-button ${objectValue("textAlign") === "right" ? "is-active" : ""}`}><AlignRight className="size-3.5" /></button>
                    <input type="color" value={String(objectValue("fill", "#5d4438"))} onChange={(event) => updateSelected({ fill: event.target.value })} className="ml-auto size-7 cursor-pointer rounded-md border border-cocoa/10 bg-white p-0.5" title="Text color" />
                  </div>
                  <label className="block text-[10px] text-cocoa/50">Line height<input type="number" step="0.05" value={Number(objectValue("lineHeight", 1.16))} onChange={(event) => updateSelected({ lineHeight: Number(event.target.value) || 1 })} className="studio-number-input" /></label>
                </div>
              ) : null}


              {isImage ? (
                <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Image</p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-olive-300 bg-olive-50 px-3 py-2.5 text-xs text-olive-700">
                    <ImagePlus className="size-3.5" /> Ganti gambar
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void replaceSelectedImage(file); event.currentTarget.value = ""; }} />
                  </label>
                  <p className="text-[10px] leading-relaxed text-cocoa/45">Gunakan handle di canvas untuk resize dan rotate.</p>
                </div>
              ) : null}

              {isGroup ? (
                <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Decoration</p>
                  <label className="flex items-center justify-between text-[10px] text-cocoa/55">Color<input type="color" defaultValue="#c5a46d" onChange={(event) => setGroupColor(event.target.value)} className="size-8 cursor-pointer rounded-lg border border-cocoa/10 bg-white p-0.5" /></label>
                  <p className="text-[10px] leading-relaxed text-cocoa/45">Warna diterapkan ke seluruh path dekorasi.</p>
                </div>
              ) : null}

              {!isText && !isImage && !isGroup ? (
                <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Shape</p>
                  <label className="flex items-center justify-between text-[10px] text-cocoa/55">Fill<input type="color" value={typeof objectValue("fill") === "string" ? String(objectValue("fill")) : "#c5a46d"} onChange={(event) => updateSelected({ fill: event.target.value })} className="size-8 cursor-pointer rounded-lg border border-cocoa/10 bg-white p-0.5" /></label>
                  <label className="flex items-center justify-between text-[10px] text-cocoa/55">Border<input type="color" value={typeof objectValue("stroke") === "string" ? String(objectValue("stroke")) : "#c5a46d"} onChange={(event) => updateSelected({ stroke: event.target.value, strokeWidth: Number(objectValue("strokeWidth", 1)) || 1 })} className="size-8 cursor-pointer rounded-lg border border-cocoa/10 bg-white p-0.5" /></label>
                </div>
              ) : null}

              <div className="space-y-2 rounded-2xl border border-cocoa/10 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/45">Position & size</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-cocoa/50">X<input type="number" value={Math.round(Number(objectValue("left", 0)))} onChange={(event) => updateSelected({ left: Number(event.target.value) })} className="studio-number-input" /></label>
                  <label className="text-[10px] text-cocoa/50">Y<input type="number" value={Math.round(Number(objectValue("top", 0)))} onChange={(event) => updateSelected({ top: Number(event.target.value) })} className="studio-number-input" /></label>
                  <label className="text-[10px] text-cocoa/50">W<input type="number" value={Math.round(Number(objectValue("width", 0)))} onChange={(event) => updateSelected({ width: Math.max(10, Number(event.target.value)) })} className="studio-number-input" /></label>
                  <label className="text-[10px] text-cocoa/50">H<input type="number" value={Math.round(Number(objectValue("height", 0)))} onChange={(event) => updateSelected({ height: Math.max(10, Number(event.target.value)) })} className="studio-number-input" /></label>
                  <label className="text-[10px] text-cocoa/50">Rotation<input type="number" value={Math.round(Number(objectValue("angle", 0)))} onChange={(event) => updateSelected({ angle: Number(event.target.value) })} className="studio-number-input" /></label>
                  <label className="text-[10px] text-cocoa/50">Opacity<input type="number" min="0" max="100" value={Math.round(Number(objectValue("opacity", 1)) * 100)} onChange={(event) => updateSelected({ opacity: Math.min(1, Math.max(0, Number(event.target.value) / 100)) })} className="studio-number-input" /></label>
                </div>
              </div>

              <button type="button" onClick={() => void saveNow()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-3 py-2.5 text-xs font-medium text-ivory"><Save className="size-3.5" /> Simpan perubahan</button>
            </div>
          )}
        </aside>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-auto rounded-2xl bg-[#f7f2e8] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-heading text-sm font-semibold text-cocoa">Preview · {title}</p>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview" className="rounded-lg p-1.5 text-cocoa/50 hover:bg-white"><X className="size-4" /></button>
            </div>
            {previewUrl ? <Image src={previewUrl} alt={`Preview ${title}`} width={STUDIO_WIDTH} height={STUDIO_HEIGHT} unoptimized className="mx-auto max-h-[78vh] w-auto rounded-lg shadow-lg" /> : null}
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => void exportImage()} className="rounded-lg bg-cocoa px-3 py-2 text-xs font-medium text-ivory">Download PNG</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
