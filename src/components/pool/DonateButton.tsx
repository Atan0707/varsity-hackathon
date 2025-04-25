'use client';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { ethers } from 'ethers';
import contractAbi from '@/contract/abi.json';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';

// Coingecko API key
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || 'CG-Zr3bJVBfewv3VeDDJUkzKMRf';

interface DonateButtonProps {
  poolId: string;
  onSuccess?: () => void;
}

// Function to get current ETH price in MYR from CoinGecko
const getEthPriceInMYR = async (): Promise<number> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'ethereum',
        vs_currencies: 'myr',
        x_cg_demo_api_key: COINGECKO_API_KEY
      }
    });
    return response.data.ethereum.myr;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw new Error('Failed to fetch ETH price from CoinGecko');
  }
};

// Function to get current date in formatted string
const getCurrentDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function to generate PDF content
const generatePdfReceipt = (poolId: string, amount: string, bank: string, ethAmount: string, ethRate: string) => {
  // Generate a unique receipt ID
  const receiptId = `REC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const currentDate = getCurrentDate();
  
  // Create a simple HTML template for the receipt
  const receiptHtml = `
    <html>
      <head>
        <title>Donation Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .receipt { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #2b5329; }
          .info { margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 14px; color: #888; }
          .official { margin-top: 40px; border-top: 2px dashed #eee; padding-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Donation Receipt</h1>
            <p>Thank you for your contribution</p>
          </div>
          
          <div class="info">
            <div class="info-row">
              <span class="info-label">Receipt ID:</span>
              <span>${receiptId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pool ID:</span>
              <span>${poolId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Amount (MYR):</span>
              <span>RM${amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Amount (ETH):</span>
              <span>${ethAmount} ETH</span>
            </div>
            <div class="info-row">
              <span class="info-label">ETH Rate:</span>
              <span>RM${ethRate}/ETH</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span>FPX - ${bank}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>Completed</span>
            </div>
          </div>
          
          <div class="official">
            <p>This is an official receipt of your donation.</p>
            <p>Thank you for your generosity!</p>
          </div>
          
          <div class="footer">
            <p>For questions or concerns, please contact support@crowdfunding-example.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return receiptHtml;
};

// Function to trigger download of receipt as PDF
const downloadReceipt = (poolId: string, amount: string, bank: string, ethAmount: string = '0', ethRate: string = '0') => {
  const receiptHtml = generatePdfReceipt(poolId, amount, bank, ethAmount, ethRate);
  
  // Create a Blob with the HTML content
  const blob = new Blob([receiptHtml], { type: 'text/html' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `donation-receipt-${poolId}.html`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function DonateButton({ poolId, onSuccess }: DonateButtonProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'fpx' | 'bank'>('fpx');
  const [selectedBank, setSelectedBank] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [verificationClicked, setVerificationClicked] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [ethAmount, setEthAmount] = useState<string>('0');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [poolDetails, setPoolDetails] = useState<{
    targetAmount: string;
    totalDonated: string;
    remainingAmount: string;
    targetAmountWei?: string;
    totalDonatedWei?: string;
    remainingWei?: string;
    remainingAmountMYR?: string;
  } | null>(null);
  const [isPoolDetailsLoading, setIsPoolDetailsLoading] = useState(false);

  // Bank payment form state
  const [bankDetails, setBankDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });

  // Available banks for FPX
  const banks = [
    { id: 'ambank', name: 'AmBank', logo: '/banks/ambank-logo.png' },
    { id: 'bankislam', name: 'Bank Islam', logo: '/banks/bank-islam-logo.png' },
    { id: 'bsn', name: 'BSN', logo: '/banks/bsn-logo.png' },
    { id: 'cimb', name: 'CIMB', logo: '/banks/cimb-logo.jpg' },
    { id: 'maybank', name: 'Maybank', logo: '/banks/maybank-logo.png' },
    { id: 'rhb', name: 'RHB', logo: '/banks/rhb-logo.png' },
  ];

  // Preset donation amounts
  const presetAmounts = [
    { value: '10', label: 'RM10' },
    { value: '20', label: 'RM20' },
    { value: '50', label: 'RM50' },
    { value: 'max', label: 'Max' },
  ];

  // Fetch pool details and ETH price when modal is opened
  useEffect(() => {
    if (showModal) {
      fetchPoolDetails();
      fetchEthPrice();
    }
  }, [showModal]);

  // Recalculate ETH amount when MYR amount or ETH price changes
  useEffect(() => {
    calculateEthAmount();
  }, [amount, ethPrice]);

  // Fetch pool details from the contract
  const fetchPoolDetails = async () => {
    setIsPoolDetailsLoading(true);
    try {
      // Create provider and connect to the network
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);
      
      // Call getPoolDetails function
      const details = await contract.getPoolDetails(parseInt(poolId));
      
      // Get the raw wei values
      const targetAmountWei = details[4];
      const totalDonatedWei = details[6];
      
      // Calculate remaining amount in wei
      const remainingWei = targetAmountWei - totalDonatedWei;
      
      // Convert to ETH strings, but keep the precise wei values for calculations
      const targetAmount = ethers.formatEther(targetAmountWei);
      const totalDonated = ethers.formatEther(totalDonatedWei);
      const remainingAmount = ethers.formatEther(remainingWei);
      
      console.log('Target:', targetAmount, 'ETH');
      console.log('Donated:', totalDonated, 'ETH');
      console.log('Remaining:', remainingAmount, 'ETH');
      
      // If ETH price is available, convert remaining ETH to MYR
      let remainingAmountMYR = '0';
      if (ethPrice) {
        remainingAmountMYR = (parseFloat(remainingAmount) * ethPrice).toFixed(2);
      }
      
      setPoolDetails({
        targetAmount,
        totalDonated,
        remainingAmount,
        targetAmountWei: targetAmountWei.toString(),
        totalDonatedWei: totalDonatedWei.toString(),
        remainingWei: remainingWei.toString(),
        remainingAmountMYR
      });
      
    } catch (error) {
      console.error('Failed to fetch pool details:', error);
      setError('Failed to fetch pool details. Please try again later.');
    } finally {
      setIsPoolDetailsLoading(false);
    }
  };

  // Fetch ETH price from CoinGecko
  const fetchEthPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const price = await getEthPriceInMYR();
      setEthPrice(price);
      
      // Update remainingAmountMYR when ETH price changes
      if (poolDetails) {
        const remainingAmountMYR = (parseFloat(poolDetails.remainingAmount) * price).toFixed(2);
        setPoolDetails({
          ...poolDetails,
          remainingAmountMYR
        });
      }
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      setError('Failed to fetch current ETH price. Please try again later.');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Handle preset amount selection
  const handlePresetAmount = (presetAmount: string) => {
    if (!poolDetails || !ethPrice) return;
    
    if (presetAmount === 'max') {
      // Set to remaining amount in MYR
      setAmount(poolDetails.remainingAmountMYR || '0');
    } else {
      // Check if preset amount exceeds remaining amount in MYR
      const amountValue = parseFloat(presetAmount);
      const remainingValue = parseFloat(poolDetails.remainingAmountMYR || '0');
      
      if (amountValue > remainingValue) {
        // If preset exceeds remaining, set to remaining amount
        setAmount(poolDetails.remainingAmountMYR || '0');
      } else {
        setAmount(presetAmount);
      }
    }
  };

  // Calculate ETH amount based on MYR amount and current ETH price
  const calculateEthAmount = () => {
    if (!amount || !ethPrice || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setEthAmount('0');
      return;
    }

    const amountInMYR = parseFloat(amount);
    const ethAmountValue = amountInMYR / ethPrice;
    setEthAmount(ethAmountValue.toFixed(8)); // 8 decimal places for ETH
  };

  // Function to interact with blockchain contract for donation
  const processDonationOnChain = async () => {
    try {
      if (!ethAmount || !poolDetails) {
        return {
          success: false,
          error: "Invalid donation amount or pool details not available"
        };
      }
      
      // Convert the ETH amount to wei
      const amountInWei = ethers.parseEther(ethAmount || '0');
      
      // Ensure we don't exceed the remaining amount
      const remainingWei = BigInt(poolDetails.remainingWei || '0');
      if (amountInWei > remainingWei) {
        console.log(`Amount exceeds remaining: ${amountInWei} > ${remainingWei}`);
        return {
          success: false,
          error: "Donation amount exceeds the remaining available amount"
        };
      }
      
      // For display purposes
      const displayAmount = amount;
      console.log(`Converting RM${displayAmount} to ${ethAmount} ETH (${amountInWei.toString()} wei) at rate of RM${ethPrice}/ETH`);
      console.log(`Remaining pool amount: ${ethers.formatEther(remainingWei)} ETH (${remainingWei.toString()} wei)`);
      
      // Create provider and connect to the network
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Get the private key from environment variables and ensure it has 0x prefix
      let privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY || "";
      
      // Add 0x prefix if it's missing
      if (privateKey && !privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`;
      }
      
      // Create a wallet with the private key
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Check if wallet has sufficient balance
      const walletBalance = await provider.getBalance(wallet.address);
      console.log("Wallet balance:", ethers.formatEther(walletBalance), "ETH");
      
      if (walletBalance < amountInWei) {
        console.error("Insufficient wallet balance");
        return {
          success: false,
          error: "Insufficient wallet balance to complete the transaction"
        };
      }
      
      // Create the contract instance with proper connection
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);
      
      // Log some debugging information
      console.log("Contract address:", CONTRACT_ADDRESS);
      console.log("Wallet address:", wallet.address);
      console.log("Pool ID to donate to:", poolId);
      console.log("Donation amount in wei:", amountInWei.toString());
      
      try {
        // Call the donate function on the contract with ETH value in wei
        const tx = await contract.donate(parseInt(poolId), {
          value: amountInWei,
          gasLimit: BigInt(300000)
        });
        
        console.log("Transaction sent:", tx.hash);
        
        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        
        console.log("Transaction confirmed:", receipt);
        
        // After successful donation, refresh the pool details
        await fetchPoolDetails();
        
        return {
          success: true,
          txHash: tx.hash,
          displayAmount: displayAmount,
          ethAmount: ethAmount
        };
      } catch (contractError) {
        console.error("Contract call error:", contractError);
        
        // Extract the revert reason if possible
        let errorMessage = "Contract transaction failed";
        
        // Any contract error can be cast to have these potential properties
        interface ContractErrorWithData {
          message: string;
          data?: string;
          reason?: string;
          code?: string;
        }
        
        // Use the error properties more safely
        const ethersError = contractError as ContractErrorWithData;
        if (ethersError.message) {
          errorMessage = ethersError.message;
          
          // Try to extract revert reason if available
          if (ethersError.reason) {
            errorMessage += ` - Reason: ${ethersError.reason}`;
          } else if (ethersError.data) {
            errorMessage += ` - Data: ${ethersError.data}`;
          } else if (ethersError.code) {
            errorMessage += ` - Code: ${ethersError.code}`;
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error("Blockchain donation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails({
      ...bankDetails,
      [name]: value,
    });
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentMethod === 'fpx') {
      if (!selectedBank) {
        setError('Please select a bank');
        return;
      }

      try {
        setError('');
        setIsLoading(true);
        
        // Show the confirmation screen first
        setShowConfirmation(true);
        setPaymentStatus('processing');
        // Reset verification clicked state when starting a new donation
        setVerificationClicked(false);
        
        // Processing times are now managed in the confirmation button click handler
        setIsLoading(false);
      } catch (err) {
        console.error('Donation error:', err);
        setError('Failed to process payment: ' + (err instanceof Error ? err.message : String(err)));
        setIsLoading(false);
        setPaymentStatus('failed');
      }
    } else if (paymentMethod === 'bank') {
      // Simulate bank payment processing
      setIsLoading(true);
      
      // Validate bank details
      if (!bankDetails.cardNumber || !bankDetails.expiryDate || !bankDetails.cvv || !bankDetails.name) {
        setError('Please fill all payment details');
        setIsLoading(false);
        return;
      }
      
      // Show the confirmation screen first
      setShowConfirmation(true);
      setPaymentStatus('processing');
      // Reset verification clicked state when starting a new donation
      setVerificationClicked(false);
      
      // We'll let the confirmation button handle the rest of the process
      setIsLoading(false);
    }
  };
  
  const handleSecureVerificationClick = () => {
    setVerificationClicked(true);
  };
  
  // Handle "Go back" action from confirmation screen
  const handleGoBack = () => {
    if (paymentStatus === 'processing') {
      // If still processing, cancel the process
      setShowConfirmation(false);
      setIsLoading(false);
    } else {
      // If completed or failed, close confirmation and modal
      setShowConfirmation(false);
      setShowModal(false);
      
      // Reset form state and call onSuccess callback if payment was successful
      if (paymentStatus === 'success') {
        setAmount('');
        if (onSuccess) onSuccess();
      }
    }
  };

  // Handle confirmation button click with blockchain transaction
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    
    // For FPX, simulate processing first
    setTimeout(async () => {
      // After UI simulation, process actual blockchain transaction
      try {
        const result = await processDonationOnChain();
        
        if ('success' in result && result.success) {
          setTxHash(result.txHash);
          setPaymentStatus('success');
          
          // Remove the automatic timeout that closes the payment modal
          // setTimeout(() => {
          //   setShowConfirmation(false);
          //   setShowModal(false);
          //   setAmount('');
          //   if (onSuccess) onSuccess();
          // }, 5000);
        } else {
          // Ensure we never pass undefined to setError
          const errorMessage = 'error' in result && result.error ? result.error : 'Transaction failed';
          setError(errorMessage);
          setPaymentStatus('failed');
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setError('Failed to process payment: ' + (err instanceof Error ? err.message : String(err)));
        setPaymentStatus('failed');
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 px-4 bg-[#ed6400] hover:bg-[#d15800] text-white font-medium rounded-md transition"
      >
        Donate Now
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6 my-8">
              {/* Payment Confirmation Screen - shows after clicking Confirm */}
              {showConfirmation ? (
                <div className="w-full">
                  {/* Header */}
                  <div className="bg-[#2b5329] text-[#ffcc00] p-4 -m-5 mb-4 rounded-t-md">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Bank Online Payment</h2>
                      {paymentStatus === 'success' && (
                        <span className="text-sm px-2 py-1 bg-green-700 text-white rounded">
                          Logout
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-center mb-6">Online Payment</h3>
                  
                  {/* Payment Details */}
                  <div className="border rounded-md p-4 mb-6">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-gray-700">Organization:</div>
                      <div className="text-right font-medium">Fund</div>
                      
                      <div className="text-gray-700">Bill account no.:</div>
                      <div className="text-right font-medium">{poolId.padStart(4, '0')}</div>
                      
                      <div className="text-gray-700">Amount (MYR):</div>
                      <div className="text-right font-medium">RM{amount}</div>
                      
                      <div className="text-gray-700">Amount (ETH):</div>
                      <div className="text-right font-medium">{ethAmount} ETH</div>
                      
                      <div className="text-gray-700">ETH Rate:</div>
                      <div className="text-right font-medium">RM{ethPrice?.toFixed(2)}/ETH</div>
                      
                      <div className="text-gray-700">Effective date:</div>
                      <div className="text-right font-medium">Today</div>
                      
                      <div className="text-gray-700">TAC</div>
                      <div className="text-right">
                        <div className="w-5 h-5 bg-blue-500 text-white rounded inline-flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Secure Verification */}
                  <div 
                    className={`bg-[#fffce3] p-4 rounded-md mb-6 cursor-pointer transition ${!verificationClicked ? 'hover:bg-[#fff9d1]' : ''}`} 
                    onClick={!verificationClicked && paymentStatus === 'processing' ? handleSecureVerificationClick : undefined}
                  >
                    <div className="flex items-start">
                      <div className="mr-2">
                        <div className={`w-5 h-5 rounded-full border-2 ${verificationClicked ? 'border-green-500' : 'border-gray-400'} flex items-center justify-center`}>
                          <div className={`w-2 h-2 ${verificationClicked ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="font-semibold">Secure Verification</span>
                          <span className="ml-1 text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">i</span>
                        </div>
                        <p className="text-sm mt-1">
                          {!verificationClicked && paymentStatus === 'processing' ? (
                            "Click here to authorize this transaction"
                          ) : paymentStatus === 'processing' ? (
                            "You will receive a notification on your phone to authorise this transaction on the new Maybank app."
                          ) : paymentStatus === 'success' ? (
                            "Your transaction has been authorized and completed successfully."
                          ) : (
                            "Transaction authorization failed. Please try again."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Message */}
                  {paymentStatus !== 'processing' && (
                    <div className={`p-3 rounded-md mb-6 text-center ${paymentStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {paymentStatus === 'success' 
                        ? `Donation of RM${amount} (${ethAmount} ETH) recorded successfully!` 
                        : 'Payment failed. Please try again.'}
                      
                      {/* Show transaction hash if available */}
                      {paymentStatus === 'success' && txHash && (
                        <div className="mt-2 text-xs break-all">
                          <p>Transaction Hash:</p>
                          <p className="font-mono">{txHash}</p>
                          <p className="mt-2 text-gray-600">Your donation was processed at rate of RM{ethPrice?.toFixed(2)}/ETH</p>
                        </div>
                      )}
                      
                      {/* Show detailed error if available */}
                      {paymentStatus === 'failed' && error && error.length > 0 && (
                        <div className="mt-2 text-xs break-all">
                          <p>Error details:</p>
                          <p className="font-mono">{error}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Download Receipt Button - Only show after successful payment */}
                  {paymentStatus === 'success' && (
                    <div className="mb-6">
                      <button
                        onClick={() => downloadReceipt(
                          poolId, 
                          amount, 
                          selectedBank ? banks.find(b => b.id === selectedBank)?.name || 'Bank' : 'Bank',
                          ethAmount,
                          ethPrice?.toFixed(2) || '0'
                        )}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex justify-center items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Receipt
                      </button>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-center items-center space-x-4">
                    {paymentStatus === 'processing' ? (
                      <>
                        <button
                          onClick={handleConfirmPayment}
                          className={`px-6 py-2 bg-[#ffcc00] text-gray-900 font-medium rounded-md ${!verificationClicked || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e6b800]'}`}
                          disabled={!verificationClicked || isLoading}
                        >
                          {isLoading ? 'Processing...' : 'Confirm'}
                        </button>
                        <span className="text-gray-700">or</span>
                        <button
                          onClick={handleGoBack}
                          className="text-blue-600 hover:underline"
                        >
                          Go back
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleGoBack}
                        className="px-6 py-2 bg-[#ffcc00] text-gray-900 font-medium rounded-md hover:bg-[#e6b800]"
                      >
                        {paymentStatus === 'success' ? 'Close' : 'Try Again'}
                      </button>
                    )}
                  </div>

                  {!verificationClicked && paymentStatus === 'processing' && (
                    <div className="text-center mt-3 text-sm text-amber-700">
                      Please click on Secure Verification above to continue
                    </div>
                  )}
                </div>
              ) : (
                // Original Payment Options Screen
                <div className="mt-3 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Donate to Pool #{poolId}</h3>
                  
                  <div className="mt-4 px-4">
                    <p className="text-sm text-gray-500 mb-3 text-center">
                      Enter the amount you want to donate (in MYR)
                    </p>
                    
                    {/* Preset Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {presetAmounts.map((preset) => {
                        // Determine if button should be disabled
                        const isDisabled = isPoolDetailsLoading || 
                          !poolDetails || 
                          !ethPrice ||
                          (preset.value !== 'max' && 
                            parseFloat(preset.value) > parseFloat(poolDetails?.remainingAmountMYR || '0'));
                        
                        return (
                          <button
                            key={preset.value}
                            onClick={() => handlePresetAmount(preset.value)}
                            disabled={isDisabled}
                            className={`py-2 px-2 rounded-md text-sm font-medium transition
                              ${isDisabled 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#ed6400] text-white hover:bg-[#d15800]'}`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Ensure amount doesn't exceed remaining amount in MYR
                        if (poolDetails && poolDetails.remainingAmountMYR && 
                            parseFloat(inputValue) > parseFloat(poolDetails.remainingAmountMYR)) {
                          setAmount(poolDetails.remainingAmountMYR);
                        } else {
                          setAmount(inputValue);
                        }
                      }}
                      placeholder="Amount in MYR"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                      step="1"
                      min="1"
                      max={poolDetails?.remainingAmountMYR}
                    />
                    
                    {/* Pool details information */}
                    {isPoolDetailsLoading ? (
                      <p className="mt-2 text-xs text-gray-500 text-center">Loading pool details...</p>
                    ) : poolDetails && ethPrice && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="flex justify-between items-center">
                          <span>Target amount:</span>
                          <span>{parseFloat(poolDetails.targetAmount).toFixed(2)} ETH (≈RM{(parseFloat(poolDetails.targetAmount) * ethPrice).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total collected:</span>
                          <span>{parseFloat(poolDetails.totalDonated).toFixed(2)} ETH (≈RM{(parseFloat(poolDetails.totalDonated) * ethPrice).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center font-medium">
                          <span>Remaining:</span>
                          <span>{parseFloat(poolDetails.remainingAmount).toFixed(2)} ETH (≈RM{poolDetails.remainingAmountMYR})</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Show ETH equivalent */}
                    {ethPrice && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                      <div className="mt-2 text-sm text-gray-600 flex justify-between items-center px-1">
                        <span>Equivalent in ETH:</span>
                        <span className="font-medium">≈ {ethAmount} ETH</span>
                      </div>
                    )}
                    
                    {isLoadingPrice && (
                      <p className="mt-2 text-xs text-gray-500 text-center">Loading current ETH price...</p>
                    )}
                    
                    {ethPrice && (
                      <p className="mt-1 text-xs text-gray-500 text-center">
                        Current ETH price: RM{ethPrice.toFixed(2)}/ETH
                        <button 
                          onClick={fetchEthPrice} 
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          disabled={isLoadingPrice}
                        >
                          {isLoadingPrice ? 'Updating...' : '↻'}
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 px-4">
                    <p className="text-sm text-gray-500 mb-2">Select payment method:</p>
                    <div className="flex space-x-4">
                      <div 
                        className={`flex-1 p-3 border rounded-md cursor-pointer transition ${paymentMethod === 'fpx' ? 'border-[#ed6400] bg-orange-50' : 'border-gray-300'}`}
                        onClick={() => setPaymentMethod('fpx')}
                      >
                        <div className="text-center">
                          <p className="font-medium">FPX</p>
                          <p className="text-xs text-gray-500 mt-1">Online Banking</p>
                        </div>
                      </div>
                      <div 
                        className={`flex-1 p-3 border rounded-md cursor-pointer transition ${paymentMethod === 'bank' ? 'border-[#ed6400] bg-orange-50' : 'border-gray-300'}`}
                        onClick={() => setPaymentMethod('bank')}
                      >
                        <div className="text-center">
                          <p className="font-medium">Bank Card</p>
                          <p className="text-xs text-gray-500 mt-1">Credit/Debit</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'fpx' && (
                    <div className="mt-4 px-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Select your bank:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {banks.map((bank) => (
                          <div 
                            key={bank.id}
                            className={`p-3 border rounded-md cursor-pointer transition flex flex-col items-center justify-center ${selectedBank === bank.id ? 'border-[#ed6400] bg-orange-50' : 'border-gray-300'}`}
                            onClick={() => setSelectedBank(bank.id)}
                          >
                            <div className="relative h-10 w-full mb-2">
                              <Image
                                src={bank.logo}
                                alt={bank.name}
                                fill
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                            <p className="text-xs text-gray-700">{bank.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="mt-4 px-4">
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number</label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={bankDetails.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                            <input
                              type="text"
                              id="expiryDate"
                              name="expiryDate"
                              value={bankDetails.expiryDate}
                              onChange={handleInputChange}
                              placeholder="MM/YY"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">CVV</label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={bankDetails.cvv}
                              onChange={handleInputChange}
                              placeholder="123"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Cardholder Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={bankDetails.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-sm mt-3 px-4 text-center">{error}</p>}
                  
                  <div className="sticky bottom-0 bg-white pt-4 border-t">
                    <button
                      onClick={handleDonate}
                      disabled={isLoading || (paymentMethod === 'fpx' && !selectedBank)}
                      className={`px-4 py-2 bg-[#ed6400] text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-[#d15800] focus:outline-none focus:ring-2 focus:ring-[#ed6400] ${
                        isLoading || (paymentMethod === 'fpx' && !selectedBank) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading 
                        ? 'Processing...' 
                        : paymentMethod === 'fpx' && !selectedBank
                          ? 'Select a Bank First' 
                          : `Confirm ${paymentMethod === 'fpx' ? 'FPX' : 'Card'} Payment`}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 