"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Panneau de résultats sur téléphone, posé sur la carte. Trois crans :
// « peek » (le résumé seul), « half » (la moitié), « full » (toute la hauteur).
// Le panneau se tire par sa poignée ; un bouton fait la même chose au clavier.

export type SheetSnap = "peek" | "half" | "full";

const PEEK_PX = 136;

interface ExploreSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Toujours visible : poignée, compteur, filtres rapides. */
  header: ReactNode;
  children: ReactNode;
  /** Hauteur de carte cachée par le panneau, pour recentrer dans la partie visible. */
  onCoveredHeight?: (px: number) => void;
}

function offsetFor(snap: SheetSnap, height: number) {
  if (snap === "full") return 0;
  if (snap === "half") return Math.round(height * 0.48);
  return Math.max(height - PEEK_PX, 0);
}

export function ExploreSheet({ snap, onSnapChange, header, children, onCoveredHeight }: ExploreSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startOffset: number; lastY: number; lastT: number; v: number } | null>(null);
  // Un glissé se termine par un « click » sur la poignée : il ne doit pas compter.
  const draggedRef = useRef(false);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const offset = dragOffset ?? offsetFor(snap, height);

  useEffect(() => {
    if (!height || dragOffset !== null) return;
    // En plein écran, la carte n'est plus visible : on garde le cran « moitié » pour elle.
    onCoveredHeight?.(height - offsetFor(snap === "full" ? "half" : snap, height));
  }, [snap, height, dragOffset, onCoveredHeight]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const start = offsetFor(snap, height);
    drag.current = { startY: e.clientY, startOffset: start, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    draggedRef.current = false;
    setDragOffset(start);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(e.timeStamp - d.lastT, 1);
    d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    if (Math.abs(e.clientY - d.startY) > 6) draggedRef.current = true;
    d.lastT = e.timeStamp;
    const next = Math.min(Math.max(d.startOffset + e.clientY - d.startY, 0), offsetFor("peek", height));
    setDragOffset(next);
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || dragOffset === null) return;
    if (!draggedRef.current) {
      setDragOffset(null);
      return; // simple toucher : le bouton de la poignée s'en charge
    }
    // Un geste franc l'emporte sur la position : on suit le sens du lancer.
    const order: SheetSnap[] = ["full", "half", "peek"];
    let target: SheetSnap;
    if (Math.abs(d.v) > 0.5) {
      const i = order.indexOf(snap);
      target = order[Math.min(Math.max(i + (d.v > 0 ? 1 : -1), 0), 2)];
    } else {
      target = order.reduce((best, s) =>
        Math.abs(offsetFor(s, height) - dragOffset) < Math.abs(offsetFor(best, height) - dragOffset) ? s : best
      );
    }
    setDragOffset(null);
    onSnapChange(target);
  }

  const nextSnap: SheetSnap = snap === "peek" ? "half" : snap === "half" ? "full" : "peek";

  return (
    <section
      ref={sheetRef}
      aria-label="Résultats"
      className="explore-sheet absolute inset-x-0 bottom-0 z-20 flex flex-col"
      data-dragging={dragOffset !== null}
      style={{ top: "var(--explore-sheet-top)", transform: `translate3d(0, ${offset}px, 0)` }}
    >
      <div
        className="touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            onSnapChange(nextSnap);
          }}
          className="flex h-11 w-full items-center justify-center"
          aria-label={snap === "full" ? "Réduire la liste" : "Agrandir la liste"}
        >
          <span className="h-[5px] w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </button>
        {header}
      </div>
      <div
        className="min-h-0 flex-1 overscroll-contain px-3"
        // La partie translatée hors de l'écran ne doit pas cacher le bas de la liste
        style={{ overflowY: snap === "peek" ? "hidden" : "auto", paddingBottom: offset + 24 }}
      >
        {children}
      </div>
    </section>
  );
}
