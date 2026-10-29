"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  ImagePlus,
  Layers,
  Loader2,
  Music2,
  Pause,
  Play,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorStage } from "@/components/video-studio/editor-stage";
import { VideoCanvas } from "@/components/video-studio/video-canvas";
import { STUDIO_FONTS } from "@/lib/invitation-studio/fonts";
import {
  cloneDraft,
  createDecorElement,
  createDraftFromTemplate,
  createPhotoElement,
  createTextElement,
} from "@/lib/video-studio/draft";
import {
  exportInvitationVideo,
  type ExportProgress,
  type ExportResult,
} from "@/lib/video-studio/export";
import {
  getSceneTimeline,
  loadImage,
  preloadDraftImages,
  sceneAt,
  totalDuration,
} from "@/lib/video-studio/render";
import {
  loadVideoDraft,
  saveVideoDraft,
} from "@/lib/video-studio/storage";
import {
  ANIMATION_PRESETS,
  DECORATIVE_ASSETS,
  SCENE_TRANSITIONS,
  VIDEO_TEMPLATES,
  decorativeAssetLabel,
} from "@/lib/video-studio/templates";
import type {
  AnimationPreset,
  DecorativeAsset,
  InvitationData,
  InvitationElement,
  SceneTransition,
  TextElement,
  VideoDraft,
} from "@/lib/video-studio/types";

const fieldClass =
  "mt-1 w-full rounded-lg border border-cocoa/10 bg-white px-2.5 py-2 text-[11px] text-cocoa outline-none focus:border-[#9d7d5b]";
const labelClass = "block text-[10px] font-medium text-cocoa/55";

type EditorProps = {
  initialTemplateId?: string;
  initialDraftId?: string;
};

type Tab = "content" | "elements" | "design" | "scenes";

