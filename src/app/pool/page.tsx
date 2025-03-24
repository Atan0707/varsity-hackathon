import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPools, formatCurrency } from '@/utils/poolData';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';

export default function PoolsListPage() {
  const pools = getAllPools();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Active Crowdfunding Campaigns</h1>
        <p className="text-lg text-gray-600 mt-2">
          Invest in innovative startups and make a difference while earning returns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <Link 
            key={pool.id} 
            href={`/pool/${pool.id}`} 
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative p-4">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  <span className="w-1.5 h-1.5 mr-1 bg-green-500 rounded-full"></span>
                  {pool.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 relative flex-shrink-0">
                  {pool.logoUrl ? (
                    <Image
                      src={pool.logoUrl}
                      alt={pool.title}
                      width={48}
                      height={48}
                      className="rounded-md"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-lg font-bold">{pool.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{pool.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-1">{pool.tagline}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {pool.badges.map((badge, index) => (
                  <Badge key={index} text={badge} />
                ))}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(pool.currentAmount)}</span>
                  <span className="text-sm text-gray-500">{pool.percentageRaised}%</span>
                </div>
                <ProgressBar percentage={pool.percentageRaised} />
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">Target: </span>
                  <span className="font-medium">{formatCurrency(pool.targetAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days left: </span>
                  <span className="font-medium">{pool.daysLeft}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
