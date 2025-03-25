import React from 'react';
import { Pool } from '@/utils/poolData';

interface ProgressTrackingProps {
  pool: Pool;
}

// Timeline events for the crowdfunding campaign
const timelineEvents = [
  {
    date: '10-03-2023 15:57',
    status: 'Fully Funded',
    description: 'Target amount has been reached',
    isCompleted: true,
    highlight: true,
    icon: 'check'
  },
  {
    date: '08-03-2023 12:24',
    status: 'In Progress',
    description: 'Campaign is progressing well',
    isCompleted: true,
    highlight: false,
    icon: 'chat'
  },
  {
    date: '05-03-2023 08:40',
    status: 'Campaign Promoted',
    description: 'Campaign featured on homepage',
    isCompleted: false,
    highlight: false,
    icon: null
  },
  {
    date: '03-03-2023 04:05',
    status: 'First Donations',
    description: 'First supporters joined the campaign',
    isCompleted: false,
    highlight: false,
    icon: null
  },
  {
    date: '02-03-2023 23:43',
    status: 'Campaign Approved',
    description: 'Campaign verification completed',
    isCompleted: false,
    highlight: false,
    icon: null
  },
  {
    date: '01-03-2023 19:27',
    status: 'Campaign Created',
    description: 'Campaign has been created by initiator',
    isCompleted: false,
    highlight: false,
    icon: null
  }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProgressTracking: React.FC<ProgressTrackingProps> = ({ pool }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <h2 className="text-2xl font-bold mb-6 border-b pb-4">Campaign Progress</h2>
      
      {/* Timeline tracking */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-[1px] bg-gray-200"></div>
        
        {/* Timeline events */}
        <div>
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex mb-8 relative">
              {/* Timeline dot/icon */}
              <div className="flex-shrink-0 mr-4">
                {event.isCompleted && event.icon === 'check' ? (
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : event.isCompleted && event.icon === 'chat' ? (
                  <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center z-10">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  </div>
                )}
              </div>

              {/* Event content */}
              <div className="flex-grow pt-1">
                <div className="text-sm text-gray-600 font-medium">
                  {event.date}
                </div>
                
                <div className={`font-medium ${
                  event.highlight ? 'text-green-600' : 'text-gray-700'
                }`}>
                  {event.status}
                </div>
                
                <div className="text-gray-600 text-sm">
                  {event.description}
                </div>
                
                {/* Add View Proof of Funding link for the first item */}
                {index === 0 && event.highlight && (
                  <div className="mt-1">
                    <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Proof of Funding
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* See More button */}
      <div className="mt-2 text-center">
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          See More
        </button>
      </div>
    </div>
  );
};

export default ProgressTracking; 