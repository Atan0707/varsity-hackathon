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

export interface PoolItemData {
  id: string;
  tokenId: string;
  name: string;
  poolId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export const getPoolItemsQuery = `
  query GetPoolItems($poolId: BigInt!) {
    itemCreateds(
      where: { poolId: $poolId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      name
      poolId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const fetchPoolItems = async (poolId: string): Promise<PoolItemData[]> => {
  try {
    const response = await client.query(getPoolItemsQuery, { poolId }).toPromise();
    
    if (response.error) {
      console.error('Error fetching pool items:', response.error);
      throw new Error('Failed to fetch pool items');
    }

    return response.data.itemCreateds;
  } catch (error) {
    console.error('Error in fetchPoolItems:', error);
    throw error;
  }
}; 