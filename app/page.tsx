import TownField from "@/components/TownField";
import HeroOverlay from "@/components/HeroOverlay";
import CornerFurniture from "@/components/CornerFurniture";
import Observe from "@/components/sections/Observe";
import Respond from "@/components/sections/Respond";
import Detect from "@/components/sections/Detect";
import DissectGallery from "@/components/sections/DissectGallery";
import Report from "@/components/sections/Report";
import LoopClosed from "@/components/sections/LoopClosed";

export default function Page() {
  return (
    <main id="top" className="relative">
      <TownField />
      <CornerFurniture />
      <div className="relative z-10">
        <HeroOverlay />
        <div className="relative" style={{ background: "linear-gradient(to bottom, transparent 0, rgba(11,12,9,0.92) 55vh, rgba(11,12,9,0.98) 100vh)" }}>
          <Observe />
        </div>
        {/* how i work — manifesto before evidence */}
        <Respond />
        <div className="relative" style={{ background: "rgba(11,12,9,0.98)" }}>
          <Detect />
          {/* rail — all 10 projects with continuous ribbon spine */}
          <DissectGallery />
          <Report />
          <LoopClosed />
        </div>
      </div>
    </main>
  );
}
