'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface DonateButtonProps {
  poolId: string;
  onSuccess?: () => void;
}

export default function DonateButton({ poolId, onSuccess }: DonateButtonProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'fpx' | 'bank'>('fpx');
  const [selectedBank, setSelectedBank] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');

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
        
        // Simulate FPX processing
        setTimeout(() => {
          setIsLoading(false);
          setPaymentStatus('success');
          
          // Close everything after 3 seconds on success
          setTimeout(() => {
            setShowConfirmation(false);
            setShowModal(false);
            setAmount('');
            if (onSuccess) onSuccess();
          }, 3000);
        }, 2500);
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
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        setPaymentStatus('success');
        
        // Close everything after 3 seconds on success
        setTimeout(() => {
          setShowConfirmation(false);
          setShowModal(false);
          setAmount('');
          if (onSuccess) onSuccess();
        }, 3000);
      }, 2500);
    }
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
    }
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            
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
                    <div className="text-gray-700">From Account:</div>
                    <div className="text-right font-medium">SA-i</div>
                    
                    <div className="text-gray-700">Corporation Name:</div>
                    <div className="text-right font-medium">Zakat System</div>
                    
                    <div className="text-gray-700">Bill account no.:</div>
                    <div className="text-right font-medium">ZKT-{poolId.padStart(4, '0')}</div>
                    
                    <div className="text-gray-700">Amount:</div>
                    <div className="text-right font-medium">RM{amount}</div>
                    
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
                <div className="bg-[#fffce3] p-4 rounded-md mb-6">
                  <div className="flex items-start">
                    <div className="mr-2">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold">Secure Verification</span>
                        <span className="ml-1 text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">i</span>
                      </div>
                      <p className="text-sm mt-1">
                        {paymentStatus === 'processing' ? (
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
                      ? 'Payment successful! Thank you for your donation.' 
                      : 'Payment failed. Please try again.'}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-center items-center space-x-4">
                  {paymentStatus === 'processing' ? (
                    <>
                      <button
                        className={`px-6 py-2 bg-[#ffcc00] text-gray-900 font-medium rounded-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e6b800]'}`}
                        disabled={isLoading}
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
              </div>
            ) : (
              // Original Payment Options Screen
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Donate to Pool #{poolId}</h3>
                
                <div className="mt-4 px-4">
                  <p className="text-sm text-gray-500 mb-3 text-center">
                    Enter the amount you want to donate
                  </p>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#ed6400] focus:border-[#ed6400] sm:text-sm"
                    step="1"
                    min="1"
                  />
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
                
                <div className="items-center px-4 py-3 mt-4">
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
      )}
    </>
  );
} 