import React from 'react';
import ProgressBar from './ProgressBar';

interface FundingStatsProps {
  status?: string;
  currentAmount?: number;
  targetAmount?: number;
  percentageRaised?: number;
  investors?: number;
  largestInvestment?: number;
  daysLeft?: number;
}

const FundingStats: React.FC<FundingStatsProps> = ({
  status = 'Live',
  currentAmount = 364000,
  targetAmount = 1601600,
  percentageRaised = 23,
  investors = 10,
  largestInvestment = 124800,
  daysLeft = 7,
}) => {
  return (
    <div className="w-full h-full bg-white p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
          <svg className="w-3 h-3 mr-1.5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14"></path>
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14"></path>
          </svg>
          {status}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-1">
          RM {currentAmount.toLocaleString()}
        </h2>
        <p className="text-sm text-gray-600 uppercase">
          {percentageRaised}% OF THE MIN.TARGET (RM {targetAmount.toLocaleString()})
        </p>
        <div className="mt-2">
          <ProgressBar percentage={percentageRaised} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-2xl font-bold mb-1">{investors}</div>
          <div className="text-sm text-gray-600 uppercase">Donaters</div>
        </div>

        <div>
          <div className="text-2xl font-bold mb-1">RM {largestInvestment.toLocaleString()}</div>
          <div className="text-sm text-gray-600 uppercase">Largest Donation</div>
        </div>

        <div>
          <div className="flex items-start">
            <div className="text-2xl font-bold mb-1">{daysLeft} days</div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1 mt-2 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 uppercase">Days Left</div>
        </div>

        <div>
          <button className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-3 px-4 rounded">Donate Now</button>
        </div>
      </div>
    </div>
  );
};

export default FundingStats; 