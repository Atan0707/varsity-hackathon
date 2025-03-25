import { BlurFadeTextDemo } from "@/components/demo/blur-fade-text-demo"
import Link from 'next/link';
import Image from 'next/image';
import { getAllPools, formatCurrency } from '@/utils/poolData';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';

export default function Home() {
  const pools = getAllPools();
  
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
          {pools.map((pool) => (
            <Link 
              key={pool.id} 
              href={`/pool/${pool.id}`} 
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative p-4">
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    <span className="w-1.5 h-1.5 mr-1 bg-green-500 rounded-full"></span>
                    {pool.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 relative flex-shrink-0">
                    {pool.logoUrl ? (
                      <Image
                        src={pool.logoUrl}
                        alt={pool.title}
                        width={48}
                        height={48}
                        className="rounded-md"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-bold">{pool.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{pool.title}</h2>
                    <p className="text-sm text-gray-600 line-clamp-1">{pool.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {pool.badges.map((badge, index) => (
                    <Badge key={index} text={badge} />
                  ))}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(pool.currentAmount)}</span>
                    <span className="text-sm text-gray-500">{pool.percentageRaised}%</span>
                  </div>
                  <ProgressBar percentage={pool.percentageRaised} />
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Target: </span>
                    <span className="font-medium">{formatCurrency(pool.targetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Days left: </span>
                    <span className="font-medium">{pool.daysLeft}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            href="/pool" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            View All Pools
          </Link>
        </div>
      </div>
    </div>
  );
}
