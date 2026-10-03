import { ScrollBridge } from "@/components/hud/ScrollBridge";
import { Hud } from "@/components/hud/Hud";
import { Hotbar } from "@/components/hud/Hotbar";
import { DebugOverlay } from "@/components/hud/DebugOverlay";
import { LiveFeed } from "@/components/hud/LiveFeed";
import VoxelScene from "@/components/minecraft/VoxelScene";
import {
  HeroSection,
  AboutSection,
  SkillsSection,
  ProjectsSection,
  InfraSection,
  ContactSection,
} from "@/components/sections/sections";

export default function Page() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[#0e0c14]">
      <ScrollBridge />
      <VoxelScene />
      <Hud />
      <LiveFeed />
      <Hotbar />
      <DebugOverlay />
      <div className="relative z-10 pointer-events-none">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <InfraSection />
        <ContactSection />
      </div>
    </main>
  );
}
