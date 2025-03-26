import React from 'react';
import { Pool } from '@/utils/poolData';

interface PoolInfoProps {
  pool: Pool;
}

const PoolInfo: React.FC<PoolInfoProps> = ({ pool }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <h2 className="text-2xl font-bold mb-6 border-b pb-4">Pool Information</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Project Overview</h3>
          <p className="text-gray-700">{pool.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Categories:</span>
                <span className="text-gray-900 font-medium">{pool.categories.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">{pool.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target:</span>
                <span className="text-gray-900 font-medium">RM {pool.targetAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Timeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Days Left:</span>
                <span className="text-gray-900 font-medium">{pool.daysLeft} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Since:</span>
                <span className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolInfo; 