export function VideoEditor({ initialTemplateId, initialDraftId }: EditorProps) {
  const [draft, setDraft] = useState<VideoDraft | null>(null);
  const draftRef = useRef<VideoDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState("");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    percent: 0,
    message: "",
  });
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const historyRef = useRef<{ items: VideoDraft[]; index: number }>({
    items: [],
    index: -1,
  });
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      let loaded: VideoDraft | null = null;
      if (initialDraftId) {
        loaded = await loadVideoDraft(initialDraftId).catch(() => null);
      }
      if (!loaded) {
        loaded =
          createDraftFromTemplate(
            initialTemplateId ?? VIDEO_TEMPLATES[0].id,
          ) ?? createDraftFromTemplate(VIDEO_TEMPLATES[0].id);
      }
      if (!loaded || !active) return;
      await preloadDraftImages(loaded);
      if (!active) return;
      draftRef.current = loaded;
      setDraft(loaded);
      setCurrentSceneId(loaded.scenes[0]?.id ?? "");
      setTime(1.6);
      historyRef.current = { items: [cloneDraft(loaded)], index: 0 };
      setCanUndo(false);
      setCanRedo(false);
      setReady(true);
    }
    void load();
    return () => {
      active = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [initialDraftId, initialTemplateId]);

  useEffect(() => {
    if (!ready || !draft) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void saveNow();
    }, 900);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [draft, ready]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.currentTime = time % Math.max(audio.duration || 1, 1);
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
    // Only react to play/pause; time is updated continuously by the preview.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, draft?.audio?.dataUrl]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (exportResult) URL.revokeObjectURL(exportResult.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => draft?.elements.find((element) => element.id === selectedId) ?? null,
    [draft, selectedId],
  );
  const timeline = useMemo(
    () => (draft ? getSceneTimeline(draft.scenes) : []),
    [draft],
  );
  const duration = draft ? totalDuration(draft.scenes) : 0;

  async function saveNow() {
    const current = draftRef.current;
    if (!current) return;
    setStatus("saving");
    try {
      await saveVideoDraft(current);
      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          `/studio/video/editor?draft=${current.id}`,
        );
      }
      setStatus("saved");
    } catch {
      setStatus("unsaved");
      setMessage("Draft gagal disimpan di browser ini.");
    }
  }

  function commit(next: VideoDraft, push = true) {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    draftRef.current = updated;
    setDraft(updated);
    setStatus("unsaved");
    if (!push) return;
    const history = historyRef.current;
    const currentSnapshot = history.items[history.index];
    if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(updated)) {
      return;
    }
    history.items = history.items.slice(0, history.index + 1);
    history.items.push(cloneDraft(updated));
    history.index = history.items.length - 1;
    setCanUndo(history.index > 0);
    setCanRedo(false);
  }

  function mutate(mutator: (next: VideoDraft) => void, push = true) {
    const current = draftRef.current;
    if (!current) return;
    const next = cloneDraft(current);
    mutator(next);
    commit(next, push);
  }

  function commitCurrent() {
    const current = draftRef.current;
    if (!current) return;
    const history = historyRef.current;
    const snapshot = history.items[history.index];
    if (snapshot && JSON.stringify(snapshot) !== JSON.stringify(current)) {
      history.items.push(cloneDraft(current));
      history.index = history.items.length - 1;
      setCanUndo(history.index > 0);
      setCanRedo(false);
    }
  }

  function undo() {
    const history = historyRef.current;
    if (history.index <= 0) return;
    history.index -= 1;
    const restored = cloneDraft(history.items[history.index]);
    draftRef.current = restored;
    setDraft(restored);
    setSelectedId(null);
    setCurrentSceneId(restored.scenes[0]?.id ?? "");
    setTime(1.6);
    setCanUndo(history.index > 0);
    setCanRedo(history.index < history.items.length - 1);
    setStatus("unsaved");
  }

  function redo() {
    const history = historyRef.current;
    if (history.index >= history.items.length - 1) return;
    history.index += 1;
    const restored = cloneDraft(history.items[history.index]);
    draftRef.current = restored;
    setDraft(restored);
    setSelectedId(null);
    setCurrentSceneId(restored.scenes[0]?.id ?? "");
    setTime(1.6);
    setCanUndo(history.index > 0);
    setCanRedo(history.index < history.items.length - 1);
    setStatus("unsaved");
  }

  function selectScene(sceneId: string, seek = true) {
    setCurrentSceneId(sceneId);
    setPlaying(false);
    if (!seek || !draftRef.current) return;
    const entry = getSceneTimeline(draftRef.current.scenes).find(
      (item) => item.scene.id === sceneId,
    );
    if (entry) {
      setTime(entry.start + 1.2);
      if (audioRef.current) audioRef.current.currentTime = entry.start + 1.2;
    }
    setSelectedId(null);
  }

  function handleTime(next: number) {
    setTime(next);
    const current = draftRef.current;
    if (!current) return;
    const entry = sceneAt(current.scenes, next);
    if (entry && entry.scene.id !== currentSceneId) {
      setCurrentSceneId(entry.scene.id);
    }
  }

  function updateData(key: keyof InvitationData, value: string) {
    mutate((next) => {
      next.data[key] = value;
    });
  }

  function updateScene(
    sceneId: string,
    patch: Partial<{ duration: number; transition: SceneTransition; title: string }>,
  ) {
    mutate((next) => {
      const scene = next.scenes.find((item) => item.id === sceneId);
      if (scene) Object.assign(scene, patch);
    });
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    mutate((next) => {
      const index = next.scenes.findIndex((scene) => scene.id === sceneId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.scenes.length) return;
      const [scene] = next.scenes.splice(index, 1);
      next.scenes.splice(target, 0, scene);
    });
    setPlaying(false);
  }


  function updateElement(element: InvitationElement, push = true) {
    mutate((next) => {
      const index = next.elements.findIndex((item) => item.id === element.id);
      if (index >= 0) next.elements[index] = element;
    }, push);
  }

  function addText() {
    const current = draftRef.current;
    if (!current) return;
    const element = createTextElement(currentSceneId, 80, 390, {
      fontFamily: current.theme.displayFont,
      color: current.theme.ink,
      fontSize: 30,
    });
    mutate((next) => {
      next.elements.push(element);
    });
    setSelectedId(element.id);
    setTab("content");
  }

  function addDecor(asset: DecorativeAsset) {
    const current = draftRef.current;
    if (!current) return;
    const element = createDecorElement(currentSceneId, 40, 40, {
      asset,
      color: current.theme.accent,
      secondaryColor: current.theme.accentSoft,
      width: asset === "gold-frame" || asset === "classic-ornament" ? 460 : 160,
      height: asset === "gold-frame" || asset === "classic-ornament" ? 780 : 160,
    });
    mutate((next) => {
      next.elements.push(element);
    });
    setSelectedId(element.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    mutate((next) => {
      next.elements = next.elements.filter((element) => element.id !== selectedId);
    });
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = {
      ...selected,
      id: `${selected.kind}-${crypto.randomUUID()}`,
      x: selected.x + 22,
      y: selected.y + 22,
      layer: selected.layer + 1,
    } as InvitationElement;
    mutate((next) => {
      next.elements.push(copy);
    });
    setSelectedId(copy.id);
  }

  function moveLayer(direction: -1 | 1) {
    if (!selected) return;
    updateElement({
      ...selected,
      layer: Math.max(0, Math.min(99, selected.layer + direction)),
    });
  }

  async function readFileAsDataUrl(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  function validateImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Gunakan foto JPG, PNG, atau WEBP.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Ukuran foto maksimal 10 MB.");
      return false;
    }
    return true;
  }

  async function uploadPhoto(file: File) {
    if (!validateImage(file)) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) {
      setMessage("Foto tidak dapat dibaca.");
      return;
    }
    await loadImage(dataUrl);
    const current = draftRef.current;
    if (!current) return;
    const element = createPhotoElement(currentSceneId, 80, 300, {
      src: dataUrl,
      width: 380,
      height: 360,
      frameColor: current.theme.accent,
      radius: current.theme.ornament === "luxury" ? 2 : 8,
    });
    mutate((next) => {
      next.elements.push(element);
    });
    setSelectedId(element.id);
    setMessage("Foto ditambahkan. Geser atau atur crop di panel Properties.");
  }

  async function replacePhoto(file: File) {
    if (!validateImage(file) || !selected || selected.kind !== "photo") return;
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) return;
    await loadImage(dataUrl);
    updateElement({ ...selected, src: dataUrl });
    setMessage("Foto berhasil diganti.");
  }

  async function uploadBackground(file: File) {
    if (!validateImage(file)) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) return;
    await loadImage(dataUrl);
    mutate((next) => {
      next.background.image = dataUrl;
    });
    setMessage("Background foto diterapkan.");
  }

  async function uploadAudio(file: File) {
    if (!["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a"].includes(file.type)) {
      setMessage("Gunakan audio MP3, WAV, atau M4A.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessage("Ukuran audio maksimal 20 MB.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) return;
    mutate((next) => {
      next.audio = { name: file.name, type: file.type, dataUrl };
    });
    setMessage("Audio ditambahkan ke preview dan export.");
  }

  function removeAudio() {
    mutate((next) => {
      next.audio = undefined;
    });
  }

  function applyPalette(colors: string[]) {
    mutate((next) => {
      const oldAccent = next.theme.accent;
      const oldInk = next.theme.ink;
      next.theme.accent = colors[1];
      next.theme.accentSoft = colors[3];
      next.theme.secondary = colors[2];
      next.theme.ink = colors[2];
      next.background.color = colors[0];
      next.elements.forEach((element) => {
        if (element.kind === "text") {
          if (element.color === oldAccent) element.color = colors[1];
          if (element.color === oldInk) element.color = colors[2];
        }
        if (element.kind === "decor") {
          if (element.color === oldAccent) element.color = colors[1];
          element.secondaryColor = colors[3];
        }
        if (element.kind === "photo") element.frameColor = colors[1];
      });
    });
  }


  async function startExport() {
    const current = draftRef.current;
    if (!current) return;
    setExportOpen(true);
    setExporting(true);
    setExportError(null);
    setExportProgress({ percent: 0, message: "Menyiapkan renderer…" });
    if (exportResult) URL.revokeObjectURL(exportResult.url);
    setExportResult(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await exportInvitationVideo(current, setExportProgress, controller.signal);
      setExportResult(result);
      setPlaying(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export gagal.");
    } finally {
      setExporting(false);
      abortRef.current = null;
    }
  }

  function downloadExport() {
    if (!exportResult) return;
    const anchor = document.createElement("a");
    anchor.href = exportResult.url;
    anchor.download = `${(draftRef.current?.title ?? "kefoo-invitation").replace(/\s+/g, "-")}.${exportResult.extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function closeExport() {
    abortRef.current?.abort();
    if (exportResult) URL.revokeObjectURL(exportResult.url);
    setExportResult(null);
    setExportError(null);
    setExportOpen(false);
    setExporting(false);
  }

  const selectedScene = draft?.scenes.find((scene) => scene.id === currentSceneId);
  const availableAssets = useMemo(() => {
    if (!draft?.assetIds?.length) return DECORATIVE_ASSETS;
    return draft.assetIds.map((id) => ({
      id,
      label: decorativeAssetLabel(id),
    }));
  }, [draft?.assetIds]);


  if (!ready || !draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2ede4] text-sm text-cocoa/55">
        <Loader2 className="mr-2 size-4 animate-spin" /> Menyiapkan video studio…
      </div>
    );
  }

  return (
    <div className="video-editorial min-h-screen bg-[#f2ede4] text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-[#fbf8f2]/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
          <Link href="/studio/video" className="flex size-9 items-center justify-center rounded-xl text-cocoa/55 hover:bg-white hover:text-cocoa" aria-label="Back to gallery">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="hidden items-center gap-2 rounded-xl bg-[#eee5d8] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-cocoa/55 sm:flex">
            <Sparkles className="size-3" /> {draft.templateName}
          </div>
          <input value={draft.title} onChange={(event) => mutate((next) => { next.title = event.target.value; })} aria-label="Design title" className="min-w-0 flex-1 border-0 bg-transparent px-1 font-heading text-base font-semibold text-cocoa outline-none focus:ring-0 sm:max-w-xs" />
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden text-[9px] text-cocoa/40 md:inline">{status === "saving" ? "Menyimpan…" : status === "saved" ? "Tersimpan lokal" : "Belum tersimpan"}</span>
            <button type="button" onClick={undo} disabled={!canUndo} className="flex size-8 items-center justify-center rounded-lg text-cocoa/55 hover:bg-white disabled:opacity-30" aria-label="Undo"><Undo2 className="size-4" /></button>
            <button type="button" onClick={redo} disabled={!canRedo} className="flex size-8 items-center justify-center rounded-lg text-cocoa/55 hover:bg-white disabled:opacity-30" aria-label="Redo"><Redo2 className="size-4" /></button>
            <button type="button" onClick={() => void saveNow()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cocoa/10 bg-white px-3 text-[10px] font-semibold text-cocoa/70 hover:bg-[#f5efe5]"><Save className="size-3.5" /> <span className="hidden sm:inline">Save</span></button>
            <button type="button" onClick={() => { setPlaying(false); setPreviewOpen(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cocoa/10 bg-white px-3 text-[10px] font-semibold text-cocoa/70 hover:bg-[#f5efe5]"><Eye className="size-3.5" /> <span className="hidden sm:inline">Preview</span></button>
            <button type="button" onClick={() => { setPlaying(false); setExportOpen(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cocoa px-3.5 text-[10px] font-semibold text-ivory hover:bg-cocoa/90"><Download className="size-3.5" /> <span className="hidden sm:inline">Export MP4</span></button>
          </div>
        </div>
      </header>

      {message ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#d8c8b2] bg-[#fbf2df] px-4 py-2 text-[10px] text-cocoa/70">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="rounded p-1 hover:bg-white" aria-label="Dismiss message"><X className="size-3.5" /></button>
        </div>
      ) : null}

      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 xl:grid-cols-[295px_minmax(0,1fr)_330px]">
        <aside className="order-2 border-t border-cocoa/10 bg-[#fbf8f2] xl:order-1 xl:border-r xl:border-t-0">
          <div className="grid grid-cols-4 gap-1 border-b border-cocoa/10 p-2">
            {([
              ["content", "Content"],
              ["elements", "Elements"],
              ["design", "Design"],
              ["scenes", "Scenes"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-w-0 items-center justify-center rounded-lg px-1 py-1.5 text-[8px] font-semibold ${tab === id ? "bg-cocoa text-ivory" : "bg-[#f0e8dc] text-cocoa/55 hover:bg-white"}`}>{label}</button>
            ))}
          </div>
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto p-3 xl:max-h-[calc(100vh-65px)]">


            {tab === "content" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#d8c8b2] bg-[#fbf2df] px-3 py-2 text-[10px] leading-relaxed text-cocoa/65">
                  <strong className="font-semibold">Demo content.</strong> Nama, tanggal, dan venue di bawah adalah contoh. Ganti sebelum export.
                </div>
                <div className="grid gap-2">
                  {([
                    ["brideName", "Nama mempelai wanita"],
                    ["groomName", "Nama mempelai pria"],
                    ["weddingDate", "Tanggal pernikahan"],
                    ["akadDate", "Tanggal akad"],
                    ["akadTime", "Waktu akad"],
                    ["receptionDate", "Tanggal resepsi"],
                    ["receptionTime", "Waktu resepsi"],
                    ["venueName", "Nama venue"],
                    ["venueAddress", "Alamat venue"],
                    ["rsvpContact", "Kontak RSVP"],
                    ["hashtag", "Hashtag"],
                    ["parentsBride", "Orang tua mempelai wanita"],
                    ["parentsGroom", "Orang tua mempelai pria"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className={labelClass}>{label}
                      <input value={draft.data[key]} onChange={(event) => updateData(key, event.target.value)} className={fieldClass} />
                    </label>
                  ))}
                  <label className={labelClass}>Opening message
                    <textarea value={draft.data.openingMessage} onChange={(event) => updateData("openingMessage", event.target.value)} rows={3} className={`${fieldClass} resize-y`} />
                  </label>
                  <label className={labelClass}>Love story
                    <textarea value={draft.data.loveStory} onChange={(event) => updateData("loveStory", event.target.value)} rows={4} className={`${fieldClass} resize-y`} />
                  </label>
                </div>
              </div>
            ) : null}

            {tab === "elements" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Text</p>
                  <button type="button" onClick={addText} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-cocoa px-3 py-2 text-[10px] font-semibold text-ivory"><Type className="size-3.5" /> Tambah teks</button>
                </div>
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Couple photo</p>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9a78e] bg-[#faf5eb] px-3 py-3 text-[10px] text-cocoa/65 hover:bg-[#f5eadb]"><ImagePlus className="size-4" /> Upload / add photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadPhoto(file); event.currentTarget.value = ""; }} /></label>
                  <p className="mt-2 text-[9px] leading-relaxed text-cocoa/40">JPG, PNG, WEBP · max 10 MB. Foto masuk ke scene aktif.</p>
                </div>
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Decorations</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {availableAssets.map((asset) => (
                      <button key={asset.id} type="button" onClick={() => addDecor(asset.id)} className="rounded-lg border border-cocoa/10 px-2 py-2 text-left text-[9px] text-cocoa/65 hover:border-[#b9a78e] hover:bg-[#faf5eb]">{asset.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}


            {tab === "design" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Palette</p>
                  <div className="mt-2 space-y-2">
                    {VIDEO_TEMPLATES.map((template) => (
                      <button key={template.id} type="button" onClick={() => applyPalette(template.palette)} className="flex w-full items-center gap-2 rounded-lg border border-cocoa/10 p-1.5 text-left hover:border-[#b9a78e]">
                        <span className="flex flex-1 gap-1">{template.palette.map((color) => <span key={color} className="h-5 flex-1 rounded-sm" style={{ backgroundColor: color }} />)}</span>
                        <span className="w-16 text-right text-[9px] text-cocoa/50">{template.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Background</p>
                  <label className={`${labelClass} mt-2`}>Warna
                    <input type="color" value={draft.background.color} onChange={(event) => mutate((next) => { next.background.color = event.target.value; })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" />
                  </label>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9a78e] bg-[#faf5eb] px-3 py-2 text-[10px] text-cocoa/65 hover:bg-[#f5eadb]"><Upload className="size-3.5" /> Upload background<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadBackground(file); event.currentTarget.value = ""; }} /></label>
                  {draft.background.image ? <button type="button" onClick={() => mutate((next) => { next.background.image = undefined; })} className="mt-2 text-[9px] font-medium text-rose-600">Hapus background foto</button> : null}
                </div>
                <div className="rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45"><Music2 className="size-3" /> Audio opsional</p>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9a78e] bg-[#faf5eb] px-3 py-2 text-[10px] text-cocoa/65 hover:bg-[#f5eadb]"><Music2 className="size-3.5" /> Upload audio<input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/m4a" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadAudio(file); event.currentTarget.value = ""; }} /></label>
                  {draft.audio ? <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#faf5eb] px-2 py-1.5 text-[9px] text-cocoa/60"><span className="truncate">{draft.audio.name}</span><button type="button" onClick={removeAudio} className="text-rose-600"><X className="size-3" /></button></div> : <p className="mt-2 text-[9px] leading-relaxed text-cocoa/40">MP3, WAV, atau M4A · max 20 MB. Audio dicampur ke MP4.</p>}
                </div>
              </div>
            ) : null}


            {tab === "scenes" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-cocoa/10 bg-[#faf5eb] p-3 text-[10px] leading-relaxed text-cocoa/55">
                  Scene disusun berurutan. Durasi menentukan kapan animasi masuk/keluar diputar; transisi berlaku saat scene dimulai.
                </div>
                {draft.scenes.map((scene, index) => (
                  <div key={scene.id} className={`rounded-xl border p-3 ${scene.id === currentSceneId ? "border-[#b08a55] bg-[#fffaf0]" : "border-cocoa/10 bg-white"}`}>
                    <button type="button" onClick={() => selectScene(scene.id)} className="flex w-full items-center justify-between gap-2 text-left">
                      <span className="text-[11px] font-semibold text-cocoa">{index + 1}. {scene.title}</span>
                      <span className="text-[9px] text-cocoa/40">{scene.duration.toFixed(1)}s</span>
                    </button>
                    <p className="mt-1 text-[9px] text-cocoa/35">Start {timeline[index]?.start.toFixed(1) ?? "0.0"}s · berakhir {timeline[index]?.end.toFixed(1) ?? scene.duration.toFixed(1)}s</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <label className="text-[9px] text-cocoa/45">Duration (s)<input type="number" min="1" max="15" step="0.5" value={scene.duration} onChange={(event) => updateScene(scene.id, { duration: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 w-full rounded-lg border border-cocoa/10 bg-white px-2 py-1.5 text-[10px]" /></label>
                      <label className="text-[9px] text-cocoa/45">Transition<select value={scene.transition} onChange={(event) => updateScene(scene.id, { transition: event.target.value as SceneTransition })} className="mt-1 w-full rounded-lg border border-cocoa/10 bg-white px-1.5 py-1.5 text-[10px]">{SCENE_TRANSITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <button type="button" onClick={() => moveScene(scene.id, -1)} disabled={index === 0} className="rounded-md p-1 text-cocoa/50 hover:bg-[#f3eadc] disabled:opacity-25" aria-label="Move scene up"><ChevronUp className="size-3.5" /></button>
                      <button type="button" onClick={() => moveScene(scene.id, 1)} disabled={index === draft.scenes.length - 1} className="rounded-md p-1 text-cocoa/50 hover:bg-[#f3eadc] disabled:opacity-25" aria-label="Move scene down"><ChevronDown className="size-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>


        <main className="order-1 min-w-0 bg-[#e9e3d8] p-3 sm:p-5 xl:order-2">
          <div className="mx-auto max-w-[620px]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cocoa/10 bg-[#fbf8f2]/80 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] text-cocoa/55">
                <span className="rounded-full bg-[#eee5d8] px-2 py-1 font-semibold uppercase tracking-[0.12em]">9:16</span>
                <span>{draft.elements.filter((element) => element.sceneId === currentSceneId).length} layers</span>
                <span className="text-cocoa/25">·</span>
                <span>{duration.toFixed(1)}s total</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => { if (time >= duration - 0.1) setTime(0); setPlaying((value) => !value); }} className="flex size-8 items-center justify-center rounded-full bg-cocoa text-ivory" aria-label={playing ? "Pause preview" : "Play preview"}>{playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5 fill-current" />}</button>
                <button type="button" onClick={() => setPreviewOpen(true)} className="flex h-8 items-center gap-1 rounded-full border border-cocoa/10 bg-white px-2.5 text-[9px] font-semibold text-cocoa/65"><Eye className="size-3" /> Full preview</button>
              </div>
            </div>
            <EditorStage
              draft={draft}
              time={time}
              playing={playing}
              sceneId={currentSceneId}
              selectedId={selectedId}
              onTimeChange={handleTime}
              onSelect={setSelectedId}
              onChangeElement={(element, commitChange) => updateElement(element, commitChange)}
              onCommit={commitCurrent}
            />
            <div className="mt-4 rounded-2xl border border-cocoa/10 bg-[#fbf8f2] p-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { if (time >= duration - 0.1) setTime(0); setPlaying((value) => !value); }} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory">{playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5 fill-current" />}</button>
                <input type="range" min={0} max={Math.max(duration, 0.1)} step={0.01} value={Math.min(time, duration)} onChange={(event) => { const next = Number(event.target.value); setPlaying(false); setTime(next); const entry = sceneAt(draft.scenes, next); if (entry) setCurrentSceneId(entry.scene.id); }} className="min-w-0 flex-1 accent-[#4b342b]" aria-label="Seek timeline" />
                <span className="w-16 text-right font-mono text-[9px] text-cocoa/45">{time.toFixed(1)} / {duration.toFixed(1)}s</span>
              </div>
              <div className="mt-2 flex overflow-hidden rounded-lg border border-cocoa/10 bg-[#eee5d8]">
                {timeline.map((entry) => (
                  <button key={entry.scene.id} type="button" onClick={() => selectScene(entry.scene.id)} className={`relative min-w-0 border-r border-white/60 px-1.5 py-2 text-left last:border-r-0 ${entry.scene.id === currentSceneId ? "bg-[#d8c4a6]" : "bg-[#eee5d8] hover:bg-[#e6d9c7]"}`} style={{ width: `${(entry.scene.duration / Math.max(duration, 0.1)) * 100}%` }} title={`${entry.scene.title} · ${entry.scene.duration}s`}>
                      <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-cocoa/60">{entry.scene.title}</span>
                      <span className="block text-[8px] text-cocoa/40">{entry.scene.duration.toFixed(1)}s</span>
                    </button>
                  ))}
              </div>
              <p className="mt-2 text-[9px] text-cocoa/35">Klik scene untuk pindah · drag elemen di canvas · resize/rotate lewat handle. Semua perubahan masuk ke draft lokal.</p>
            </div>
          </div>
        </main>


        <aside className="order-3 border-t border-cocoa/10 bg-[#fbf8f2] xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between border-b border-cocoa/10 px-3 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Properties</p>
              <p className="mt-0.5 text-[11px] font-medium text-cocoa">{selected ? selected.kind.toUpperCase() : "Scene"}</p>
            </div>
            {selected ? (
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => moveLayer(1)} className="rounded p-1.5 text-cocoa/45 hover:bg-white" aria-label="Bring forward"><Layers className="size-3.5" /></button>
                <button type="button" onClick={() => moveLayer(-1)} className="rounded p-1.5 text-cocoa/45 hover:bg-white" aria-label="Send backward"><Layers className="size-3.5 rotate-180" /></button>
              </div>
            ) : null}
          </div>
          <div className="max-h-[calc(100vh-65px)] overflow-y-auto p-3">
            {!selected ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-cocoa/15 bg-white/60 p-4 text-center">
                  <Layers className="mx-auto size-5 text-cocoa/25" />
                  <p className="mt-2 text-[11px] font-medium text-cocoa/55">Pilih layer di canvas</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-cocoa/35">Klik teks, foto, atau dekorasi untuk mengatur posisi, animasi, dan warna.</p>
                </div>
                {selectedScene ? (
                  <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Scene</p>
                    <p className="text-sm font-medium text-cocoa">{selectedScene.title}</p>
                    <label className={labelClass}>Duration (s)<input type="number" min="1" max="15" step="0.5" value={selectedScene.duration} onChange={(event) => updateScene(selectedScene.id, { duration: Math.max(1, Number(event.target.value) || 1) })} className={fieldClass} /></label>
                    <label className={labelClass}>Transition<select value={selectedScene.transition} onChange={(event) => updateScene(selectedScene.id, { transition: event.target.value as SceneTransition })} className={fieldClass}>{SCENE_TRANSITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                  </div>
                ) : null}
                <div className="rounded-xl bg-[#f4ecdf] p-3 text-[9px] leading-relaxed text-cocoa/50">
                  Export selalu vertikal 9:16 (720×1280). Preview dan export memakai renderer yang sama.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={duplicateSelected} className="flex h-7 items-center gap-1 rounded-md border border-cocoa/10 px-2 text-[9px] text-cocoa/60 hover:bg-white"><Copy className="size-3" /> Duplicate</button>
                  <button type="button" onClick={deleteSelected} className="flex h-7 items-center gap-1 rounded-md border border-rose-200 px-2 text-[9px] text-rose-600 hover:bg-rose-50"><Trash2 className="size-3" /> Delete</button>
                </div>

                <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Layout</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={labelClass}>X<input type="number" value={Math.round(selected.x)} onChange={(event) => updateElement({ ...selected, x: Number(event.target.value) })} className={fieldClass} /></label>
                    <label className={labelClass}>Y<input type="number" value={Math.round(selected.y)} onChange={(event) => updateElement({ ...selected, y: Number(event.target.value) })} className={fieldClass} /></label>
                    <label className={labelClass}>W<input type="number" value={Math.round(selected.width)} onChange={(event) => updateElement({ ...selected, width: Math.max(20, Number(event.target.value)) })} className={fieldClass} /></label>
                    <label className={labelClass}>H<input type="number" value={Math.round(selected.height)} onChange={(event) => updateElement({ ...selected, height: Math.max(16, Number(event.target.value)) })} className={fieldClass} /></label>
                    <label className={labelClass}>Rotate<input type="number" value={Math.round(selected.rotation)} onChange={(event) => updateElement({ ...selected, rotation: Number(event.target.value) })} className={fieldClass} /></label>
                    <label className={labelClass}>Opacity<input type="number" min="0" max="100" value={Math.round(selected.opacity * 100)} onChange={(event) => updateElement({ ...selected, opacity: Math.min(1, Math.max(0, Number(event.target.value) / 100)) })} className={fieldClass} /></label>
                  </div>
                </div>


                {selected.kind === "text" ? (
                  <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Text</p>
                    <label className={labelClass}>Data binding
                      <select value={selected.binding ?? ""} onChange={(event) => { const binding = event.target.value as keyof InvitationData | ""; updateElement({ ...selected, binding: binding || undefined, text: binding ? undefined : draft.data[selected.binding ?? "brideName"] } as TextElement); }} className={fieldClass}>
                        <option value="">Custom text</option>
                        {(["brideName", "groomName", "weddingDate", "akadDate", "akadTime", "receptionDate", "receptionTime", "venueName", "venueAddress", "openingMessage", "rsvpContact", "loveStory", "parentsBride", "parentsGroom", "hashtag"] as const).map((key) => <option key={key} value={key}>{key}</option>)}
                      </select>
                    </label>
                    <label className={labelClass}>Text<textarea value={selected.text ?? (selected.binding ? draft.data[selected.binding] : "")} onChange={(event) => updateElement({ ...selected, text: event.target.value, binding: undefined } as TextElement)} rows={3} className={`${fieldClass} resize-y`} /></label>
                    <label className={labelClass}>Font<select value={selected.fontFamily} onChange={(event) => updateElement({ ...selected, fontFamily: event.target.value })} className={fieldClass}>{STUDIO_FONTS.map((font) => <option key={font.name} value={font.name}>{font.name}</option>)}</select></label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={labelClass}>Size<input type="number" value={selected.fontSize} onChange={(event) => updateElement({ ...selected, fontSize: Math.max(8, Number(event.target.value)) })} className={fieldClass} /></label>
                      <label className={labelClass}>Weight<select value={selected.fontWeight} onChange={(event) => updateElement({ ...selected, fontWeight: Number(event.target.value) as 400 | 600 | 700 })} className={fieldClass}><option value={400}>Regular</option><option value={600}>Semibold</option><option value={700}>Bold</option></select></label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => updateElement({ ...selected, italic: !selected.italic })} className={`h-7 rounded-md border px-2 text-[10px] italic ${selected.italic ? "border-[#b08a55] bg-[#f5eadb]" : "border-cocoa/10"}`}>I</button>
                      {(["left", "center", "right"] as const).map((align) => <button key={align} type="button" onClick={() => updateElement({ ...selected, align })} className={`h-7 rounded-md border px-2 text-[9px] ${selected.align === align ? "border-[#b08a55] bg-[#f5eadb]" : "border-cocoa/10"}`}>{align}</button>)}
                      <input type="color" value={selected.color} onChange={(event) => updateElement({ ...selected, color: event.target.value })} className="ml-auto size-7 cursor-pointer rounded-md border border-cocoa/10 bg-white p-0.5" aria-label="Text color" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={labelClass}>Line height<input type="number" step="0.05" value={selected.lineHeight} onChange={(event) => updateElement({ ...selected, lineHeight: Number(event.target.value) || 1 })} className={fieldClass} /></label>
                      <label className={labelClass}>Letter spacing<input type="number" value={selected.letterSpacing} onChange={(event) => updateElement({ ...selected, letterSpacing: Number(event.target.value) || 0 })} className={fieldClass} /></label>
                    </div>
                  </div>
                ) : null}


                {selected.kind === "photo" ? (
                  <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Photograph</p>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9a78e] bg-[#faf5eb] px-3 py-2 text-[10px] text-cocoa/65"><ImagePlus className="size-3.5" /> Replace photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void replacePhoto(file); event.currentTarget.value = ""; }} /></label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={labelClass}>Crop X<input type="range" min="0" max="1" step="0.01" value={selected.cropX} onChange={(event) => updateElement({ ...selected, cropX: Number(event.target.value) })} className="mt-2 w-full accent-[#4b342b]" /></label>
                      <label className={labelClass}>Crop Y<input type="range" min="0" max="1" step="0.01" value={selected.cropY} onChange={(event) => updateElement({ ...selected, cropY: Number(event.target.value) })} className="mt-2 w-full accent-[#4b342b]" /></label>
                      <label className={labelClass}>Zoom<input type="range" min="1" max="2.5" step="0.01" value={selected.zoom} onChange={(event) => updateElement({ ...selected, zoom: Number(event.target.value) })} className="mt-2 w-full accent-[#4b342b]" /></label>
                      <label className={labelClass}>Radius<input type="number" min="0" max="200" value={selected.radius} onChange={(event) => updateElement({ ...selected, radius: Number(event.target.value) })} className={fieldClass} /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={labelClass}>Fit<select value={selected.fit} onChange={(event) => updateElement({ ...selected, fit: event.target.value as "cover" | "contain" })} className={fieldClass}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
                      <label className={labelClass}>Frame<input type="color" value={selected.frameColor} onChange={(event) => updateElement({ ...selected, frameColor: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                    </div>
                  </div>
                ) : null}

                {selected.kind === "decor" ? (
                  <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Decoration</p>
                    <label className={labelClass}>Asset<select value={selected.asset} onChange={(event) => updateElement({ ...selected, asset: event.target.value as DecorativeAsset })} className={fieldClass}>{availableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={labelClass}>Color<input type="color" value={selected.color} onChange={(event) => updateElement({ ...selected, color: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                      <label className={labelClass}>Accent<input type="color" value={selected.secondaryColor} onChange={(event) => updateElement({ ...selected, secondaryColor: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded-lg border border-cocoa/10 bg-white p-1" /></label>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-xl border border-cocoa/10 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa/45">Animation</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={labelClass}>Enter<select value={selected.enter} onChange={(event) => updateElement({ ...selected, enter: event.target.value as AnimationPreset })} className={fieldClass}>{ANIMATION_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
                    <label className={labelClass}>Exit<select value={selected.exit} onChange={(event) => updateElement({ ...selected, exit: event.target.value as AnimationPreset })} className={fieldClass}>{ANIMATION_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
                    <label className={labelClass}>Delay (s)<input type="number" min="0" max="4" step="0.1" value={selected.delay} onChange={(event) => updateElement({ ...selected, delay: Number(event.target.value) || 0 })} className={fieldClass} /></label>
                    <label className={labelClass}>Layer<input type="number" min="0" max="99" value={selected.layer} onChange={(event) => updateElement({ ...selected, layer: Number(event.target.value) || 0 })} className={fieldClass} /></label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <audio ref={audioRef} src={draft.audio?.dataUrl} loop className="hidden" />


      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Full video preview">
          <div className="max-h-[95vh] w-full max-w-md overflow-auto rounded-2xl bg-[#fbf8f2] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div><p className="font-heading text-base text-cocoa">{draft.title}</p><p className="text-[9px] uppercase tracking-[0.16em] text-cocoa/35">Full motion preview · demo data</p></div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg p-1.5 text-cocoa/50 hover:bg-white" aria-label="Close full preview"><X className="size-4" /></button>
            </div>
            <VideoCanvas draft={draft} playing loop className="mx-auto block w-full rounded-xl bg-black shadow-xl" />
            <p className="mt-2 text-center text-[9px] text-cocoa/35">Preview memutar seluruh scene dan animasi. Audio mengikuti tombol play di editor.</p>
          </div>
        </div>
      ) : null}

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Export invitation video">
          <div className="w-full max-w-lg rounded-2xl bg-[#fbf8f2] p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9d7d5b]">Export video</p>
                <h2 className="mt-1 font-heading text-xl text-cocoa">Render vertical MP4</h2>
                <p className="mt-1 text-[10px] text-cocoa/45">720 × 1280 · 9:16 · {duration.toFixed(1)} detik · {draft.audio ? `audio ${draft.audio.name}` : "tanpa audio"}</p>
              </div>
              <button type="button" onClick={closeExport} className="rounded-lg p-1.5 text-cocoa/45 hover:bg-white" aria-label="Close export"><X className="size-4" /></button>
            </div>

            {exporting ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-cocoa/55"><span>{exportProgress.message || "Merender…"}</span><span>{exportProgress.percent}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eadfce]"><div className="h-full rounded-full bg-[#6e4b39] transition-[width]" style={{ width: `${exportProgress.percent}%` }} /></div>
                <p className="text-[9px] leading-relaxed text-cocoa/35">Biarkan tab ini tetap aktif. Browser merekam canvas secara real-time agar animasi dan audio tetap sinkron. Durasi export sama dengan durasi video.</p>
                <button type="button" onClick={closeExport} className="w-full rounded-xl border border-cocoa/10 bg-white px-3 py-2 text-[10px] font-semibold text-cocoa/60 hover:bg-[#f5efe5]">Batalkan export</button>
              </div>
            ) : exportResult ? (
              <div className="mt-4 space-y-3">
                <video src={exportResult.url} controls className="max-h-[45vh] w-full rounded-xl bg-black" />
                <div className="rounded-xl bg-[#eef6ea] px-3 py-2 text-[10px] leading-relaxed text-emerald-800"><Check className="mr-1 inline size-3" /> Video selesai · {exportResult.extension.toUpperCase()} · {(exportResult.blob.size / 1024 / 1024).toFixed(1)} MB</div>
                <div className="flex gap-2">
                  <button type="button" onClick={downloadExport} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cocoa px-3 py-2.5 text-[10px] font-semibold text-ivory"><Download className="size-3.5" /> Download {exportResult.extension.toUpperCase()}</button>
                  <button type="button" onClick={() => void startExport()} className="rounded-xl border border-cocoa/10 bg-white px-3 py-2.5 text-[10px] font-semibold text-cocoa/60">Render ulang</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {exportError ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] leading-relaxed text-rose-700">{exportError}</div> : null}
                <div className="rounded-xl bg-[#f4ecdf] p-3 text-[10px] leading-relaxed text-cocoa/55">
                  Export memakai renderer yang sama dengan preview. Format MP4 didukung Chrome terbaru; bila browser tidak mendukung MP4, studio akan menghasilkan WebM dan memberi tahu Anda — tidak ada klaim MP4 palsu.
                </div>
                <button type="button" onClick={() => void startExport()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-3 py-2.5 text-[10px] font-semibold text-ivory"><Download className="size-3.5" /> Mulai render MP4</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

