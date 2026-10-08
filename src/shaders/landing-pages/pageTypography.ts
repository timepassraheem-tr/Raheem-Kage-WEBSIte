import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   Typography and colour controls for the packaged landing pages.

   Every page here is a complete authored document served byte-for-byte
   inside a sandboxed frame, so nothing may be rewritten on the way in.
   The controls work the only way that leaves the document untouched: one
   stylesheet appended to the frame's own <head> once it has loaded, which
   restates the page's own selectors with the chosen values.

   At their defaults every override restates exactly what the page already
   says, so a prop-less render paints the authored page and nothing else —
   the same contract Trochil's controls hold.

   Fonts are the one thing a stylesheet cannot conjure. Each page keeps its
   authored face as the first option and its default, and the three shared
   alternatives are only fetched from Google Fonts once one of them is
   actually chosen. So a page that ships self-contained stays request-free
   until the moment you ask it for a face it does not carry.
   ═══════════════════════════════════════════════════════════════════════ */

export type PageFont = {
  value: string;
  label: string;
  stack: string;
  /** Google Fonts css2 family spec. Absent for a face the page already carries. */
  google?: string;
};

/** The three shared alternatives, offered by every page in this family. */
export const INSTRUMENT_SERIF: PageFont = {
  value: "instrument-serif",
  label: "Instrument Serif",
  stack: '"Instrument Serif", Georgia, serif',
  google: "Instrument+Serif",
};

export const NEWSREADER: PageFont = {
  value: "newsreader",
  label: "Newsreader",
  stack: '"Newsreader", Georgia, serif',
  google: "Newsreader:wght@200..700",
};

export const GEIST: PageFont = {
  value: "geist",
  label: "Geist",
  stack: '"Geist", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  google: "Geist:wght@100..900",
};

export const ONEST: PageFont = {
  value: "onest",
  label: "Onest",
  stack: '"Onest", system-ui, -apple-system, "Helvetica Neue", sans-serif',
};

export type PageTypographyProps = {
  headingFont?: string;
  bodyFont?: string;
  headingWeight?: string;
  bodyWeight?: string;
  primaryColor?: string;
  headingSize?: number;
  bodySize?: number;
  headingLetterSpacing?: number;
};

/** Resolved, clamped values plus the colour helpers a recipe writes its CSS with. */
export type PageTypography = {
  heading: string;
  body: string;
  headingWeight: string;
  bodyWeight: string;
  primary: string;
  headingSize: number;
  bodySize: number;
  headingLetterSpacing: number;
  /**
   * Move one of the page's authored colours by the same shift the primary
   * took. Keeps a palette's internal relationships — a lighter tint stays
   * the lighter tint — instead of flattening every accent onto one hex.
   */
  retone: (hex: string) => string;
  /** The same shift applied to an authored `rgb()` / `rgba()` string, alpha kept. */
  retoneRgba: (color: string) => string;
  /** A Google Fonts import URL, or null if all chosen faces are self-hosted. */
  googleFontsUrl: string | null;
};

export type PageTypographyRecipe = {
  headingFont: PageFont;
  bodyFont: PageFont;
  headingWeight: string;
  bodyWeight: string;
  primary: string;
  headingSize: number;
  bodySize: number;
  headingLetterSpacing: number;
};

/** All available fonts keyed by their value strings. */
const FONTS: Record<string, PageFont> = {
  "instrument-serif": INSTRUMENT_SERIF,
  newsreader: NEWSREADER,
  geist: GEIST,
  onest: ONEST,
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

/** Compute an additive RGB shift from authored primary to chosen primary. */
function computeShift(authored: string, chosen: string): [number, number, number] {
  const a = hexToRgb(authored), c = hexToRgb(chosen);
  if (!a || !c) return [0, 0, 0];
  return [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
}

function applyShift(hex: string, shift: [number, number, number]): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb[0] + shift[0], rgb[1] + shift[1], rgb[2] + shift[2]);
}

function applyShiftRgba(color: string, shift: [number, number, number]): string {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return color;
  const r = Math.round(Math.max(0, Math.min(255, parseInt(m[1]) + shift[0])));
  const g = Math.round(Math.max(0, Math.min(255, parseInt(m[2]) + shift[1])));
  const b = Math.round(Math.max(0, Math.min(255, parseInt(m[3]) + shift[2])));
  if (m[4] !== undefined) return `rgba(${r},${g},${b},${m[4]})`;
  return `rgb(${r},${g},${b})`;
}

/**
 * Splits a flat props object into the typography-specific keys and the rest.
 * The rest goes straight to LandingPageFrame.
 */
export function splitTypographyProps<T extends PageTypographyProps>(
  props: T,
): [PageTypographyProps, Omit<T, keyof PageTypographyProps>] {
  const { headingFont, bodyFont, headingWeight, bodyWeight, primaryColor, headingSize, bodySize, headingLetterSpacing, ...rest } = props;
  return [{ headingFont, bodyFont, headingWeight, bodyWeight, primaryColor, headingSize, bodySize, headingLetterSpacing }, rest as Omit<T, keyof PageTypographyProps>];
}

/**
 * Resolves prop overrides against a page recipe, producing a stable
 * PageTypography object. Re-identified only when values actually change.
 */
export function usePageTypography(
  recipe: PageTypographyRecipe,
  overrides: PageTypographyProps,
): PageTypography {
  return useMemo(() => {
    const primary = overrides.primaryColor ?? recipe.primary;
    const shift = computeShift(recipe.primary, primary);

    const hfValue = overrides.headingFont ?? recipe.headingFont.value;
    const bfValue = overrides.bodyFont ?? recipe.bodyFont.value;
    const hFont = FONTS[hfValue] ?? recipe.headingFont;
    const bFont = FONTS[bfValue] ?? recipe.bodyFont;

    const googleFamilies: string[] = [];
    if (hFont.google) googleFamilies.push(hFont.google);
    if (bFont.google && bFont.google !== hFont.google) googleFamilies.push(bFont.google);
    const googleFontsUrl = googleFamilies.length > 0
      ? `https://fonts.googleapis.com/css2?${googleFamilies.map(f => `family=${f}`).join("&")}&display=swap`
      : null;

    return {
      heading: hFont.stack,
      body: bFont.stack,
      headingWeight: overrides.headingWeight ?? recipe.headingWeight,
      bodyWeight: overrides.bodyWeight ?? recipe.bodyWeight,
      primary,
      headingSize: overrides.headingSize ?? recipe.headingSize,
      bodySize: overrides.bodySize ?? recipe.bodySize,
      headingLetterSpacing: overrides.headingLetterSpacing ?? recipe.headingLetterSpacing,
      retone: (hex: string) => applyShift(hex, shift),
      retoneRgba: (color: string) => applyShiftRgba(color, shift),
      googleFontsUrl,
    };
  }, [
    recipe,
    overrides.headingFont,
    overrides.bodyFont,
    overrides.headingWeight,
    overrides.bodyWeight,
    overrides.primaryColor,
    overrides.headingSize,
    overrides.bodySize,
    overrides.headingLetterSpacing,
  ]);
}
