import fundAllocationData from '@/data/fundAllocation.json';

export interface FundAllocation {
  nftName: string;
  percentage: number;
  description: string;
  quantity?: number;
}

export const getFundAllocations = (): FundAllocation[] => {
  return fundAllocationData.fundAllocations;
};

// Utility function to validate if allocations sum to 100%
export const validateAllocations = (allocations: FundAllocation[]): boolean => {
  const total = allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  return total === 100;
}; 