import React, { useEffect, useState } from 'react';
import ProgressBar from '../ProgressBar';
import DonateButton from '@/components/pool/DonateButton';
import { formatCurrency } from '@/utils/poolData';
import { getPoolByIdFromChain } from '@/utils/contract';
import { useAppKitProvider } from '@reown/appkit/react';

interface FundingStatsProps {
  poolId: string;
  onDonationSuccess?: () => void;
}

const FundingStats: React.FC<FundingStatsProps> = ({
  poolId,
  onDonationSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolData, setPoolData] = useState<{
    status: string;
    currentAmount: number;
    targetAmount: number;
    percentageRaised: number;
    investors: number;
    daysLeft: number;
  } | null>(null);

  const { walletProvider } = useAppKitProvider("eip155");

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pool = await getPoolByIdFromChain(poolId, walletProvider);
      
      if (pool) {
        setPoolData({
          status: pool.status,
          currentAmount: pool.currentAmount,
          targetAmount: pool.targetAmount,
          percentageRaised: pool.percentageRaised,
          investors: pool.investors,
          daysLeft: pool.daysLeft
        });
      } else {
        setError('Pool not found');
      }
    } catch (err) {
      console.error('Error fetching pool data:', err);
      setError('Failed to load pool data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, [poolId, walletProvider]);

  // Handle donation success - refresh data
  const handleDonationSuccess = () => {
    fetchPoolData();
    if (onDonationSuccess) {
      onDonationSuccess();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !poolData) {
    return (
      <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
        <div className="text-red-500">
          {error || 'Failed to load pool data'}
        </div>
      </div>
    );
  }

  const { status, currentAmount, targetAmount, percentageRaised, investors, daysLeft } = poolData;

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <span className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg ${
          status === 'Live' 
            ? 'text-green-600 bg-green-50' 
            : 'text-gray-600 bg-gray-50'
        }`}>
          {status === 'Live' ? (
            <svg className="w-3 h-3 mr-1.5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14"></path>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1.5 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14"></path>
            </svg>
          )}
          {status}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-1">
          {formatCurrency(currentAmount)}
        </h2>
        <p className="text-sm text-gray-600 uppercase">
          {percentageRaised}% OF THE MIN.TARGET ({formatCurrency(targetAmount)})
        </p>
        <div className="mt-2">
          <ProgressBar percentage={percentageRaised} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-2xl font-bold mb-1">{investors}</div>
          <div className="text-sm text-gray-600 uppercase">Donaters</div>
        </div>

        <div>
          <div className="text-2xl font-bold mb-1">{daysLeft} days</div>
          <div className="text-sm text-gray-600 uppercase">Days Left</div>
        </div>

        <div>
          {status === 'Live' ? (
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