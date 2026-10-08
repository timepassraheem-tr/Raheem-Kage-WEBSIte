import {
  splitTypographyProps,
  usePageTypography,
  type PageTypographyProps,
} from "./pageTypography";
import { LandingPageFrame, type LandingPageProps } from "./LandingPageFrame";
export { LandingPageFrame, applyBackgroundPresentation } from "./LandingPageFrame";
export type { LandingPageFrameProps, LandingPageProps } from "./LandingPageFrame";
import { KAGE_TYPOGRAPHY } from "./pageRecipes";

/**
 * KageLandingPage — the complete Kage temple experience.
 *
 * Loads `/landing-pages/kage.html` byte-for-byte inside a sandboxed iframe
 * and injects typography/colour overrides via a <style> appended to its <head>.
 *
 * Props mirror the ThreeUI source exactly:
 *   headingFont, bodyFont, headingWeight, bodyWeight — font stack overrides
 *   primaryColor — shifts the page's vermilion accent and all derived tones
 *   headingSize, bodySize, headingLetterSpacing — scale/tracking overrides
 */
export function KageLandingPage(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(KAGE_TYPOGRAPHY, type);
  return (
    <LandingPageFrame
      {...frame}
      customization={customization}
      title="Kage — Where stillness reveals the unseen"
      sourceUrl="/landing-pages/kage.html"
    />
  );
}
