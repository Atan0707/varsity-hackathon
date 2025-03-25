"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppKit } from "@reown/appkit/react";

export default function Home() {
  // Add the wallet connection functionality
  const { open } = useAppKit();
  
  // Handle wallet connection
  const handleConnectClick = () => {
    open();
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-[#0c252a] overflow-hidden">
        {/* Left lime circle */}
        <div className="absolute left-0 top-0 w-[400px] h-[400px] bg-[#d9ff56] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Right lime circle */}
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[#d9ff56] rounded-full translate-x-1/4 translate-y-1/4"></div>
        
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-7xl font-bold text-white mb-8">
              Transparent Giving
            </h1>
            <p className="text-lg md:text-2xl text-white mb-12 max-w-3xl">
            Track donations, trust the process
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleConnectClick}
                className="px-8 py-4 bg-[#d9ff56] text-[#0c252a] font-medium rounded-md hover:bg-opacity-90 transition"
              >
                Connect Wallet
              </button>
              <Link 
                href="/about" 
                className="px-8 py-4 text-white font-medium hover:underline"
              >
                Find out more
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fundraiser Carousel Section */}
      <div className="bg-[rgb(256,252,228)] py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0c252a]">Discover Pool - Donate Today</h2>
              <div className="flex space-x-2">
                <button className="w-10 h-10 flex items-center justify-center bg-[#0c252a] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-[#0c252a] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fundraiser Card 1 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gray-300 relative">
                  <img 
                    src="https://placehold.co/400x200/e9e9dc/0c252a?text=MRC+Flood+Action" 
                    alt="MRC Flood Action Fund" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0c252a] mb-2">MRC Flood Action Fund</h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-[#0c252a]">MYR 4,158</div>
                    <div className="text-sm text-gray-500">raised out of MYR 4,158 goal</div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-[#d9ff56] h-2 rounded-full w-[100%]"></div>
                  </div>
                  
                  <div className="flex items-center text-[#0c252a]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3b30" className="w-5 h-5 mr-2">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="font-medium">50 Donors</span>
                  </div>
                </div>
              </div>
              
              {/* Fundraiser Card 2 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gray-300 relative">
                  <img 
                    src="https://placehold.co/400x200/e9e9dc/0c252a?text=Long+Ducker+2025" 
                    alt="Long Ducker 2025" 
                    className="w-full h-full object-cover"
                  />
                  
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0c252a] mb-2">Long Ducker 2025</h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-[#0c252a]">MYR 23,925</div>
                    <div className="text-sm text-gray-500">raised out of MYR 23,925 goal</div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-[#d9ff56] h-2 rounded-full w-[5%]"></div>
                  </div>
                  
                  <div className="flex items-center text-[#0c252a]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3b30" className="w-5 h-5 mr-2">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="font-medium">47 Donors</span>
                  </div>
                </div>
              </div>
              
              {/* Fundraiser Card 3 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gray-300 relative">
                  <img 
                    src="https://placehold.co/400x200/e9e9dc/0c252a?text=MSI+Flood+Relief" 
                    alt="MSI Flood Relief" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0c252a] mb-2">MSI Flood Relief</h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-[#0c252a]">MYR 725</div>
                    <div className="text-sm text-gray-500">raised out of MYR 725 goal</div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-[#d9ff56] h-2 rounded-full w-[10%]"></div>
                  </div>
                  
                  <div className="flex items-center text-[#0c252a]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3b30" className="w-5 h-5 mr-2">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="font-medium">26 Donors</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-12">
              <Link 
                href="/pool" 
                className="px-8 py-4 bg-[#d9ff56] text-[#0c252a] font-medium rounded-full hover:bg-opacity-90 transition"
              >
                Discover Fundraisers
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Platform Preview Section */}
      
    </div>
  );
}
