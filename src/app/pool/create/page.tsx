"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getContract } from '@/utils/contract';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';

export default function CreatePoolPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageURI: '',
    videoLink: '',
    targetAmount: '',
    endDate: '',
    checkpoints: ['Started', 'In Transit', 'Delivered']
  });
  
  const [checkpointInput, setCheckpointInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckpointAdd = () => {
    if (checkpointInput.trim()) {
      setFormData(prev => ({
        ...prev,
        checkpoints: [...prev.checkpoints, checkpointInput.trim()]
      }));
      setCheckpointInput('');
    }
  };

  const handleCheckpointRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Form validation
    if (!formData.name || !formData.description || !formData.imageURI || 
        !formData.targetAmount || !formData.endDate || formData.checkpoints.length < 2) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const contract = await getContract(walletProvider);
      
      // Calculate end date in seconds since epoch (UNIX timestamp)
      const endDateTimestamp = Math.floor(new Date(formData.endDate).getTime() / 1000);
      
      // Convert target amount from ETH to wei
      const targetAmountWei = ethers.parseEther(formData.targetAmount);
      
      // Call the contract's createPool function
      const tx = await contract.createPool(
        formData.name,
        formData.description,
        formData.imageURI,
        formData.videoLink,
        targetAmountWei,
        endDateTimestamp,
        formData.checkpoints
      );
      
      toast.promise(tx.wait(), {
        loading: 'Creating donation pool...',
        success: 'Donation pool created successfully!',
        error: 'Failed to create donation pool'
      });
      
      await tx.wait();
      
      // Redirect to the pools list page after successful creation
      router.push('/pool');
    } catch (error) {
      console.error('Error creating pool:', error);
      toast.error('Failed to create donation pool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-[rgb(256,252,228)]">
      <h1 className="text-3xl font-bold text-[#0c252a] mb-8">Create New Donation Pool</h1>
      
      {!isConnected ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
          <p className="text-amber-700">Please connect your wallet to create a donation pool.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-[#0c252a] mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Pool Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="e.g., Clean Water for Village X"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="Provide a detailed description of your donation pool and how the funds will be used."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="imageURI" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URI *
                </label>
                <input
                  type="url"
                  id="imageURI"
                  name="imageURI"
                  value={formData.imageURI}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">URL to an image that represents your donation pool</p>
              </div>
              
              <div>
                <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Video Link
                </label>
                <input
                  type="url"
                  id="videoLink"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="https://youtube.com/watch?v=example"
                />
                <p className="mt-1 text-xs text-gray-500">URL to a video about your donation pool (optional)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-[#0c252a] mb-4">Funding Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount (ETH) *
                </label>
                <input
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="e.g., 10.5"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={today}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-[#0c252a] mb-4">Tracking Checkpoints</h2>
            <p className="text-sm text-gray-600 mb-4">
              Checkpoints are used to track the progress of your donation items. At least two checkpoints are required.
            </p>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={checkpointInput}
                  onChange={(e) => setCheckpointInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="Add a new checkpoint"
                />
                <button
                  type="button"
                  onClick={handleCheckpointAdd}
                  className="px-4 py-2 bg-[#0c252a] text-white rounded-md hover:bg-[#0c252a]/90 transition"
                >
                  Add
                </button>
              </div>
              
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Current checkpoints:</p>
                <ul className="space-y-2">
                  {formData.checkpoints.map((checkpoint, index) => (
                    <li key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="w-6 h-6 flex items-center justify-center bg-[#0c252a] text-white rounded-full text-xs mr-2">
                          {index + 1}
                        </span>
                        <span>{checkpoint}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCheckpointRemove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                {formData.checkpoints.length < 2 && (
                  <p className="mt-2 text-xs text-red-500">At least two checkpoints are required.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/pool')}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className={`px-6 py-3 bg-[#0c252a] text-white rounded-md hover:bg-[#0c252a]/90 transition ${
                (isSubmitting || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 