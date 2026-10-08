import type { PageTypographyRecipe } from "./pageTypography";

/* ═══════════════════════════════════════════════════════════════════════
   Kage — Secret Pathways
   Typography recipe for the Kage landing page.
   ═══════════════════════════════════════════════════════════════════════ */

export const KAGE_TYPOGRAPHY: PageTypographyRecipe = {
  headingFont: {
    value: "onest",
    label: "Onest",
    stack: '"Onest", system-ui, -apple-system, "Helvetica Neue", sans-serif',
  },
  bodyFont: {
    value: "onest",
    label: "Onest",
    stack: '"Onest", system-ui, -apple-system, "Helvetica Neue", sans-serif',
  },
  headingWeight: "400",
  bodyWeight: "300",
  primary: "#e0231c",
  headingSize: 46,
  bodySize: 17,
  headingLetterSpacing: -0.012,
};
