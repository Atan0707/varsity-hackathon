"use client"

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getContract } from '@/utils/contract';
import { useAppKitAccount } from '@reown/appkit/react';
import { RPC_URL } from '@/utils/config';
import axios from 'axios';
import Image from 'next/image';

export default function CreatePoolPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageURI: '',
    videoLink: 'https://www.youtube.com/watch?v=xvFZjo5PgG0',
    targetAmount: '',
    endDate: '',
    checkpoints: [] as string[]
  });
  
  const [checkpointInput, setCheckpointInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSelectedFileName(file.name);
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }
    
    await uploadToPinata(file);
  };

  const uploadToPinata = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Create form data for the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Set a unique file name with timestamp
      const fileName = `${Date.now()}-${file.name}`;
      formData.append('pinataMetadata', JSON.stringify({
        name: fileName
      }));
      
      // Set options
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }));
      
      // Upload to Pinata using JWT
      const JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${JWT}`
          }
        }
      );
      
      // Use the IPFS hash to create a URL
      const ipfsHash = response.data.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      
      // Update form data
      setFormData(prev => ({ ...prev, imageURI: ipfsUrl }));
      toast.success('Image uploaded to IPFS successfully!');
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      toast.error('Failed to upload image to IPFS');
    } finally {
      setIsUploading(false);
    }
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
      // Get private key from environment variables
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error('Private key not found in environment variables');
      }
      
      // Initialize provider
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Get contract with signer
      const contract = await getContract(wallet);
      
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
                <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="imageFile"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Choose Image'}
                  </button>
                  <span className="text-sm text-gray-500 truncate max-w-xs">
                    {selectedFileName || 'No file selected'}
                  </span>
                </div>
                {formData.imageURI && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Uploaded to IPFS:</p>
                    <div className="flex items-center space-x-2">
                      <div className="relative h-16 w-16">
                        <Image 
                          src={formData.imageURI} 
                          alt="Uploaded preview" 
                          fill
                          className="object-cover rounded-md border border-gray-300" 
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.imageURI}
                        readOnly
                        className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Image will be uploaded to IPFS via Pinata</p>
              </div>
              
              <div>
                <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Video Link *
                </label>
                <input
                  type="url"
                  id="videoLink"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c252a]"
                  placeholder="https://www.youtube.com/watch?v=xvFZjo5PgG0"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">URL to a video about your donation pool </p>
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
                  placeholder="1"
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
              disabled={isSubmitting || !isConnected || isUploading}
              className={`px-6 py-3 bg-[#0c252a] text-white rounded-md hover:bg-[#0c252a]/90 transition ${
                (isSubmitting || !isConnected || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
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