"use client";

import Rail from "@/components/dissect/Rail";
import StubPanel from "@/components/dissect/StubPanel";
import Sovrego from "@/components/dissect/panels/Sovrego";
import Breathalyzer from "@/components/dissect/panels/Breathalyzer";
import AccessControl from "@/components/dissect/panels/AccessControl";
import NetworkAnalyzer from "@/components/dissect/panels/NetworkAnalyzer";
import Exosky from "@/components/dissect/panels/Exosky";
import Homelab from "@/components/dissect/panels/Homelab";

const P: Record<string, React.ComponentType<{ progress: number }>> = {
  sovrego: Sovrego,
  breathalyzer: Breathalyzer,
  "access-control": AccessControl,
  "network-analyzer": NetworkAnalyzer,
  exosky: Exosky,
  homelab: Homelab,
  malwareDetection: (p) => <StubPanel {...p} name="malware detection" axis="hairline scrub" />,
  malwareGeneration: (p) => <StubPanel {...p} name="malware generation" axis="vertical ↓" />,
  community: (p) => <StubPanel {...p} name="gatherguide · ctf workshop" axis="horizontal →" />,
  whiteeye: (p) => <StubPanel {...p} name="whiteeye" axis="zoom-out" />,
};

const ORDER: { id: keyof typeof P; name: string; axis: string }[] = [
  { id: "sovrego", name: "sovrego", axis: "diagonal ↘" },
  { id: "breathalyzer", name: "breathalyzer", axis: "zoom-out" },
  { id: "access-control", name: "access control", axis: "horizontal →" },
  { id: "network-analyzer", name: "network analyzer", axis: "orbit ⟳" },
  { id: "exosky", name: "exosky", axis: "zoom-in" },
  { id: "homelab", name: "homelab", axis: "drag" },
  { id: "malwareDetection", name: "malware detection", axis: "hairline scrub" },
  { id: "malwareGeneration", name: "malware generation", axis: "vertical ↓" },
  { id: "community", name: "gatherguide", axis: "horizontal →" },
  { id: "whiteeye", name: "whiteeye", axis: "zoom-out" },
];

export default function DissectGallery() {
  const panels = ORDER.map((o) => ({
    id: String(o.id),
    name: o.name,
    desc: "",
    axis: o.axis,
    component: P[String(o.id)],
  }));
  return <Rail panels={panels} />;
}
