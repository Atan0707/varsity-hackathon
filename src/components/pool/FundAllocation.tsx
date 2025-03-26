import React from 'react';
import { Pool } from '@/utils/poolData';
import { getFundAllocations } from '@/utils/fundAllocation';
import type { FundAllocation } from '@/utils/fundAllocation';

interface FundAllocationProps {
  pool: Pool;
}

export default function FundAllocation({ pool }: FundAllocationProps) {
  const allocations = getFundAllocations();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Fund Allocation</h2>
      <div className="grid gap-6">
        {allocations.map((allocation: FundAllocation, index: number) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{allocation.nftName}</h3>
              <span className="text-2xl font-bold text-blue-600">{allocation.percentage}%</span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full mb-4">
              <div 
                className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
                style={{ width: `${allocation.percentage}%` }}
              />
            </div>
            <p className="text-gray-600">{allocation.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 