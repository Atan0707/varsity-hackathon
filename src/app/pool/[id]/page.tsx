'use client';

import React, { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getPoolByIdFromChain } from '@/utils/contract';
import { Pool } from '@/utils/poolData';
import { useAppKitProvider } from '@reown/appkit/react';
import Badge from '@/components/Badge';
import CategoryTag from '@/components/CategoryTag';
import VideoPlayer from '@/components/VideoPlayer';
import FundingStats from '@/components/pool/FundingStats';
import PoolInfo from '@/components/pool/PoolInfo';
import ProgressTracking from '@/components/pool/ProgressTracking';
import Donators from '@/components/pool/Donators';
import DonatorCount from '@/components/pool/DonatorCount';

// Tab types
type TabType = 'info' | 'progress' | 'donators';

export default function PoolPage({ params }: {params: Promise<{id: string}>}) {
  const { id } = use(params);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const { walletProvider } = useAppKitProvider("eip155");

  const fetchPool = async () => {
    try {
      setLoading(true);
      const poolData = await getPoolByIdFromChain(id, walletProvider);
      if (poolData) {
        setPool(poolData);
      } else {
        // If pool is not found, this will trigger a 404 page
        notFound();
      }
    } catch (error) {
      console.error('Error fetching pool:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, [id, walletProvider]);

  const handleDonationSuccess = () => {
    // Refresh pool data after a donation is made
    fetchPool();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-lg text-gray-600">Loading pool data...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-4">
        <div className="text-sm text-blue-600 uppercase font-medium mb-2">
          EQUITY CROWDFUNDING
        </div>
        <div className="absolute top-4 right-8">
          <button className="text-gray-600 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 0m-3.935 0l-9.566-5.314m9.566-4.314a2.25 2.25 0 10-3.935 0m3.935 0l-9.566 5.314" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 relative">
              {pool.logoUrl ? (
                <Image
                  src={pool.logoUrl}
                  alt={pool.title}
                  width={64}
                  height={64}
                  className="rounded-md"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-500 text-xl font-bold">{pool.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{pool.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{pool.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {pool.categories.map((category, index) => (
              <CategoryTag key={index} text={category} />
            ))}
            {pool.badges.map((badge, index) => (
              <Badge key={index} text={badge} />
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:flex-1">
              <VideoPlayer videoUrl={pool.videoUrl} />
            </div>
            <div className="lg:w-96 mt-6 lg:mt-0">
              <FundingStats
                status={pool.status}
                currentAmount={pool.currentAmount}
                targetAmount={pool.targetAmount}
                percentageRaised={pool.percentageRaised}
                investors={pool.investors}
                largestInvestment={pool.largestInvestment}
                daysLeft={pool.daysLeft}
                poolId={pool.id}
                onDonationSuccess={handleDonationSuccess}
              />
            </div>
          </div>

          {/* Campaign Section Tabs */}
          <div className="mt-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('info')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info' 
                    ? 'text-gray-900 border-gray-500' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Campaign Info
              </button>
              <button 
                onClick={() => setActiveTab('progress')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'progress' 
                    ? 'text-gray-900 border-gray-500' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Progress Tracking
              </button>
              <button 
                onClick={() => setActiveTab('donators')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'donators' 
                    ? 'text-red-600 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Donators
                <DonatorCount poolId={pool.id} />
              </button>
            </nav>
          </div>

          {/* Content section - displays based on selected tab */}
          <div className="py-6">
            {activeTab === 'info' && (
              <div className="space-y-8">
                <PoolInfo pool={pool} />
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div className="space-y-8">
                <ProgressTracking pool={pool} />
              </div>
            )}
            
            {activeTab === 'donators' && (
              <div className="space-y-8">
                <Donators pool={pool} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}