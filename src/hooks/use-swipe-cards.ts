import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

const DRAG_THRESHOLD = 6;

type DragState = {
  isDown: boolean;
  startX: number;
  startY: number;
  scrollLeft: number;
  moved: boolean;
  captured: boolean;
};

export function useSwipeCards(itemCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    moved: false,
    captured: false,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateActive = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    if (!children.length) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateActive();
      });
    };
    const onResize = () => updateActive();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      updateActive();
    });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [itemCount, updateActive]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;
    dragRef.current = {
      isDown: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      moved: false,
      captured: false,
    };
    setIsDragging(false);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !dragRef.current.isDown) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    if (!dragRef.current.captured) {
      if (Math.abs(deltaY) > DRAG_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
        dragRef.current.isDown = false;
        return;
      }
      if (Math.abs(deltaX) > DRAG_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        container.setPointerCapture(event.pointerId);
        dragRef.current.captured = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    if (!dragRef.current.moved && Math.abs(deltaX) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }
    container.scrollLeft = dragRef.current.scrollLeft - deltaX;
  }, []);

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container && dragRef.current.captured) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore release failures.
      }
    }
    dragRef.current.isDown = false;
    dragRef.current.captured = false;
    setIsDragging(false);
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  }, []);

  return {
    containerRef,
    activeIndex,
    isDragging,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  };
}
