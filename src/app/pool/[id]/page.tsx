'use client';

import React, { useState, use, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { getPoolByIdFromChain, isContractOwner } from '@/utils/contract';
import { Pool } from '@/utils/poolData';
import { useAppKitProvider } from '@reown/appkit/react';
// import Badge from '@/components/Badge';
// import CategoryTag from '@/components/CategoryTag';
import VideoPlayer from '@/components/VideoPlayer';
import FundingStats from '@/components/pool/FundingStats';
import PoolInfo from '@/components/pool/PoolInfo';
import ProgressTracking from '@/components/pool/ProgressTracking';
import Donators from '@/components/pool/Donators';
import DonatorCount from '@/components/pool/DonatorCount';
import { PoolLogo } from '@/components/ui/pool-logo';
import FundAllocation from '@/components/pool/FundAllocation';
import CreateItemModal from '@/components/pool/CreateItemModal';
import PoolItems from '@/components/pool/PoolItems';

// Tab types
type TabType = 'info' | 'progress' | 'donators' | 'fundAllocation' | 'items';

export default function PoolPage({ params }: {params: Promise<{id: string}>}) {
  const { id } = use(params);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const { walletProvider } = useAppKitProvider("eip155");
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(true);

  const fetchPool = useCallback(async () => {
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
  }, [id, walletProvider]);

  useEffect(() => {
    fetchPool();
  }, [id, walletProvider, fetchPool]);

  // Check if current user is the contract owner
  useEffect(() => {
    const checkIsOwner = async () => {
      setOwnerLoading(true);
      if (walletProvider) {
        const ownerStatus = await isContractOwner(walletProvider);
        setIsOwner(ownerStatus);
      } else {
        setIsOwner(false);
      }
      setOwnerLoading(false);
    };
    
    checkIsOwner();
  }, [walletProvider]);

  const handleDonationSuccess = () => {
    // Refresh pool data after a donation is made
    fetchPool();
  };

  const handleItemCreated = () => {
    // Refresh pool data after an item is created
    fetchPool();
    // Switch to items tab after creating an item
    setActiveTab('items');
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
        <div className="flex justify-end">
          {!ownerLoading && isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreateItemModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Item
              </button>
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 0m-3.935 0l-9.566-5.314m9.566-4.314a2.25 2.25 0 10-3.935 0m3.935 0l-9.566 5.314" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 relative">
              <PoolLogo
                logoUrl={pool.logoUrl}
                title={pool.title}
                width={64}
                height={64}
                className="rounded-md object-cover"
                containerClassName="w-16 h-16"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{pool.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{pool.tagline}</p>
            </div>
          </div>

          {/* <div className="flex flex-wrap gap-2 mb-6">
            {pool.categories.map((category, index) => (
              <CategoryTag key={index} text={category} />
            ))}
            {pool.badges.map((badge, index) => (
              <Badge key={index} text={badge} />
            ))}
          </div> */}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:flex-1">
              <VideoPlayer videoUrl={pool.videoUrl} />
            </div>
            <div className="lg:w-96 mt-6 lg:mt-0">
              <FundingStats
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
              <button 
                onClick={() => setActiveTab('items')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items' 
                    ? 'text-gray-900 border-gray-500' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Items
              </button>
              <button 
                onClick={() => setActiveTab('fundAllocation')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'fundAllocation' 
                    ? 'text-gray-900 border-gray-500' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Fund Allocation
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
            
            {activeTab === 'items' && (
              <div className="space-y-8">
                <PoolItems poolId={pool.id} />
              </div>
            )}
            
            {activeTab === 'fundAllocation' && (
              <div className="space-y-8">
                <FundAllocation />
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Create Item Modal */}
      <CreateItemModal 
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        poolId={id}
        onItemCreated={handleItemCreated}
      />
    </div>
  );
}