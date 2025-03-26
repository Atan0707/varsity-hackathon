"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllPoolsFromChain } from '@/utils/contract';
import { formatCurrency, Pool } from '@/utils/poolData';
import { PoolLogo } from '@/components/ui/pool-logo';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

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
        
        // Update target amounts and percentageRaised for each pool
        const poolsWithTargets = poolsData.map(pool => {
          // For demonstration, set target to be 1.5x current amount if not provided
          const targetAmount = 0.5;
          const percentageRaised = Math.min(Math.floor((pool.currentAmount / targetAmount) * 100), 100);
          
          // Set daysLeft based on pool status - use pool.id to ensure consistent values
          const daysLeft = pool.status === 'Live' 
            ? (Number(pool.id) % 25) + 5 // 5 to 30 days based on pool ID
            : 0;
          
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
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-[rgb(256,252,228)]">

      {/* Search section  */}
       <div className="mb-8 flex gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search campaign's name..."
            className="w-full pl-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
          />
        </div>
        <button className="bg-[#0c252a] text-white py-3 px-8 rounded-md hover:bg-[#0c252a]/90 transition whitespace-nowrap flex-shrink-0">
          Search
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex justify-between mb-12">
        <div className="flex flex-wrap overflow-x-auto">
          <button className="px-4 py-2 bg-[#0c252a] text-white rounded-md mr-2 mb-2 whitespace-nowrap">
            Non Profit
          </button>
          <button className="px-4 py-2 bg-transparent text-[#0c252a] border border-gray-300 rounded-md mr-2 mb-2 whitespace-nowrap hover:bg-gray-100">
            Social Enterprise
          </button>
          <button className="px-4 py-2 bg-transparent text-[#0c252a] border border-gray-300 rounded-md mr-2 mb-2 whitespace-nowrap hover:bg-gray-100">
            Corporate
          </button>
          <button className="px-4 py-2 bg-transparent text-[#0c252a] border border-gray-300 rounded-md mr-2 mb-2 whitespace-nowrap hover:bg-gray-100">
            Club
          </button>
          <button className="px-4 py-2 bg-transparent text-[#0c252a] border border-gray-300 rounded-md mr-2 mb-2 whitespace-nowrap hover:bg-gray-100">
            Personal Fundraiser
          </button>
        </div>
        <div className="hidden md:block">
          <button className="px-4 py-2 bg-[#0c252a] text-white rounded-full flex items-center">
            Name: A to Z
            <svg className="w-4 h-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="ml-4 text-lg text-gray-600">Loading pool data from blockchain...</p>
        </div>
      ) : pools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pools.map((pool) => (
            <Link 
              key={pool.id} 
              href={`/pool/${pool.id}`} 
              className="block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-md transition-all transform hover:-translate-y-1"
            >
              <div className="relative">
                <PoolLogo
                  logoUrl={pool.logoUrl}
                  title={pool.title}
                  width={400}
                  height={220}
                  className="w-full h-[220px] object-cover rounded-t-2xl"
                  containerClassName="w-full h-[220px]"
                />
                <div className="absolute top-3 right-3 bg-[#0c252a]/80 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {pool.status}
                </div>
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
