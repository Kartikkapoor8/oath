import Hero from '@/components/Hero';
import StagedDemo from '@/components/StagedDemo';
import TryYourOwn from '@/components/TryYourOwn';
import PipelineDiagram from '@/components/PipelineDiagram';
import RubricVisualization from '@/components/RubricVisualization';
import ComparisonSection from '@/components/ComparisonSection';
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
      <PipelineDiagram />
      <RubricVisualization />
      <ComparisonSection />
      <VoicePresets />
      <RoadmapSection />
      <EngineeringProof />
      <Footer />
    </main>
  );
}
