import "./shaders/threeui.css";
import { KageLandingPage } from "./shaders/landing-pages/LandingPages";

/**
 * Scene — the exact configured usage from the ThreeUI integration spec.
 *
 * Props passed exactly as documented:
 *   headingFont="onest"          bodyFont="onest"
 *   headingWeight="400"          bodyWeight="300"
 *   primaryColor="#e0231c"
 *   headingSize={46}             bodySize={17}
 *   headingLetterSpacing={-0.012}
 */
export function Scene() {
  return (
    <div className="shader-frame">
      <KageLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        primaryColor="#e0231c"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
      />
    </div>
  );
}

export default function App() {
  return <Scene />;
}
