"use client";
import { useEffect, useLayoutEffect, useRef } from "react";

const SCROLL_KEY_PREFIX = "semantic-lb:scroll";

function getScrollKey() {
  return `${SCROLL_KEY_PREFIX}:${window.location.pathname}${window.location.search}`;
}

function readStoredScroll() {
  const stored = window.sessionStorage.getItem(getScrollKey());
  const parsed = stored ? Number.parseFloat(stored) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : window.scrollY;
}

function saveCurrentScroll() {
  window.sessionStorage.setItem(getScrollKey(), String(window.scrollY));
}

function jumpToScrollPosition(top: number) {
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo({ top, left: 0, behavior: "auto" });
  window.setTimeout(() => {
    document.documentElement.style.scrollBehavior = previousBehavior;
  }, 0);
}

function finishScrollRestoration() {
  window.requestAnimationFrame(() => {
    document.documentElement.removeAttribute("data-restoring-scroll");
  });
}

export function DesktopSmoothScroll() {
  const restoredScrollRef = useRef(0);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const restoredScroll = readStoredScroll();
    restoredScrollRef.current = restoredScroll;

    if (restoredScroll > 0) {
      jumpToScrollPosition(restoredScroll);
    }
    finishScrollRestoration();

    let ticking = false;
    const saveScrollSoon = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        saveCurrentScroll();
        ticking = false;
      });
    };

    window.addEventListener("scroll", saveScrollSoon, { passive: true });
    window.addEventListener("pagehide", saveCurrentScroll);
    window.addEventListener("beforeunload", saveCurrentScroll);
    document.addEventListener("visibilitychange", saveCurrentScroll);

    return () => {
      saveCurrentScroll();
      window.removeEventListener("scroll", saveScrollSoon);
      window.removeEventListener("pagehide", saveCurrentScroll);
      window.removeEventListener("beforeunload", saveCurrentScroll);
      document.removeEventListener("visibilitychange", saveCurrentScroll);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const supportsDesktopScroll =
      window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsDesktopScroll || prefersReducedMotion) return;

    let disposed = false;
    let scroll: { destroy(): void; resize(): void; start(): void; scrollTo(target: number, options?: { immediate?: boolean; force?: boolean }): void } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    import("locomotive-scroll")
      .then(({ default: LocomotiveScroll }) => {
        if (disposed) return;

        scroll = new LocomotiveScroll({
          lenisOptions: {
            lerp: 0.085,
            duration: 1.12,
            smoothWheel: true,
            wheelMultiplier: 0.82,
          },
          rafRootMargin: "120% 100% 120% 100%",
          autoStart: false,
        });

        if (restoredScrollRef.current > 0) {
          scroll.scrollTo(restoredScrollRef.current, { immediate: true, force: true });
        }
        finishScrollRestoration();

        document.documentElement.classList.add("locomotive-ready");

        resizeObserver = new ResizeObserver(() => {
          window.requestAnimationFrame(() => scroll?.resize());
        });
        resizeObserver.observe(document.body);

        window.requestAnimationFrame(() => {
          if (!disposed) scroll?.start();
        });
      })
      .catch(() => {
        document.documentElement.classList.remove("locomotive-ready");
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      scroll?.destroy();
      document.documentElement.classList.remove("locomotive-ready");
    };
  }, []);

  return null;
}
