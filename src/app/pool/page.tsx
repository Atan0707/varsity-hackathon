"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllPoolsFromChain, isContractOwner } from '@/utils/contract';
import { formatCurrency, Pool } from '@/utils/poolData';
import { PoolLogo } from '@/components/ui/pool-logo';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';
import { useAppKitProvider } from '@reown/appkit/react';

// GraphQL response type
interface DonationReceivedResponse {
  donationReceiveds: {
    donor: string;
  }[];
}

// Update the Pool interface to include donors
interface PoolWithDonors extends Pool {
  donors: number;
}

export default function PoolsListPage() {
  const [pools, setPools] = useState<PoolWithDonors[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const { walletProvider } = useAppKitProvider("eip155");

  const getDonorsQuery = gql`
    query GetPoolDonors($poolId: BigInt!) {
      donationReceiveds(
        where: { poolId: $poolId }
      ) {
        donor
      }
    }
  `;
  
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const poolsData = await getAllPoolsFromChain();
        console.log(poolsData);
        
        // Update target amounts and percentageRaised for each pool
        const poolsWithTargets = poolsData.map(pool => {
          // For demonstration, set target to be 1.5x current amount if not provided
          const targetAmount = pool.targetAmount;
          const percentageRaised = Math.min(Math.floor((pool.currentAmount / targetAmount) * 100), 100);
          
          // Set daysLeft based on pool status - use pool.id to ensure consistent values
          const daysLeft = pool.daysLeft;
          
          return {
            ...pool,
            targetAmount,
            percentageRaised,
            daysLeft,
            donors: 0 // Initialize donors count
          };
        });
        
        // Fetch donors count for each pool
        const poolsWithDonors = await Promise.all(poolsWithTargets.map(async (pool) => {
          try {
            // Query the subgraph for donors
            const data = await request<DonationReceivedResponse>(
              SUBGRAPH_URL, 
              getDonorsQuery, 
              { poolId: pool.id }
            );
            
            // Get unique donors by using a Set
            const uniqueDonors = new Set(data.donationReceiveds.map((donation) => donation.donor));
            
            return {
              ...pool,
              donors: uniqueDonors.size
            };
          } catch (error) {
            console.error(`Error fetching donors for pool ${pool.id}:`, error);
            return pool;
          }
        }));
        
        setPools(poolsWithDonors);
      } catch (error) {
        console.error('Error fetching pools:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPools();
  }, [getDonorsQuery]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-[rgb(256,252,228)]">

      {/* Header with Create button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#ed6400]">Donation Pools</h1>
        {!ownerLoading && isOwner && (
          <Link href="/pool/create" className="bg-[#ed6400] text-white py-3 px-6 rounded-md hover:bg-[#0c252a]/90 transition flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Pool
          </Link>
        )}
      </div>

      {/* Search section  */}
      

      

      {/* Card grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="ml-4 text-lg text-gray-600">Loading pool data from blockchain...</p>
        </div>
      ) : pools.length > 0 ? (
        <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar md:grid md:grid-cols-3 md:gap-6">
          {pools.map((pool) => (
            <Link 
              key={pool.id} 
              href={`/pool/${pool.id}`} 
              className="block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-md transition-all transform hover:-translate-y-1 min-w-[280px] w-[280px] flex-shrink-0 md:w-auto"
            >
              <div className="relative">
                <PoolLogo
                  logoUrl={pool.logoUrl}
                  title={pool.title}
                  width={400}
                  height={180}
                  className="w-full h-[180px] object-cover rounded-t-2xl"
                  containerClassName="w-full h-[180px]"
                />
                {pool.daysLeft > 0 && (
                  <div className="absolute top-3 right-3 bg-[#0c252a]/80 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Live
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#172B4D] mb-3">{pool.title}</h2>
                
                <div className="mb-1">
                  <div className="flex items-start">
                    <div className="text-2xl font-bold text-[#172B4D]">{formatCurrency(pool.currentAmount)}</div>
                  </div>
                  <div className="text-sm text-gray-500">raised out of {formatCurrency(pool.targetAmount)} goal</div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6 mt-3">
                  <div 
                    className="bg-[#d9ff56] h-2 rounded-full" 
                    style={{ width: `${pool.percentageRaised}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[#172B4D]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3b30" className="w-5 h-5 mr-2">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="font-medium">{pool.donors || 0} Donors</span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {pool.daysLeft > 0 ? `${pool.daysLeft} days left` : 'Ended'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-lg text-gray-700">No donation pools available on the blockchain at the moment.</p>
          <p className="text-gray-500 mt-2">Check back soon!</p>
        </div>
      )}
    </div>
  );
}
