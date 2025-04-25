import { createClient, fetchExchange } from '@urql/core';
import { SUBGRAPH_URL } from './config';

// Initialize the URQL client
const client = createClient({
  url: SUBGRAPH_URL,
  exchanges: [fetchExchange]
});

export interface DonatorData {
  id: string;
  donor: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
  poolId: string;
}

export const getDonationsQuery = `
  query GetDonations($poolId: BigInt!) {
    donationReceiveds(
      where: { poolId: $poolId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      donor
      amount
      blockTimestamp
      transactionHash
      poolId
    }
  }
`;

export const fetchDonations = async (poolId: string): Promise<DonatorData[]> => {
  try {
    const response = await client.query(getDonationsQuery, { poolId }).toPromise();
    
    if (response.error) {
      console.error('Error fetching donations:', response.error);
      throw new Error('Failed to fetch donations');
    }

    return response.data.donationReceiveds;
  } catch (error) {
    console.error('Error in fetchDonations:', error);
    throw error;
  }
}; 