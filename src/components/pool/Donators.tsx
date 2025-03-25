import React from 'react';
import { Pool } from '@/utils/poolData';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

interface DonatorsProps {
  pool: Pool;
}

interface Donator {
  donor: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface DonationsResponse {
  donationReceiveds: Donator[];
}

const truncateAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const Donators: React.FC<DonatorsProps> = ({ pool }) => {
  // GraphQL query to fetch donations for a specific pool
  const getDonationsQuery = gql`
    query GetPoolDonations($poolId: BigInt!) {
      donationReceiveds(
        where: { poolId: $poolId }
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        donor
        amount
        blockTimestamp
        transactionHash
      }
    }
  `;

  // Use react-query to fetch and cache the donations data
  const { data, isLoading, error } = useQuery<DonationsResponse>({
    queryKey: ['poolDonations', pool.id],
    queryFn: async (): Promise<DonationsResponse> => {
      const response = await request<DonationsResponse>(
        SUBGRAPH_URL, 
        getDonationsQuery, 
        { poolId: pool.id }
      );
      return response;
    },
    // Don't refetch on window focus to save API calls
    refetchOnWindowFocus: false,
  });

  // Get the donations array from the response
  const donations = data?.donationReceiveds || [];

  // Calculate the unique donator count by filtering unique donor addresses
  const uniqueDonators = React.useMemo(() => {
    if (!donations.length) return 0;
    
    // Use a Set to count unique donor addresses
    const uniqueDonorAddresses = new Set(donations.map(donation => donation.donor));
    return uniqueDonorAddresses.size;
  }, [donations]);

  // Format the timestamp to a human-readable date
  const formatTimestamp = (timestamp: string) => {
    // Convert from Unix timestamp in seconds to milliseconds
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert amount from Wei to ETH
  const formatAmount = (amountInWei: string) => {
    // Convert from Wei to ETH (1 ETH = 10^18 Wei)
    const amountInEth = parseFloat(amountInWei) / 1e18;
    return amountInEth.toLocaleString(undefined, {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Recent Donators</h2>
        <div className="text-sm text-gray-600">
          Total <span className="font-semibold">{uniqueDonators}</span> donators
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donator Address
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
                      <span className="text-gray-500">Loading blockchain data...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-red-500">
                    Error loading data from The Graph
                  </td>
                </tr>
              ) : !donations.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No donations found for this pool yet.
                  </td>
                </tr>
              ) : (
                donations.map((donator: Donator) => (
                  <tr key={donator.transactionHash} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {truncateAddress(donator.donor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                         {formatAmount(donator.amount)} ETH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(donator.blockTimestamp)}
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