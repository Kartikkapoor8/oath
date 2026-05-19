import Hero from '@/components/Hero';
import StagedDemo from '@/components/StagedDemo';
import TryYourOwn from '@/components/TryYourOwn';
import ArchitectureDiagram from '@/components/ArchitectureDiagram';
import VoicePresets from '@/components/VoicePresets';
import RoadmapSection from '@/components/RoadmapSection';
import EngineeringProof from '@/components/EngineeringProof';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-bg text-fg overflow-x-hidden">
      <Hero />
      <StagedDemo />
      <TryYourOwn />
      <ArchitectureDiagram />
      <VoicePresets />
      <RoadmapSection />
      <EngineeringProof />
      <Footer />
    </main>
  );
}
