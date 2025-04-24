'use client';

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, RPC_URL } from "@/utils/config";
import ABI from "../../contract/abi.json";
import axios from 'axios';
import Image from 'next/image';

// Define the GeolocationPosition type as a regular type instead of an empty interface
type GeolocationPositionExtended = GeolocationPosition;

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  onItemCreated: () => void;
}

export default function CreateItemModal({ isOpen, onClose, poolId, onItemCreated }: CreateItemModalProps) {
  const [nftName, setNftName] = useState("");
  const [nftImageURI, setNftImageURI] = useState("");
  const [location, setLocation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
  const [txProgress, setTxProgress] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if camera is available
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setIsCameraAvailable(hasCamera);
      } catch (error) {
        console.error('Error checking camera availability:', error);
        setIsCameraAvailable(false);
      }
    };
    
    if (isOpen) {
      checkCameraAvailability();
    }
    
    return () => {
      // Clean up camera stream when component unmounts or modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Function to start camera
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please make sure you have given permission and that your camera is working.');
      setIsCapturing(false);
    }
  };

  // Function to stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  // Function to capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], `captured-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Update the state with the captured image
        setSelectedFile(file);
        setSelectedFileName(file.name);
        
        // Stop the camera stream
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // First get coordinates using browser's Geolocation API with proper typing
      const position = await new Promise<GeolocationPositionExtended>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos as GeolocationPositionExtended),
          reject,
          { enableHighAccuracy: true }
        );
      });

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get country name
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&language=en`
      );

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const country = data.results[0].components.country;
        setLocation(country);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please enter it manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Reset form and get location when modal opens
  useEffect(() => {
    if (isOpen) {
      setNftName("");
      setNftImageURI("");
      setLocation("");
      setIsCreating(false);
      setSelectedFileName("");
      setSelectedFile(null);
      setTransactionStatus(null);
      setTxProgress(0);
      setIsCapturing(false);
      
      // Stop any existing camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Get location automatically when modal opens
      getCurrentLocation();
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSelectedFileName(file.name);
    setSelectedFile(file);
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }
  };

  const uploadToPinata = async (file: File) => {
    setIsUploading(true);
    setTransactionStatus("Uploading image to IPFS...");
    setTxProgress(20);
    
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
      setNftImageURI(ipfsUrl);
      setTxProgress(40);
      setTransactionStatus("Image uploaded successfully. Preparing transaction...");
      return ipfsUrl;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      setTransactionStatus("Failed to upload image to IPFS");
      throw new Error('Failed to upload image to IPFS');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMint = async () => {
    if (!nftName || !selectedFile || !location) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIsCreating(true);
      setTransactionStatus("Starting transaction...");
      setTxProgress(10);
      
      // Upload image first when Create Item is clicked
      const imageUrl = await uploadToPinata(selectedFile);

      // Get private key from environment variables
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error('Error Code: PK01');
      }
      
      // Initialize provider
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, provider);
      
      setTransactionStatus("Connecting to wallet...");
      setTxProgress(50);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        wallet
      );

      setTransactionStatus("Creating item on blockchain...");
      setTxProgress(60);
      
      // Call createItem function
      const tx = await contract.createItem(
        nftName,
        imageUrl,
        parseInt(poolId),
        location
      );

      setTransactionStatus("Transaction submitted! Waiting for confirmation...");
      setTxProgress(75);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get transaction hash
      const transactionHash = receipt.hash;
      
      setTransactionStatus("Transaction confirmed!");
      setTxProgress(100);
      
      console.log(`Item created! Transaction hash: ${transactionHash}`);
      
      // Call the callback function
      onItemCreated();
      
      // Close the modal after a short delay to show completion
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error creating item:", err);
      setTransactionStatus("Transaction failed. See console for details.");
      alert("Error creating item. See console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          disabled={isCreating || isUploading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          Create New Item
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="T-shirt, Water bottle, etc."
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isCreating || isUploading}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Image
            </label>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                id="imageFile"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isCreating || isUploading}
              />
              
              {!isCapturing ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition flex items-center gap-2"
                      disabled={isCreating || isUploading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose Image
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition flex items-center gap-2"
                      disabled={isCreating || isUploading || !isCameraAvailable}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Take Picture
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {selectedFileName ? (
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {selectedFileName}
                      </span>
                    ) : 'No file selected'}
                  </div>
                </>
              ) : (
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full rounded-md border border-gray-300 max-h-64 bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="mt-2 flex justify-between">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition"
                    >
                      Capture
                    </button>
                  </div>
                </div>
              )}
            </div>
            {nftImageURI && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Uploaded to IPFS:</p>
                <div className="flex items-center space-x-2">
                  <div className="relative h-16 w-16">
                    <Image 
                      src={nftImageURI} 
                      alt="Uploaded preview" 
                      fill
                      className="object-cover rounded-md border border-gray-300" 
                    />
                  </div>
                  <input
                    type="text"
                    value={nftImageURI}
                    readOnly
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500"></p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Initial Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                readOnly
                placeholder="Factory, Warehouse, etc."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={isCreating || isUploading || isLoadingLocation}
              />
              {isLoadingLocation && (
                <div className="absolute right-3 top-3">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              <button
                type="button"
                onClick={getCurrentLocation}
                className="absolute right-3 top-3 text-blue-500 hover:text-blue-700"
                disabled={isCreating || isUploading || isLoadingLocation}
              >
                {!isLoadingLocation && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Your location is automatically detected. Click the location icon to update.</p>
          </div>

          {(isCreating || isUploading) && transactionStatus && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">{transactionStatus}</span>
                <span className="text-sm font-medium text-blue-700">{txProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${txProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isCreating || isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleMint}
            disabled={isCreating || isUploading || !selectedFile || !nftName || !location}
            className={`px-4 py-2 text-white bg-blue-600 rounded-lg ${
              (isCreating || isUploading || !selectedFile || !nftName || !location) ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
            } transition-colors`}
          >
            {isCreating || isUploading ? "Processing..." : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
} 