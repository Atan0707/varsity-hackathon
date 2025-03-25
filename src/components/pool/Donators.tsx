import React from 'react';
import { Pool } from '@/utils/poolData';

interface DonatorsProps {
  pool: Pool;
}

// Sample donator data - in a real app, this would come from an API
const sampleDonators = [
  { id: 1, name: 'Ahmad bin Abdullah', amount: 124800, date: '2023-03-15' },
  { id: 2, name: 'Sarah Johnson', amount: 75000, date: '2023-03-14' },
  { id: 3, name: 'Mohammed Al-Farsi', amount: 50000, date: '2023-03-12' },
  { id: 4, name: 'Li Wei', amount: 35000, date: '2023-03-10' },
  { id: 5, name: 'Anonymous', amount: 25000, date: '2023-03-09' },
  { id: 6, name: 'Natasha Kuznetsov', amount: 20000, date: '2023-03-07' },
  { id: 7, name: 'Anonymous', amount: 15000, date: '2023-03-05' },
  { id: 8, name: 'Rajesh Patel', amount: 12500, date: '2023-03-03' },
  { id: 9, name: 'Sofia Garcia', amount: 6700, date: '2023-03-01' },
];

const Donators: React.FC<DonatorsProps> = ({ pool }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Recent Donators</h2>
        <div className="text-sm text-gray-600">
          Total <span className="font-semibold">{pool.investors}</span> donators
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donator
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
              {sampleDonators.map((donator) => (
                <tr key={donator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {donator.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      RM {donator.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(donator.date).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button className="text-green-600 hover:text-green-800 font-medium text-sm">
          View All Donators
        </button>
      </div>
    </div>
  );
};

export default Donators; 