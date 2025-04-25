import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDonations, DonatorData } from '@/utils/graphql';

interface DonatorCountProps {
  poolId: string;
}

const DonatorCount: React.FC<DonatorCountProps> = ({ poolId }) => {
  // Use react-query to fetch and cache the donors data
  const { data, isLoading, error } = useQuery<DonatorData[]>({
    queryKey: ['poolDonations', poolId],
    queryFn: () => fetchDonations(poolId),
    // Don't refetch on window focus to save API calls
    refetchOnWindowFocus: false,
  });

  // Get total donations count
  const donationsCount = data?.length || 0;

  if (isLoading) {
    return (
      <span className="ml-2 bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full text-xs animate-pulse">
        ...
      </span>
    );
  }

  if (error) {
    return (
      <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
        !
      </span>
    );
  }

  return (
    <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
      {donationsCount}
    </span>
  );
};

export default DonatorCount; 