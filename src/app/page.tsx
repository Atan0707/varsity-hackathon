import { BlurFadeTextDemo } from "@/components/demo/blur-fade-text-demo"
import { PoolsSection } from "@/components/sections/pools-section"

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-start pl-16 md:pl-24 lg:pl-32 h-[60vh] pt-60">
        <BlurFadeTextDemo />
      </div>
      <div className="mt-2">
        <PoolsSection />
      </div>
    </div>
  );
}
