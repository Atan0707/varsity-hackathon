import pools from '@/data/pools.json';

export interface Pool {
  id: string;
  title: string;
  tagline: string;
  categories: string[];
  badges: string[];
  videoUrl: string;
  status: string;
  currentAmount: number;
  targetAmount: number;
  percentageRaised: number;
  donors: number;
  largestInvestment: number;
  daysLeft: number;
  logoUrl: string;
  description: string;
  checkpoints?: string[];
  currentCheckpointIndex?: number;
  checkpointReleaseStatus?: boolean[];
}

export const getAllPools = (): Pool[] => {
  console.warn('getAllPools is deprecated, use getAllPoolsFromChain instead');
  return pools as Pool[];
};

export const getPoolById = (id: string): Pool | undefined => {
  console.warn('getPoolById is deprecated, use getPoolByIdFromChain instead');
  return pools.find((pool: Pool) => pool.id === id);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount) + ' ETH';
}; 