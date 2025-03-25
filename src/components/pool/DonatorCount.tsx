import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

interface DonatorCountProps {
  poolId: string;
}

interface Donator {
  donor: string;
}

interface DonationsResponse {
  donationReceiveds: Donator[];
}

const DonatorCount: React.FC<DonatorCountProps> = ({ poolId }) => {
  // GraphQL query to fetch all donors for a specific pool
  const getDonorsQuery = gql`
    query GetPoolDonors($poolId: BigInt!) {
      donationReceiveds(
        where: { poolId: $poolId }
      ) {
        donor
      }
    }
  `;

  // Use react-query to fetch and cache the donors data
  const { data, isLoading, error } = useQuery<DonationsResponse>({
    queryKey: ['poolDonors', poolId],
    queryFn: async (): Promise<DonationsResponse> => {
      const response = await request<DonationsResponse>(
        SUBGRAPH_URL, 
        getDonorsQuery, 
        { poolId: poolId }
      );
      return response;
    },
    // Don't refetch on window focus to save API calls
    refetchOnWindowFocus: false,
  });

  // Calculate the unique donator count
  const uniqueDonatorCount = React.useMemo(() => {
    if (!data?.donationReceiveds?.length) return 0;
    
    // Use a Set to count unique donor addresses
    const uniqueDonorAddresses = new Set(data.donationReceiveds.map(donation => donation.donor));
    return uniqueDonorAddresses.size;
  }, [data]);

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
      {uniqueDonatorCount}
    </span>
  );
};

export default DonatorCount; 