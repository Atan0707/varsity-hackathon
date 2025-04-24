"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getItemDetails, ItemDetails } from "@/utils/contract";
import { getPoolByIdFromChain } from "@/utils/contract";

export default function ItemQRPage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("id");
  
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [poolName, setPoolName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Simulate a direct call to check if this ID is valid
    const isValidId = (id: string): boolean => {
      // Add validation logic - IDs are usually numeric
      return /^\d+$/.test(id) && parseInt(id) > 0;
    };

    const fetchData = async (id: string) => {
      try {
        setLoading(true);
        
        // Basic validation first
        if (!isValidId(id)) {
          setError("Invalid item ID format");
          setLoading(false);
          return;
        }
        
        // Fetch item details from smart contract
        const itemDetails = await getItemDetails(id);
        
        // If no item details found, set error
        if (!itemDetails) {
          setError("No data available for this item ID");
          setLoading(false);
          return;
        }
        
        // Additional validation for data integrity
        if (!itemDetails.name || itemDetails.name.trim() === "" || 
            !itemDetails.currentLocation || itemDetails.currentLocation.trim() === "") {
          setError("Item exists but data is incomplete");
          setLoading(false);
          return;
        }
        
        // Check for suspiciously hardcoded/test data
        if (itemDetails.name === "AMAN PALESTINE" && 
            (!itemDetails.currentLocation || itemDetails.currentLocation.trim() === "")) {
          setError("No valid data for this item ID");
          setLoading(false);
          return;
        }
        
        setItem(itemDetails);
        
        // Get pool name
        try {
          const poolData = await getPoolByIdFromChain(itemDetails.poolId.toString());
          if (poolData && poolData.title) {
            setPoolName(poolData.title);
          } else {
            setPoolName(`Pool #${itemDetails.poolId}`);
          }
        } catch (poolError) {
          console.error("Error fetching pool data:", poolError);
          setPoolName(`Pool #${itemDetails.poolId}`);
        }
        
      } catch (err) {
        console.error("Error fetching item details:", err);
        setError("Could not retrieve item data");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchData(itemId);
    } else {
      setError("No item ID provided");
      setLoading(false);
    }
  }, [itemId]);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Generate QR code value
  const getQRValue = () => {
    // The QR should only contain the token ID
    return itemId || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4 bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.121A3 3 0 1 0 7.879 9.12M14.121 7.121A3 3 0 1 1 16.121 9.12M6.343 17.657A8 8 0 0 1 3 12c0-2.21.895-4.21 2.343-5.657M17.657 17.657A8 8 0 0 0 21 12c0-2.21-.895-4.21-2.343-5.657" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Item Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "No data available for this item ID. The item may not exist or has been removed."}
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If we got this far, we have valid item data
  return (
    <div className="min-h-screen p-4 bg-gray-50 print:bg-white print:p-0">
      {/* Print button - only visible on screen */}
      <div className="max-w-md mx-auto mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Item QR
        </button>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden print:shadow-none print:max-w-full">
        <div className="relative h-52 w-full print:h-48">
          {item.imageURI && (
            <Image 
              src={item.imageURI} 
              alt={item.name} 
              fill 
              className="object-cover"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent print:from-black/40"></div>
          <div className="absolute bottom-0 left-0 p-4">
            <div className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2 print:bg-blue-50">
              Item #{itemId}
            </div>
            <h1 className="text-white text-xl font-bold">{item.name}</h1>
          </div>
        </div>
        
        <div className="p-6 print:p-4">
          <div className="mb-6 print:mb-4">
            <div className="flex justify-between mb-3 print:mb-2">
              <span className="text-gray-600">Pool:</span>
              <span className="font-medium text-gray-900">{poolName || `Pool #${item.poolId}`}</span>
            </div>
            
            <div className="flex justify-between mb-3 print:mb-2">
              <span className="text-gray-600">Current Location:</span>
              <span className="font-medium text-gray-900">{item.currentLocation}</span>
            </div>
            
            <div className="flex justify-between mb-3 print:mb-2">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium rounded-full px-2 py-1 text-xs ${item.delivered ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} print:border print:border-current`}>
                {item.delivered ? "Delivered" : "In Transit"}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-gray-900">{formatDate(item.lastUpdated)}</span>
            </div>
          </div>
          
          <div className="border-t pt-6 print:pt-4">
            <p className="text-gray-700 mb-4 text-center font-medium">Item QR Code</p>
            <div className="bg-white p-4 flex justify-center border rounded-lg print:border-2">
              <QRCode
                value={getQRValue()}
                size={200}
                level="H"
                className="mx-auto print:w-[220px] print:h-[220px]"
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Tracking ID:</p>
              <p className="font-mono text-md font-bold text-gray-900">{`MY${itemId}4432647064W`}</p>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4 print:mt-4 print:pt-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>Scan this QR code to track your donation item</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add print-specific footer with date */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-4">
        <p>Printed on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
