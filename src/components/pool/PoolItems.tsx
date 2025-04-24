'use client';

import { useState, useEffect } from 'react';
import { useAppKitProvider } from '@reown/appkit/react';
import { Eip1193Provider, ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '@/utils/config';
import ABI from '../../contract/abi.json';
import Image from 'next/image';

interface PoolItemsProps {
  poolId: string;
}

interface PoolItem {
  id: string;
  name: string;
  imageURI: string;
  location: string;
  delivered: boolean;
  lastUpdated: number;
}

export default function PoolItems({ poolId }: PoolItemsProps) {
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { walletProvider } = useAppKitProvider("eip155");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider
        );
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          provider
        );

        // Get all items for the pool with details
        const result = await contract.getPoolItemsWithDetails(poolId);
        
        // Parse the results
        const ids = result[0];
        const names = result[1];
        const imageURIs = result[2];
        const locations = result[3];
        const deliveryStatuses = result[4];
        const lastUpdatedTimes = result[5];
        
        // Create array of item objects
        const itemsData: PoolItem[] = [];
        for (let i = 0; i < ids.length; i++) {
          itemsData.push({
            id: ids[i].toString(),
            name: names[i],
            imageURI: imageURIs[i],
            location: locations[i],
            delivered: deliveryStatuses[i],
            lastUpdated: Number(lastUpdatedTimes[i])
          });
        }
        
        setItems(itemsData);
      } catch (error) {
        console.error('Error fetching pool items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (walletProvider) {
      fetchItems();
    }
  }, [poolId, walletProvider]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-gray-600">Loading items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No items found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This pool doesn&apos;t have any items yet. 
          Add items using the &quot;Create Item&quot; button.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Pool Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={item.imageURI}
                alt={item.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback for invalid images
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/600x600/EEE/999?text=No+Image";
                }}
              />
              {item.delivered && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                  Delivered
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Current location:</span> {item.location}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Last updated: {new Date(item.lastUpdated * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 