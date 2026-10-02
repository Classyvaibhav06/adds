import { ScrollBridge } from "@/components/hud/ScrollBridge";
import { Hud } from "@/components/hud/Hud";
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
