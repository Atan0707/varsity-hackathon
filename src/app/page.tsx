import { BlurFadeTextDemo } from "@/components/demo/blur-fade-text-demo"

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-start pl-16 md:pl-24 lg:pl-32 h-[60vh] pt-60">
        <BlurFadeTextDemo />
      </div>
      <div className="w-full max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
          Active Pools Available
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pool cards would go here */}
          {/* You can add mock pool cards or integrate with your data source */}
        </div>
      </div>
    </div>
  );
}
