"use client";

import { useEffect, useRef, useState } from "react";
import { Move, RotateCw } from "lucide-react";
import { VideoCanvas } from "@/components/video-studio/video-canvas";
import type { InvitationElement, VideoDraft } from "@/lib/video-studio/types";

type DragMode = "move" | "resize" | "rotate";

type DragState = {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  element: InvitationElement;
  centerX: number;
  centerY: number;
};

type EditorStageProps = {
  draft: VideoDraft;
  time: number;
  playing: boolean;
  sceneId: string;
  selectedId: string | null;
  onTimeChange: (time: number) => void;
  onSelect: (id: string | null) => void;
  onChangeElement: (element: InvitationElement, commit: boolean) => void;
  onCommit: () => void;
};

function elementAt(
  draft: VideoDraft,
  sceneId: string,
  x: number,
  y: number,
): InvitationElement | null {
  return (
    draft.elements
      .filter((element) => element.sceneId === sceneId)
      .slice()
      .sort((a, b) => b.layer - a.layer)
      .find(
        (element) =>
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height,
      ) ?? null
  );
}

export function EditorStage({
  draft,
  time,
  playing,
  sceneId,
  selectedId,
  onTimeChange,
  onSelect,
  onChangeElement,
  onCommit,
}: EditorStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const dragRef = useRef<DragState | null>(null);
  const selected = draft.elements.find((element) => element.id === selectedId) ?? null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => setScale(stage.clientWidth / 540);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  function logicalPoint(event: React.PointerEvent) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * 540,
      y: ((event.clientY - rect.top) / rect.height) * 960,
    };
  }

  function startDrag(event: React.PointerEvent, element: InvitationElement, mode: DragMode) {
    event.stopPropagation();
    event.preventDefault();
    const point = logicalPoint(event);
    stageRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      element: { ...element },
      centerX: element.x + element.width / 2,
      centerY: element.y + element.height / 2,
    };
    onSelect(element.id);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return;
    const point = logicalPoint(event);
    const hit = elementAt(draft, sceneId, point.x, point.y);
    if (!hit) {
      onSelect(null);
      return;
    }
    onSelect(hit.id);
    startDrag(event, hit, "move");
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = logicalPoint(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (drag.mode === "move") {
      onChangeElement(
        {
          ...drag.element,
          x: Math.round(drag.element.x + dx),
          y: Math.round(drag.element.y + dy),
        },
        false,
      );
    } else if (drag.mode === "resize") {
      onChangeElement(
        {
          ...drag.element,
          width: Math.max(36, Math.round(drag.element.width + dx)),
          height: Math.max(24, Math.round(drag.element.height + dy)),
        },
        false,
      );
    } else {
      const angle = Math.atan2(point.y - drag.centerY, point.x - drag.centerX);
      const degrees = Math.round((angle * 180) / Math.PI + 90);
      onChangeElement({ ...drag.element, rotation: degrees }, false);
    }
  }

  function endDrag(event: React.PointerEvent) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    stageRef.current?.releasePointerCapture(event.pointerId);
    onCommit();
  }

  return (
    <div
      ref={stageRef}
      style={{ width: "min(100%, 540px, calc((100dvh - 230px) * 0.5625))" }}
      className="relative mx-auto w-full touch-none select-none overflow-hidden rounded-[3px] bg-white shadow-[0_28px_80px_-30px_rgba(50,31,24,.58)]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <VideoCanvas
        draft={draft}
        time={time}
        playing={playing}
        onTimeChange={onTimeChange}
        className="block h-auto w-full"
      />
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ink/55 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur">
        <Move className="size-2.5" /> {selected?.kind ?? "Canvas"}
      </div>
      {selected ? (
        <div
          className="pointer-events-none absolute border border-[#8b6d46]"
          style={{
            left: selected.x * scale,
            top: selected.y * scale,
            width: selected.width * scale,
            height: selected.height * scale,
            transform: `rotate(${selected.rotation}deg)`,
            transformOrigin: "center",
            boxShadow: "0 0 0 1px rgba(255,255,255,.8)",
          }}
        >
          <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-[#4b342b] px-1.5 py-0.5 text-[8px] font-medium text-white">
            {selected.kind === "text" ? "TEXT" : selected.kind === "photo" ? "PHOTO" : "DECOR"}
          </span>
          <button
            type="button"
            aria-label="Resize element"
            className="pointer-events-auto absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-[#8b6d46] shadow"
            onPointerDown={(event) => startDrag(event, selected, "resize")}
          />
          <button
            type="button"
            aria-label="Rotate element"
            className="pointer-events-auto absolute -top-10 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#8b6d46] text-white shadow"
            onPointerDown={(event) => startDrag(event, selected, "rotate")}
          >
            <RotateCw className="size-2.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

