import React, { useEffect } from 'react';
import ProgressBar from '../ProgressBar';
import DonateButton from '@/components/pool/DonateButton';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

interface FundingStatsProps {
  poolId: string;
  status?: string;
  currentAmount?: number;
  targetAmount?: number;
  percentageRaised?: number;
  investors?: number;
  largestInvestment?: number;
  daysLeft?: number;
  onDonationSuccess?: () => void;
}

interface SubgraphResponse {
  poolCreateds: Array<{
    name: string;
    blockTimestamp: string;
    poolId: string;
  }>;
  donationReceiveds: Array<{
    donor: string;
    amount: string;
    blockTimestamp: string;
    poolId: string;
  }>;
  allPools: Array<{
    poolId: string;
    name: string;
  }>;
}

// Format ETH with 4 decimal places
const formatEth = (amount: number): string => {
  return `${amount.toFixed(4)} ETH`;
};

const FundingStats: React.FC<FundingStatsProps> = ({
  poolId,
  status,
  currentAmount,
  targetAmount,
  percentageRaised,
  investors,
  largestInvestment, // eslint-disable-line @typescript-eslint/no-unused-vars
  daysLeft,
  onDonationSuccess,
}) => {
  // GraphQL query to fetch pool data from the subgraph
  const getPoolQuery = gql`
    query GetPool($poolId: BigInt!) {
      poolCreateds(where: { poolId: $poolId }) {
        name
        blockTimestamp
        poolId
      }
      donationReceiveds(where: { poolId: $poolId }) {
        donor
        amount
        blockTimestamp
        poolId
      }
      # Also fetch a few pools without filtering to see what's available
      allPools: poolCreateds(first: 5) {
        poolId
        name
      }
    }
  `;

  // Fetch pool data from the subgraph
  const { data: subgraphData, isLoading, isError, refetch } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: async () => {
      try {
        // Convert string poolId to BigInt for the subgraph query
        const parsedPoolId = parseInt(poolId);
        
        // Check if the poolId is valid
        if (isNaN(parsedPoolId)) {
          console.error('Invalid poolId format. Expected a number, got:', poolId);
          throw new Error('Invalid pool ID format');
        }
        
        console.log('Querying subgraph with poolId:', parsedPoolId);
        
        const data = await request<SubgraphResponse>(SUBGRAPH_URL, getPoolQuery, { 
          poolId: parsedPoolId
        });
        
        console.log('Subgraph URL:', SUBGRAPH_URL);
        console.log('Subgraph response status:', data ? 'success' : 'empty');
        
        // Log available pools from subgraph for debugging
        if (data && data.allPools) {
          console.log('Available pools in subgraph:', 
            data.allPools.map(p => `ID: ${p.poolId}, Name: ${p.name}`).join('\n')
          );
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching from subgraph:', error);
        throw error;
      }
    }
  });

  // Add effect to log the response for debugging
  useEffect(() => {
    if (subgraphData) {
      console.log('Processed subgraph data:', subgraphData);
    }
  }, [subgraphData]);

  // Process the data from subgraph response
  const processPoolData = () => {
    if (!subgraphData) return null;

    const { poolCreateds, donationReceiveds, allPools } = subgraphData;
    
    console.log('Pool creates:', poolCreateds);
    console.log('Donations:', donationReceiveds);
    console.log('All pools:', allPools);
    
    if (!poolCreateds || poolCreateds.length === 0) {
      console.log('No pool data found for poolId:', poolId);
      
      // If we have available pools but none match our ID, log this for debugging
      if (allPools && allPools.length > 0) {
        console.log('Available pool IDs:', allPools.map(p => p.poolId));
      }
      
      return null;
    }

    // Get pool name and calculate days left (using 30 days from creation as default)
    const poolInfo = poolCreateds[0];
    const creationTimestamp = Number(poolInfo.blockTimestamp) * 1000; // Convert to milliseconds
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const endTime = creationTimestamp + thirtyDaysInMs;
    const currentTime = Date.now();
    const daysLeft = Math.max(0, Math.ceil((endTime - currentTime) / (24 * 60 * 60 * 1000)));

    // Check if donations exist
    const hasDonations = donationReceiveds && donationReceiveds.length > 0;
    
    // Calculate total amount donated (or default to 0 if no donations)
    const totalDonatedWei = hasDonations 
      ? donationReceiveds.reduce(
          (sum: number, donation: { amount: string }) => sum + Number(donation.amount),
          0
        )
      : 0;
    
    const totalDonatedEth = totalDonatedWei / 1e18; // Convert from wei to ether

    console.log('Total donated ETH:', totalDonatedEth);

    // Count unique donators (or 0 if no donations)
    const uniqueDonors = hasDonations 
      ? new Set(donationReceiveds.map((d: { donor: string }) => d.donor)).size
      : 0;
    
    // Default target is 0.5 ETH
    const targetAmount = 0.5;
    
    // Calculate percentage raised
    const percentageRaised = Math.min(Math.floor((totalDonatedEth / targetAmount) * 100), 100);

    // Determine if pool is still active based on days left
    const status = daysLeft > 0 ? 'Live' : 'Closed';

    return {
      status,
      currentAmount: totalDonatedEth,
      targetAmount,
      percentageRaised,
      donators: uniqueDonors,
      daysLeft
    };
  };

  const poolData = processPoolData();

  // Handle donation success - refresh data
  const handleDonationSuccess = () => {
    refetch();
    if (onDonationSuccess) {
      onDonationSuccess();
    }
  };

  // Use props if provided, otherwise fall back to subgraph data
  const finalStatus = status || (poolData?.status);
  const finalCurrentAmount = currentAmount !== undefined ? currentAmount : (poolData?.currentAmount || 0);
  const finalTargetAmount = targetAmount !== undefined ? targetAmount : (poolData?.targetAmount || 0.5);
  const finalPercentageRaised = percentageRaised !== undefined ? percentageRaised : (poolData?.percentageRaised || 0);
  const finalDonators = investors !== undefined ? investors : (poolData?.donators || 0);
  const finalDaysLeft = daysLeft !== undefined ? daysLeft : (poolData?.daysLeft || 0);

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
            onClick={() => refetch()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <span className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg ${
          finalStatus === 'Live' 
            ? 'text-green-600 bg-green-50' 
            : 'text-gray-600 bg-gray-50'
        }`}>
          {finalStatus === 'Live' ? (
            <svg className="w-3 h-3 mr-1.5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1.5 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          {finalStatus}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-1">
          {formatEth(finalCurrentAmount)}
        </h2>
        <p className="text-sm text-gray-600 uppercase">
          {finalPercentageRaised}% OF THE MIN.TARGET ({formatEth(finalTargetAmount)})
        </p>
        <div className="mt-2">
          <ProgressBar percentage={finalPercentageRaised} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-2xl font-bold mb-1">{finalDonators}</div>
          <div className="text-sm text-gray-600 uppercase">Donators</div>
        </div>

        <div>
          <div className="text-2xl font-bold mb-1">{finalDaysLeft} days</div>
          <div className="text-sm text-gray-600 uppercase">Days Left</div>
        </div>

        <div>
          {finalStatus === 'Live' ? (
            <DonateButton poolId={poolId} onSuccess={handleDonationSuccess} />
          ) : (
            <button 
              disabled
              className="w-full py-3 px-4 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed opacity-70"
            >
              Donation Closed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundingStats; 