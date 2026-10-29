import { preloadDraftImages, renderInvitationFrame, totalDuration, EXPORT_HEIGHT, EXPORT_WIDTH } from "./render";
import type { VideoDraft } from "./types";
import { STUDIO_FONTS } from "@/lib/invitation-studio/fonts";

export type ExportProgress = {
  percent: number;
  message: string;
};

export type ExportResult = {
  blob: Blob;
  url: string;
  mimeType: string;
  extension: "mp4" | "webm";
  width: number;
  height: number;
  duration: number;
};

const MP4_TYPES = [
  "video/mp4;codecs=avc1.42001f,mp4a.40.2",
  "video/mp4;codecs=avc1.42001f",
  "video/mp4",
];
const WEBM_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

function supportedMime(audio: boolean) {
  const types = audio ? [...MP4_TYPES, ...WEBM_TYPES] : [...MP4_TYPES, ...WEBM_TYPES];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function decodeAudio(dataUrl: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(dataUrl);
    const bytes = await response.arrayBuffer();
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(bytes.slice(0));
    await context.close();
    return buffer;
  } catch {
    return null;
  }
}

export async function exportInvitationVideo(
  draft: VideoDraft,
  onProgress: (progress: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<ExportResult> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Browser ini tidak mendukung MediaRecorder. Gunakan Chrome terbaru.");
  }
  await preloadDraftImages(draft);
  await Promise.all(
    STUDIO_FONTS.map((font) =>
      document.fonts.load(`16px "${font.name}"`).catch(() => undefined),
    ),
  );
  await document.fonts.ready.catch(() => undefined);
  const duration = totalDuration(draft.scenes);
  if (duration <= 0) throw new Error("Durasi video belum valid.");

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia.");

  const stream = canvas.captureStream(30);
  let audioContext: AudioContext | null = null;
  let audioSource: AudioBufferSourceNode | null = null;
  let audioTrack: MediaStreamTrack | null = null;
  let audioWarning: string | null = null;

  if (draft.audio) {
    onProgress({ percent: 2, message: "Menyiapkan audio…" });
    const buffer = await decodeAudio(draft.audio.dataUrl);
    if (buffer) {
      try {
        audioContext = new AudioContext();
        const audioDestination = audioContext.createMediaStreamDestination();
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = buffer;
        audioSource.loop = true;
        audioSource.connect(audioDestination);
        audioTrack = audioDestination.stream.getAudioTracks()[0] ?? null;
        if (audioTrack) stream.addTrack(audioTrack);
        await audioContext.resume();
      } catch {
        audioWarning = "Audio tidak dapat dimasukkan ke export. Video akan dibuat tanpa audio.";
        await audioContext?.close().catch(() => undefined);
        audioContext = null;
        audioSource = null;
        audioTrack = null;
      }
    } else {
      audioWarning = "Audio tidak dapat dibaca. Video akan dibuat tanpa audio.";
    }
  }

  const mimeType = supportedMime(Boolean(audioTrack));
  if (!mimeType) {
    throw new Error("Browser ini tidak mendukung format video MP4/WebM untuk export.");
  }

  renderInvitationFrame(ctx, draft, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
    audioBitsPerSecond: 128_000,
  });
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  let cancelled = false;
  let aborted = false;
  const stop = (manual = false) => {
    if (manual) aborted = true;
    if (cancelled) return;
    cancelled = true;
    try {
      audioSource?.stop();
    } catch {
      // Source may already have ended.
    }
    if (recorder.state !== "inactive") recorder.stop();
  };
  const onAbort = () => stop(true);
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    recorder.start(250);
    audioSource?.start();
    onProgress({ percent: 3, message: "Merender video nyata…" });
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const frame = () => {
        if (cancelled) {
          resolve();
          return;
        }
        const elapsed = (performance.now() - start) / 1000;
        const time = Math.min(elapsed, duration);
        renderInvitationFrame(ctx, draft, time, EXPORT_WIDTH, EXPORT_HEIGHT);
        onProgress({
          percent: Math.min(99, Math.round((time / duration) * 96) + 3),
          message: `Merender ${time.toFixed(1)} / ${duration.toFixed(1)} detik…`,
        });
        if (elapsed >= duration) {
          renderInvitationFrame(ctx, draft, duration, EXPORT_WIDTH, EXPORT_HEIGHT);
          resolve();
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    stop();
    await stopped;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    audioSource?.disconnect();
    audioTrack?.stop();
    await audioContext?.close().catch(() => undefined);
    stream.getTracks().forEach((track) => track.stop());
  }

  if (aborted) throw new Error("Export dibatalkan.");
  const actualMime = recorder.mimeType || mimeType;
  const blob = new Blob(chunks, { type: actualMime });
  if (blob.size === 0) throw new Error("Renderer tidak menghasilkan video. Coba lagi.");
  const extension = actualMime.includes("mp4") ? "mp4" : "webm";
  onProgress({
    percent: 100,
    message: audioWarning ? `Selesai. ${audioWarning}` : "Video siap diunduh.",
  });
  return {
    blob,
    url: URL.createObjectURL(blob),
    mimeType: actualMime,
    extension,
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    duration,
  };
}
