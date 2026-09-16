import TownField from "@/components/TownField";
import HeroOverlay from "@/components/HeroOverlay";
import CornerFurniture from "@/components/CornerFurniture";
import Observe from "@/components/sections/Observe";
import Detect from "@/components/sections/Detect";
import DissectGallery from "@/components/sections/DissectGallery";
import Respond from "@/components/sections/Respond";
import Report from "@/components/sections/Report";
import LoopClosed from "@/components/sections/LoopClosed";

export default function Page() {
  return (
    <main id="top" className="relative">
      <TownField />
      <CornerFurniture />
      <div className="relative z-10">
        <HeroOverlay />
        {/* field dims behind this point */}
        <div className="relative" style={{ background: "linear-gradient(to bottom, transparent 0, rgba(11,12,9,0.92) 55vh, rgba(11,12,9,0.98) 100vh)" }}>
          <Observe />
          <Detect />
          {/* rail IS section 03 — pinned horizontally */}
          <DissectGallery />
        </div>
        {/* inverted — paper stage */}
        <Respond />
        <div style={{ background: "rgba(11,12,9,0.98)" }}>
          <Report />
          <LoopClosed />
        </div>
      </div>
    </main>
  );
}
