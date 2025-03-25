import React from 'react';
import { Pool } from '@/utils/poolData';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

interface ProgressTrackingProps {
  pool: Pool;
}

// Define types for the subgraph data
interface FundsReleasedEvent {
  id: string;
  poolId: string;
  amount: string;
  checkpoint: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface PoolCreatedEvent {
  id: string;
  poolId: string;
  name: string;
  blockTimestamp: string;
  transactionHash: string;
}

// GraphQL query to fetch funds released events (checkpoints) for a specific pool
const getFundsReleasedQuery = gql`
  query GetFundsReleased($poolId: String!) {
    fundsReleaseds(
      where: { poolId: $poolId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      poolId
      amount
      checkpoint
      blockTimestamp
      transactionHash
    }
  }
`;

// GraphQL query to fetch pool creation event
const getPoolCreatedQuery = gql`
  query GetPoolCreated($poolId: String!) {
    poolCreateds(
      where: { poolId: $poolId }
      first: 1
    ) {
      id
      poolId
      name
      blockTimestamp
      transactionHash
    }
  }
`;

// Define response types
interface FundsReleasedResponse {
  fundsReleaseds: FundsReleasedEvent[];
}

interface PoolCreatedResponse {
  poolCreateds: PoolCreatedEvent[];
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({ pool }) => {
  // Fetch checkpoints (funds released events) from the subgraph
  const { data: checkpointsData, isLoading: checkpointsLoading } = useQuery({
    queryKey: ['checkpoints', pool.id],
    queryFn: async () => {
      const response = await request<FundsReleasedResponse>(
        SUBGRAPH_URL,
        getFundsReleasedQuery,
        { poolId: pool.id }
      );
      return response.fundsReleaseds;
    }
  });
  
  // Fetch pool creation data
  const { data: poolCreationData, isLoading: poolCreationLoading } = useQuery({
    queryKey: ['poolCreated', pool.id],
    queryFn: async () => {
      const response = await request<PoolCreatedResponse>(
        SUBGRAPH_URL,
        getPoolCreatedQuery,
        { poolId: pool.id }
      );
      return response.poolCreateds[0];
    }
  });
  
  // Function to format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('en-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Prepare timeline events combining both funds released events and pool creation
  const timelineEvents = React.useMemo(() => {
    const events = [];
    
    // Add checkpoint events
    if (checkpointsData && checkpointsData.length > 0) {
      checkpointsData.forEach((event: FundsReleasedEvent, index: number) => {
        events.push({
          date: formatTimestamp(event.blockTimestamp),
          status: `Checkpoint: ${event.checkpoint}`,
          description: `${(parseInt(event.amount) / 1e18).toFixed(2)} ETH released`,
          isCompleted: true,
          highlight: index === 0, // Highlight the most recent checkpoint
          icon: 'check',
          transactionHash: event.transactionHash
        });
      });
    }
    
    // Add pool creation event
    if (poolCreationData) {
      events.push({
        date: formatTimestamp(poolCreationData.blockTimestamp),
        status: 'Campaign Created',
        description: `Campaign "${poolCreationData.name}" has been created`,
        isCompleted: true,
        highlight: false,
        icon: 'create',
        transactionHash: poolCreationData.transactionHash
      });
    }
    
    return events;
  }, [checkpointsData, poolCreationData]);
  
  if (checkpointsLoading || poolCreationLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 my-6">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Campaign Progress</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <h2 className="text-2xl font-bold mb-6 border-b pb-4">Campaign Progress</h2>
      
      {/* Timeline tracking */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-[1px] bg-gray-200"></div>
        
        {/* Timeline events */}
        <div>
          {timelineEvents.length > 0 ? timelineEvents.map((event, index) => (
            <div key={index} className="flex mb-8 relative">
              {/* Timeline dot/icon */}
              <div className="flex-shrink-0 mr-4">
                {event.icon === 'check' ? (
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : event.icon === 'create' ? (
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
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
                
                {/* View Transaction link */}
                <div className="mt-1">
                  <a 
                    href={`https://sepolia.scrollscan.com/tx/${event.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Transaction
                  </a>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-6 text-center text-gray-500">
              No checkpoints recorded for this campaign yet.
            </div>
          )}
        </div>
      </div>
      
      {timelineEvents.length > 5 && (
        <div className="mt-2 text-center">
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            See More
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressTracking; 