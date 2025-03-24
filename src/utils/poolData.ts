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
  investors: number;
  largestInvestment: number;
  daysLeft: number;
  logoUrl: string;
  description: string;
}

export const getAllPools = (): Pool[] => {
  return pools as Pool[];
};

export const getPoolById = (id: string): Pool | undefined => {
  return pools.find((pool: Pool) => pool.id === id);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('MYR', 'RM');
}; 