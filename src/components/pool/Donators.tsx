import React from 'react';
import { Pool } from '@/utils/poolData';
import { useQuery } from '@tanstack/react-query';
import { fetchDonations, DonatorData } from '@/utils/graphql';

interface DonatorsProps {
  pool: Pool;
}

const Donators: React.FC<DonatorsProps> = ({ pool }) => {
  // Use react-query to fetch and cache the donations data
  const { data, isLoading, error } = useQuery<DonatorData[]>({
    queryKey: ['poolDonations', pool.id],
    queryFn: () => fetchDonations(pool.id),
    // Don't refetch on window focus to save API calls
    refetchOnWindowFocus: false,
  });

  // Get the donations array from the response
  const donations = data || [];

  // Get total donations count
  const totalDonations = donations.length;

  // Format the timestamp to a human-readable date
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount from wei to ETH
  const formatAmount = (amountInWei: string) => {
    const amountInEth = parseFloat(amountInWei) / 1e18;
    return amountInEth.toLocaleString(undefined, {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6
    });
  };

  // Helper function to truncate address
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Recent Donators</h2>
        <div className="text-sm text-gray-600">
          Total <span className="font-semibold">{totalDonations}</span> donations
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-green-500 rounded-full animate-spin"></div>
                      <span className="text-gray-500">Loading donations...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-red-500">
                    Error loading donations data
                  </td>
                </tr>
              ) : !donations.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No donations found for this pool yet.
                  </td>
                </tr>
              ) : (
                donations.map((donation: DonatorData, index) => (
                  <tr key={`${donation.transactionHash}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {truncateAddress(donation.transactionHash)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                         {formatAmount(donation.amount)} ETH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(donation.blockTimestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {donations.length > 0 && (
        <div className="mt-6 text-center">
          <button className="text-green-600 hover:text-green-800 font-medium text-sm">
            View All Donators
          </button>
        </div>
      )}
    </div>
  );
};

export default Donators; 