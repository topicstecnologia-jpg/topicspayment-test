"use client";

import { useEffect } from "react";

const SCROLL_EASING = 0.14;
const WHEEL_MULTIPLIER = 0.88;
const MAX_WHEEL_DELTA = 140;
const MIN_DELTA = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWheelDelta(event: WheelEvent) {
  const deltaByMode =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? event.deltaY * window.innerHeight
        : event.deltaY;

  return clamp(deltaByMode, -MAX_WHEEL_DELTA, MAX_WHEEL_DELTA);
}

function isVerticallyScrollable(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  const overflowY = styles.overflowY;

  return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight + 1;
}

function canConsumeScroll(element: HTMLElement, deltaY: number) {
  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
}

function hasNativeScrollContainer(target: EventTarget | null, deltaY: number) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body) {
    if (element.dataset.nativeScroll === "true") {
      return true;
    }

    if (isVerticallyScrollable(element) && canConsumeScroll(element, deltaY)) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let frameId: number | null = null;
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;

    const root = document.documentElement;
    root.classList.add("smooth-scroll-enabled");

    function getMaxScroll() {
      return Math.max(root.scrollHeight - window.innerHeight, 0);
    }

    function stopAnimation() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = null;
      currentScroll = window.scrollY;
      targetScroll = window.scrollY;
    }

    function animateScroll() {
      const distance = targetScroll - currentScroll;

      if (Math.abs(distance) < 0.5) {
        currentScroll = targetScroll;
        window.scrollTo(0, targetScroll);
        frameId = null;
        return;
      }

      currentScroll += distance * SCROLL_EASING;
      window.scrollTo(0, currentScroll);
      frameId = window.requestAnimationFrame(animateScroll);
    }

    function syncToNativeScroll() {
      if (frameId !== null) {
        return;
      }

      currentScroll = window.scrollY;
      targetScroll = window.scrollY;
    }

    function handleWheel(event: WheelEvent) {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        return;
      }

      const normalizedDelta = normalizeWheelDelta(event);

      if (Math.abs(normalizedDelta) < MIN_DELTA) {
        return;
      }

      if (hasNativeScrollContainer(event.target, normalizedDelta)) {
        return;
      }

      event.preventDefault();

      currentScroll = window.scrollY;
      targetScroll = clamp(targetScroll + normalizedDelta * WHEEL_MULTIPLIER, 0, getMaxScroll());

      if (frameId === null) {
        frameId = window.requestAnimationFrame(animateScroll);
      }
    }

    function handleResize() {
      targetScroll = clamp(targetScroll, 0, getMaxScroll());
      currentScroll = clamp(window.scrollY, 0, getMaxScroll());
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", syncToNativeScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      root.classList.remove("smooth-scroll-enabled");
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", syncToNativeScroll);
      window.removeEventListener("resize", handleResize);
      stopAnimation();
    };
  }, []);

  return children;
}
