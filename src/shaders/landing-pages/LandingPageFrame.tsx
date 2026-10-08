import { useEffect, useRef, type ReactNode } from "react";
import type { PageTypography } from "./pageTypography";

export type LandingPageProps = {
  /** Additional class names for the outer wrapper. */
  className?: string;
  /** Inline styles for the outer wrapper. */
  style?: React.CSSProperties;
  /** Extra children rendered alongside the iframe (portals, overlays). */
  children?: ReactNode;
};

export type LandingPageFrameProps = LandingPageProps & {
  /** Human-readable title forwarded to the iframe title attribute. */
  title: string;
  /** The URL of the canonical page to load (served from /public). */
  sourceUrl: string;
  /**
   * Optional pre-built srcdoc. If present, this is used instead of sourceUrl.
   * The frame key must be changed when switching srcdoc contents.
   */
  srcDoc?: string;
  /**
   * Typography / colour overrides to inject into the frame's <head> once loaded.
   */
  customization?: PageTypography;
  /**
   * CSS selector for the canvas the frame uses as its background.
   * When set, the frame background is made transparent so the canvas
   * bleeds through the containing document.
   */
  backgroundCanvasSelector?: string;
  /**
   * CSS selector for an overlay veil element to suppress when running in
   * background-canvas mode.
   */
  backgroundVisualSelector?: string;
  /**
   * Called after the frame loads with the iframe element. Use to push
   * scene-level settings into the document (e.g. via postMessage or
   * contentWindow APIs).
   */
  applyScene?: (element: HTMLIFrameElement) => void;
};

/**
 * Builds the CSS override string to inject into the frame's <head>.
 *
 * Every selector restates exactly the page's own rules — so at defaults
 * (no overrides chosen) the result is a no-op and the authored page wins.
 * Only the values that differ from the recipe actually change anything.
 */
function buildCustomizationCSS(t: PageTypography): string {
  const em = (v: number) => `${v}em`;
  const px = (v: number) => `${v}px`;

  return `
/* ── ThreeUI typography override ─────────────────────────────── */
:root {
  --vermilion: ${t.primary};
  --ember: ${t.retone("#ff5a3c")};
}
body, .body, .body-lg {
  font-family: ${t.body};
  font-weight: ${t.bodyWeight};
  font-size: ${px(t.bodySize)};
}
h1, h2, h3, .display {
  font-family: ${t.heading};
  font-weight: ${t.headingWeight};
}
.h-hero {
  font-size: clamp(26px, 3.05vw, ${px(t.headingSize)});
  letter-spacing: ${em(t.headingLetterSpacing)};
}
.h-sec {
  letter-spacing: ${em(t.headingLetterSpacing)};
}
.display {
  letter-spacing: ${em(t.headingLetterSpacing)};
}
`.trim();
}

/**
 * Injects the Google Fonts link element into the frame's <head>, then
 * the override <style> block. Both are idempotent: a second call is a
 * no-op if the same URL / data-id is already present.
 */
function injectCustomization(doc: Document, t: PageTypography): void {
  const head = doc.head;
  if (!head) return;

  // Google Fonts link
  if (t.googleFontsUrl) {
    const id = "threeui-gfonts";
    if (!doc.getElementById(id)) {
      const link = doc.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = t.googleFontsUrl;
      head.appendChild(link);
    }
  }

  // Override stylesheet
  const id = "threeui-typography";
  let style = doc.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = id;
    head.appendChild(style);
  }
  style.textContent = buildCustomizationCSS(t);
}

/**
 * Applies background-canvas presentation mode: makes the page background
 * transparent, hides the target canvas (so the host document's own canvas
 * or whatever sits below the iframe shows through), and optionally hides a
 * veil overlay used by some pages.
 *
 * This is used when the component is mounted as a background widget rather
 * than a full-page experience.
 */
function applyBackgroundPresentation(
  doc: Document,
  canvasSelector: string,
  visualSelector?: string,
): void {
  const canvas = doc.querySelector<HTMLElement>(canvasSelector);
  if (canvas) canvas.style.display = "none";
  if (visualSelector) {
    const veil = doc.querySelector<HTMLElement>(visualSelector);
    if (veil) veil.style.display = "none";
  }
  doc.documentElement.style.background = "transparent";
  doc.body.style.background = "transparent";
}

export { applyBackgroundPresentation };

/**
 * A sandboxed iframe that loads one of ThreeUI's packaged landing-page
 * documents and optionally injects typography/colour overrides into its head.
 *
 * The iframe is always full-viewport so the scene can use fixed positioning
 * and scroll detection exactly as the authored page expects. The outer
 * `.landing-page-frame` wrapper provides the clip.
 */
export function LandingPageFrame({
  title,
  sourceUrl,
  srcDoc,
  customization,
  backgroundCanvasSelector,
  backgroundVisualSelector,
  applyScene,
  className,
  style,
  children,
}: LandingPageFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleLoad() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    if (customization) injectCustomization(doc, customization);
    if (backgroundCanvasSelector) {
      applyBackgroundPresentation(doc, backgroundCanvasSelector, backgroundVisualSelector);
    }
    if (applyScene) applyScene(iframe);
  }

  // Re-apply customization when it changes without a full reload
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !customization) return;
    const doc = iframe.contentDocument;
    if (!doc || !doc.head) return;
    injectCustomization(doc, customization);
  }, [customization]);

  // Re-apply scene settings when they change
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !applyScene) return;
    applyScene(iframe);
  }, [applyScene]);

  return (
    <div
      className={`landing-page-frame${className ? ` ${className}` : ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <iframe
        ref={iframeRef}
        title={title}
        src={srcDoc ? undefined : sourceUrl}
        srcDoc={srcDoc}
        onLoad={handleLoad}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        // Allow the document scripts (WebGL, pointer, scroll) to run.
        // Same-origin pages (src=) need no sandbox at all; srcdoc pages
        // get the minimum set for scripts + same-origin so postMessage works.
        sandbox={srcDoc ? "allow-scripts allow-same-origin" : undefined}
      />
      {children}
    </div>
  );
}
