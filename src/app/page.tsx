import { BlurFadeTextDemo } from "@/components/demo/blur-fade-text-demo"
import { PoolsSection } from "@/components/sections/pools-section"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-[#0c252a] overflow-hidden">
        {/* Left lime circle */}
        <div className="absolute left-0 top-0 w-[400px] h-[400px] bg-[#d9ff56] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Right lime circle */}
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[#d9ff56] rounded-full translate-x-1/4 translate-y-1/4"></div>
        
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-7xl font-bold text-white mb-8">
              GlassFund
            </h1>
            <p className="text-lg md:text-2xl text-white mb-12 max-w-3xl">
              Track donations, trust the process
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleConnectClick}
                className="px-8 py-4 bg-[#d9ff56] text-[#0c252a] font-medium rounded-md hover:bg-opacity-90 transition"
              >
                Connect Wallet
              </button>
              <Link 
                href="/about" 
                className="px-8 py-4 text-white font-medium hover:underline"
              >
                Find out more
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <PoolsSection />
      </div>
    </div>
  );
}
