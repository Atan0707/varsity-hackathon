import React, { useState, useEffect } from 'react';
import { Pool } from '@/utils/poolData';
import { getPoolDonators, Donator } from '@/utils/contract';

interface DonatorsProps {
  pool: Pool;
}

const truncateAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const Donators: React.FC<DonatorsProps> = ({ pool }) => {
  const [donators, setDonators] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonators = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const donatorData = await getPoolDonators(pool.id);
        setDonators(donatorData);
      } catch (error) {
        console.error('Error fetching donators:', error);
        setError('Failed to load donor data from blockchain');
      } finally {
        setIsLoading(false);
      }
    };

    if (pool.id) {
      fetchDonators();
    }
  }, [pool.id]);

  // Format the timestamp to a human-readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Recent Donators</h2>
        <div className="text-sm text-gray-600">
          Total <span className="font-semibold">{donators.length}</span> donators
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
                    {error}
                  </td>
                </tr>
              ) : donators.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No donations found for this pool yet.
                  </td>
                </tr>
              ) : (
                donators.map((donator, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {truncateAddress(donator.address)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                         {donator.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})} ETH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(donator.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {donators.length > 0 && (
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