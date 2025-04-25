import React, { useEffect, useState, useCallback } from 'react';
import ProgressBar from '../ProgressBar';
import DonateButton from '@/components/pool/DonateButton';
import { getPoolByIdFromChain } from '@/utils/contract';
import { Pool } from '@/utils/poolData';
import { useQuery } from '@tanstack/react-query';
import { fetchDonations, DonatorData } from '@/utils/graphql';

interface FundingStatsProps {
  poolId: string;
  onDonationSuccess?: () => void;
}

// Format ETH with 4 decimal places
const formatEth = (amount: number): string => {
  return `${amount.toFixed(4)} ETH`;
};

const FundingStats: React.FC<FundingStatsProps> = ({
  poolId,
  onDonationSuccess,
}) => {
  const [poolData, setPoolData] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Use react-query to fetch donations data
  const { data: donationsData } = useQuery<DonatorData[]>({
    queryKey: ['poolDonations', poolId],
    queryFn: () => fetchDonations(poolId),
    refetchOnWindowFocus: false,
  });

  // Get total donations count
  const donationsCount = donationsData?.length || 0;

  // Function to fetch data from blockchain
  const fetchPoolData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Get pool data directly from the blockchain contract
      const data = await getPoolByIdFromChain(poolId);
      
      if (data) {
        console.log('Fetched pool data from blockchain:', data);
        setPoolData({
          ...data,
          donors: donationsCount // Override donors count with total donations count
        });
      } else {
        console.error('No pool data found for poolId:', poolId);
        setIsError(true);
      }
    } catch (error) {
      console.error('Error fetching pool data from blockchain:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [poolId, donationsCount]);

  // Fetch pool data on component mount and when poolId or donationsCount changes
  useEffect(() => {
    fetchPoolData();
  }, [poolId, fetchPoolData]);

  // Handle donation success - refresh data
  const handleDonationSuccess = () => {
    fetchPoolData();
    if (onDonationSuccess) {
      onDonationSuccess();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col w-full space-y-5">
          <div className="flex justify-end">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded-full w-full"></div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !poolData) {
    return (
      <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
        <div className="text-red-500 flex flex-col items-center">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>Failed to load pool data</p>
          <button 
            onClick={fetchPoolData} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Extract values from the pool data
  const {
    // status,
    currentAmount,
    targetAmount,
    percentageRaised,
    daysLeft
  } = poolData;

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <span className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg ${
          daysLeft > 0 
            ? 'text-green-600 bg-green-50' 
            : 'text-red-600 bg-red-50'
        }`}>
          {daysLeft > 0 ? (
            <svg className="w-3 h-3 mr-1.5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1.5 text-red-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 6l12 12M6 18L18 6"></path>
            </svg>
          )}
          {daysLeft > 0 ? 'Live' : 'Ended'}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-1">
          {formatEth(currentAmount)}
        </h2>
        <p className="text-sm text-gray-600 uppercase">
          {percentageRaised}% OF THE MIN.TARGET ({formatEth(targetAmount)})
        </p>
        <div className="mt-2">
          <ProgressBar percentage={percentageRaised} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-2xl font-bold mb-1">{donationsCount}</div>
          <div className="text-sm text-gray-600 uppercase">Donations</div>
        </div>

        <div>
          <div className="text-2xl font-bold mb-1">{daysLeft} days</div>
          <div className="text-sm text-gray-600 uppercase">Days Left</div>
        </div>

        <div>
          {daysLeft > 0 ? (
            <DonateButton poolId={poolId} onSuccess={handleDonationSuccess} />
          ) : (
            <button 
              disabled
              className="w-full py-3 px-4 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed opacity-70"
            >
              Campaign Ended
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundingStats; 